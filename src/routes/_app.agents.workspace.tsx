import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bot, Send, ArrowLeft, BookmarkPlus, CircleDot, User as UserIcon,
  Sparkles, Check, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  PLATFORMS, PLATFORM_CHIP, SUBTYPE_LABEL, SUBTYPE_CLS,
  type Platform, type TaskSubType, type TaskTemplate,
  templatesActions, fmtNow, shortTime, uid,
} from "@/lib/operations-store";

export const Route = createFileRoute("/_app/agents/workspace")({
  component: AgentWorkspacePage,
  head: () => ({ meta: [{ title: "智能体工作台 — BooPilot" }] }),
});

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  ts: string;
}

interface Draft {
  scenario?: string;        // round 1
  platforms?: Platform[];   // round 2
  subtype?: TaskSubType;    // round 3
  total?: number;           // round 3
  name?: string;            // inferred
}

const initialChat = (): ChatMessage[] => [
  {
    id: uid("m"),
    role: "agent",
    content:
      `你好，我是「账号运营助手」，将与你一起创建任务模版。\n请先告诉我：这个任务模版用于什么业务场景？例如「节日营销触达」「日常养号」「新品种草」等。`,
    ts: fmtNow(),
  },
];

const inferPlatforms = (text: string): Platform[] => {
  const t = text.toLowerCase();
  const hit: Platform[] = [];
  if (/facebook|fb/.test(t)) hit.push("Facebook");
  if (/tiktok|tk|抖音/.test(t)) hit.push("Tiktok");
  if (/whatsapp|wa/.test(t)) hit.push("WhatsApp");
  if (/instagram|ins|ig/.test(t)) hit.push("Instagram");
  if (/twitter|x\b|推特/.test(t)) hit.push("Twitter/X");
  return hit;
};

const inferSubtype = (text: string): TaskSubType => {
  return /周期|养号|每日|nurture|日常/.test(text) ? "nurture" : "action";
};

const inferTotal = (text: string): number => {
  const m = text.match(/(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 10;
};

function AgentWorkspacePage() {
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(0); // 0: waiting for scenario, 1: platforms, 2: type/count, 3: confirm
  const [draft, setDraft] = useState<Draft>({});
  const [thinking, setThinking] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, thinking, confirming]);

  const pushAgent = (content: string) =>
    setChat((p) => [...p, { id: uid("m"), role: "agent", content, ts: fmtNow() }]);
  const pushUser = (content: string) =>
    setChat((p) => [...p, { id: uid("m"), role: "user", content, ts: fmtNow() }]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || thinking || confirming) return;
    pushUser(text);
    setInput("");
    setThinking(true);
    const current = round;

    setTimeout(() => {
      setThinking(false);
      if (current === 0) {
        const name = text.length > 20 ? text.slice(0, 20) : text;
        setDraft((d) => ({ ...d, scenario: text, name }));
        setRound(1);
        pushAgent(
          `明白了，目标场景：「${text}」。\n第 2 步：请告诉我需要覆盖哪些平台？可填多个，例如「Facebook、Tiktok」。`,
        );
        return;
      }
      if (current === 1) {
        const platforms = inferPlatforms(text);
        const finalPlatforms = platforms.length > 0 ? platforms : ["Facebook" as Platform];
        setDraft((d) => ({ ...d, platforms: finalPlatforms }));
        setRound(2);
        pushAgent(
          `已锁定平台：${finalPlatforms.join(" / ")}。\n第 3 步：这是「单次触达」还是「周期性养号」任务？预计执行数量大约多少？例如「单次触达，50 条」。`,
        );
        return;
      }
      if (current === 2) {
        const subtype = inferSubtype(text);
        const total = inferTotal(text);
        setDraft((d) => ({ ...d, subtype, total }));
        setRound(3);
        setConfirming(true);
        pushAgent(
          `已收集完所有信息，以下是即将创建的任务模版方案，请确认：\n• 模版名称：${draft.name ?? "未命名模版"}\n• 业务场景：${draft.scenario ?? "-"}\n• 任务类型：${SUBTYPE_LABEL[subtype]}\n• 覆盖平台：${(draft.platforms ?? []).join(" / ")}\n• 默认数量：${total}\n\n确认无误请点击下方「确认创建」，或继续在对话中调整。`,
        );
        return;
      }
      // After round 3 — allow free-form tweaks before confirm
      pushAgent(
        `已记录你的补充：「${text}」。如果方案已确认，请点击下方「确认创建」按钮。`,
      );
    }, 600);
  };

  const resetAll = () => {
    setChat(initialChat());
    setDraft({});
    setRound(0);
    setConfirming(false);
    setInput("");
  };

  const confirmCreate = () => {
    const { name, scenario, platforms, subtype, total } = draft;
    if (!name || !platforms || !subtype || !total) {
      toast.error("信息尚未收集完整");
      return;
    }
    const tpl: TaskTemplate = {
      id: uid("tpl"),
      name,
      subtype,
      platforms,
      total,
      description: scenario ?? "",
      createdAt: fmtNow(),
      uses: 0,
    };
    templatesActions.add(tpl);
    toast.success(`已创建任务模版「${tpl.name}」`);
    navigate({ to: "/tasks/templates" });
  };

  const progress = useMemo(() => Math.min(round, 3), [round]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">智能体工作台</h1>
            <Badge variant="outline" className="gap-1 border-violet-300/40 bg-violet-500/10 text-violet-600">
              <Sparkles className="h-3 w-3" />任务模版创建
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            通过与「账号运营助手」对话，逐步明确目标场景、平台、类型与数量，三轮交互后即可一键创建任务模版。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/tasks/templates"><ArrowLeft className="h-4 w-4" />返回任务模版</Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Chat */}
        <div className="flex h-[680px] min-w-0 flex-col rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">账号运营助手</h3>
                <span className="flex items-center gap-1 text-[10px] text-success">
                  <CircleDot className="h-2.5 w-2.5 fill-current" />在线
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">引导式三轮对话，协助你完成任务模版创建</p>
            </div>
            <Button size="sm" variant="ghost" onClick={resetAll} className="h-8 gap-1 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />重新开始
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-4 p-4">
              {chat.map((m) => <ChatBubble key={m.id} msg={m} />)}
              {thinking && (
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                </div>
              )}
              {confirming && (
                <div className="ml-9 flex flex-wrap gap-2">
                  <Button size="sm" onClick={confirmCreate} className="h-8 gap-1 text-xs">
                    <Check className="h-3.5 w-3.5" />确认创建
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetAll} className="h-8 gap-1 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" />重新开始
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={
                  round === 0 ? "描述任务模版的业务场景..."
                    : round === 1 ? "输入需要覆盖的平台，例如：Facebook、Tiktok"
                    : round === 2 ? "输入任务类型与数量，例如：单次触达，50 条"
                    : "可继续补充说明，或直接点击「确认创建」"
                }
                className="min-h-[100px] resize-none pr-12"
              />
              <div className="absolute bottom-2 right-2">
                <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={!input.trim() || thinking}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Side: Draft preview & progress */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-semibold">对话进度</h3>
            <ol className="space-y-2 text-xs">
              {["业务场景", "覆盖平台", "类型与数量", "确认创建"].map((label, i) => {
                const reached = progress >= i;
                const active = progress === i && !(confirming && i === 3);
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      active && "ring-2 ring-primary/30",
                    )}>{i + 1}</span>
                    <span className={cn(reached ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold">模版预览</h3>
            </div>
            <dl className="space-y-2 text-xs">
              <Field label="模版名称" value={draft.name} />
              <Field label="业务场景" value={draft.scenario} />
              <Field label="任务类型" value={draft.subtype ? (
                <Badge variant="outline" className={cn("text-[10px] font-normal", SUBTYPE_CLS[draft.subtype])}>
                  {SUBTYPE_LABEL[draft.subtype]}
                </Badge>
              ) : undefined} />
              <Field label="覆盖平台" value={draft.platforms?.length ? (
                <div className="flex flex-wrap gap-1">
                  {draft.platforms.map((p) => (
                    <Badge key={p} variant="outline" className={cn("text-[10px] font-normal", PLATFORM_CHIP[p])}>{p}</Badge>
                  ))}
                </div>
              ) : undefined} />
              <Field label="默认数量" value={draft.total != null ? String(draft.total) : undefined} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
              <span className="text-[11px] text-muted-foreground mr-1">可选平台：</span>
              {PLATFORMS.map((p) => (
                <span key={p} className={cn("rounded-full border px-2 py-0.5 text-[10px]", PLATFORM_CHIP[p])}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right">
        {value ?? <span className="text-muted-foreground/60">待补充</span>}
      </dd>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
      )}>
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn("max-w-[80%] space-y-1.5", isUser && "items-end text-right")}>
        <div className={cn(
          "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
          isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted text-foreground",
        )}>
          {msg.content}
        </div>
        <div className={cn("text-[10px] text-muted-foreground", isUser && "text-right")}>{shortTime(msg.ts)}</div>
      </div>
    </div>
  );
}

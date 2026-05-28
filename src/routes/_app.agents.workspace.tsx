import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bot, Send, ArrowLeft, BookmarkPlus, CircleDot, User as UserIcon,
  Sparkles, Check, RotateCcw, ListChecks, MessageSquare, Wand2, SkipForward,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  PLATFORMS, PLATFORM_CHIP, SUBTYPE_LABEL, SUBTYPE_CLS,
  TEMPLATE_ACTIONS, TEMPLATE_ACTION_LABEL,
  type Platform, type TaskSubType, type TaskTemplate, type TemplateAction,
  templatesActions, fmtNow, shortTime, uid,
} from "@/lib/operations-store";

export const Route = createFileRoute("/_app/agents/workspace")({
  component: AgentWorkspacePage,
  head: () => ({ meta: [{ title: "智能体工作台 — BooPilot" }] }),
});

type Mode = "form" | "guided" | "freeform";

type CountMode = "range" | "fixed";
type NotifyPrefs = { success: boolean; failure: boolean };

interface Draft {
  scenario?: string;
  platforms: Platform[];
  actions: TemplateAction[];
  subtype: TaskSubType;       // action=单次, nurture=周期
  countMode: CountMode;
  countMin?: number;
  countMax?: number;
  countFixed?: number;
  timeStart?: string;         // HH:mm:ss
  timeEnd?: string;
  script?: string;
  constraints?: string;
  notify: NotifyPrefs;
  name?: string;
  extra?: string;             // 补充说明
}

const newDraft = (): Draft => ({
  platforms: [],
  actions: [],
  subtype: "action",
  countMode: "range",
  notify: { success: true, failure: false },
});

interface BubblePayload {
  id: string;
  role: "user" | "agent";
  content?: string;
  // 渲染附件 — 上一次对话流中的 inline 表单/选择器快照（已提交后冻结）
  card?: React.ReactNode;
  ts: string;
}

const greeting = (): BubblePayload => ({
  id: uid("m"),
  role: "agent",
  content:
    `你好，我是「账号运营助手」，将与你一起创建任务模版。\n请你先确认下将采取哪种形式与我沟通：`,
  ts: fmtNow(),
});

const MODE_LABEL: Record<Mode, string> = {
  form: "按程序设定一次性确定所有问题",
  guided: "按程序设定依次确定相关问题",
  freeform: "直接描述",
};

const PROGRESS_STEPS: Record<Mode | "none", string[]> = {
  none: ["选择交互模式", "信息收集", "确认创建"],
  form: ["选择交互模式", "填写完整表单", "确认创建"],
  guided: ["选择交互模式", "业务场景", "核心操作", "执行参数", "高级配置", "命名模版", "确认创建"],
  freeform: ["选择交互模式", "自由描述", "确认创建"],
};

/* ============================================================ */
/* 解析与组装                                                   */
/* ============================================================ */

function suggestName(d: Draft): string {
  const scope = d.scenario?.slice(0, 12) || "运营任务";
  const plat = d.platforms[0] ?? "多平台";
  return `${scope}_${plat}_${SUBTYPE_LABEL[d.subtype]}`;
}

function parseFreeform(text: string): Draft {
  const d = newDraft();
  d.scenario = text.slice(0, 40);
  const lower = text.toLowerCase();
  const platMap: Record<string, Platform> = {
    facebook: "Facebook", fb: "Facebook", "脸书": "Facebook",
    tiktok: "Tiktok", "抖音": "Tiktok",
    whatsapp: "WhatsApp", wa: "WhatsApp",
    instagram: "Instagram", ins: "Instagram", ig: "Instagram",
    twitter: "Twitter/X", "推特": "Twitter/X",
  };
  for (const [k, v] of Object.entries(platMap)) {
    if ((lower.includes(k) || text.includes(k)) && !d.platforms.includes(v)) d.platforms.push(v);
  }
  if (d.platforms.length === 0) d.platforms.push("Facebook");

  const actionMap: Array<[RegExp, TemplateAction]> = [
    [/点赞|like/i, "like"], [/评论|comment/i, "comment"],
    [/关注|follow/i, "follow"], [/发帖|发布|post/i, "post"],
    [/加好友|添加好友|friend/i, "addFriend"], [/私信|dm/i, "dm"],
    [/转发|分享|share/i, "share"], [/浏览|观看|view/i, "view"],
  ];
  for (const [re, a] of actionMap) if (re.test(text) && !d.actions.includes(a)) d.actions.push(a);
  if (d.actions.length === 0) d.actions.push("like");

  d.subtype = /周期|养号|每天|每日|每周|循环|定时/.test(text) ? "nurture" : "action";

  const nm = text.match(/(\d+)\s*(?:条|次|个|账号)/);
  if (nm) { d.countMode = "fixed"; d.countFixed = parseInt(nm[1], 10); }
  else { d.countMode = "range"; d.countMin = 5; d.countMax = 10; }

  d.name = suggestName(d);
  d.extra = text;
  return d;
}

function buildDescription(d: Draft): string {
  const parts: string[] = [];
  if (d.scenario) parts.push(`【业务场景】${d.scenario}`);
  if (d.actions.length) parts.push(`【操作类型】${d.actions.map((a) => TEMPLATE_ACTION_LABEL[a]).join("·")}`);
  if (d.countMode === "fixed" && d.countFixed != null) parts.push(`【执行次数】每账号 ${d.countFixed} 次`);
  else if (d.countMin != null || d.countMax != null) parts.push(`【执行次数】每账号 ${d.countMin ?? "-"} ~ ${d.countMax ?? "-"} 次`);
  if (d.timeStart || d.timeEnd) parts.push(`【执行时段】${d.timeStart ?? "--:--:--"} ~ ${d.timeEnd ?? "--:--:--"}`);
  if (d.script?.trim()) parts.push(`【默认话术】${d.script.trim()}`);
  if (d.constraints?.trim()) parts.push(`【自定义约束】${d.constraints.trim()}`);
  parts.push(`【通知偏好】${[d.notify.success && "完成通知", d.notify.failure && "失败通知"].filter(Boolean).join("、") || "无"}`);
  if (d.extra?.trim()) parts.push(`【补充说明】${d.extra.trim()}`);
  return parts.join("\n");
}

function totalFromDraft(d: Draft): number {
  if (d.countMode === "fixed" && d.countFixed) return d.countFixed;
  if (d.countMax) return d.countMax;
  if (d.countMin) return d.countMin;
  return 10;
}

/* ============================================================ */
/* 主组件                                                       */
/* ============================================================ */

function AgentWorkspacePage() {
  const navigate = useNavigate();
  const [chat, setChat] = useState<BubblePayload[]>([greeting()]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(newDraft());
  const [freeText, setFreeText] = useState("");
  const [extraText, setExtraText] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, confirming, showExtra]);

  const pushAgent = (content: string, card?: React.ReactNode) =>
    setChat((p) => [...p, { id: uid("m"), role: "agent", content, card, ts: fmtNow() }]);
  const pushUser = (content: string) =>
    setChat((p) => [...p, { id: uid("m"), role: "user", content, ts: fmtNow() }]);

  const resetAll = () => {
    setChat([greeting()]);
    setMode(null);
    setStep(0);
    setDraft(newDraft());
    setFreeText("");
    setExtraText("");
    setShowExtra(false);
    setConfirming(false);
  };

  /* ---------- 模式选择 ---------- */
  const pickMode = (m: Mode) => {
    setMode(m);
    setStep(1);
    pushUser(MODE_LABEL[m]);
    if (m === "form") {
      pushAgent("好的，您选择了一次性确定所有问题，请在下方表单中完整填写后提交：");
    } else if (m === "guided") {
      pushAgent("好的，我们按步骤来。\n第 1 步：这个任务模版用于什么业务场景？例如「节日营销触达」「日常养号」「新品种草」等。");
    } else {
      pushAgent("好的，请您描述：目标业务场景、目标平台、目标动作、单次还是周期性、约束条件、通知偏好等，另外记得给您的模版指定一个名称。");
    }
  };

  /* ---------- 模式 A 提交 ---------- */
  const submitFormA = (d: Draft) => {
    setDraft(d);
    pushUser("已提交完整表单");
    setStep(2);
    enterConfirm(d);
  };

  /* ---------- 模式 B 多轮 ---------- */
  const [guidedScenario, setGuidedScenario] = useState("");
  const submitGuidedScenario = () => {
    const t = guidedScenario.trim();
    if (!t) return;
    pushUser(t);
    setDraft((p) => ({ ...p, scenario: t }));
    setGuidedScenario("");
    setStep(2);
    pushAgent(`明白了，目标场景：「${t}」。\n第 2 步：接下来定义核心操作：`);
  };
  const submitGuidedCore = (patch: Partial<Draft>) => {
    const nd = { ...draft, ...patch };
    setDraft(nd);
    pushUser(`平台：${nd.platforms.join(" / ") || "-"}；操作：${nd.actions.map((a) => TEMPLATE_ACTION_LABEL[a]).join("·") || "-"}；模式：${SUBTYPE_LABEL[nd.subtype]}`);
    setStep(3);
    pushAgent("很好，第 3 步：接下来配置执行参数：");
  };
  const submitGuidedParams = (patch: Partial<Draft>) => {
    const nd = { ...draft, ...patch };
    setDraft(nd);
    pushUser("执行参数已填写");
    setStep(4);
    pushAgent("第 4 步：以下是高级配置项（可选，可跳过）：");
  };
  const submitGuidedAdvanced = (patch: Partial<Draft>, skipped = false) => {
    const nd = { ...draft, ...patch };
    setDraft(nd);
    pushUser(skipped ? "跳过高级配置" : "高级配置已填写");
    setStep(5);
    const recommended = suggestName(nd);
    pushAgent(`很好，我们已经完成了所有相关信息的收集。\n第 5 步：给您的模版起个名字吧，我建议命名为「${recommended}」，您可以直接使用或自行修改。`);
    setDraft((p) => ({ ...p, name: recommended }));
  };
  const submitGuidedName = (name: string) => {
    const nd = { ...draft, name: name.trim() || suggestName(draft) };
    setDraft(nd);
    pushUser(`模版名称：${nd.name}`);
    setStep(6);
    enterConfirm(nd);
  };

  /* ---------- 模式 C ---------- */
  const submitFreeform = () => {
    const t = freeText.trim();
    if (!t) return;
    pushUser(t);
    const parsed = parseFreeform(t);
    setDraft(parsed);
    setFreeText("");
    setStep(2);
    enterConfirm(parsed);
  };

  /* ---------- 汇总确认 ---------- */
  const enterConfirm = (d: Draft) => {
    setConfirming(true);
    pushAgent(
      `已收集完成，以下是即将创建的任务模版：\n• 模版名称：${d.name ?? suggestName(d)}\n• 业务场景：${d.scenario ?? "-"}\n• 任务类型：${SUBTYPE_LABEL[d.subtype]}\n• 覆盖平台：${d.platforms.join(" / ") || "-"}\n• 操作类型：${d.actions.map((a) => TEMPLATE_ACTION_LABEL[a]).join("·") || "-"}\n• 默认数量：${totalFromDraft(d)}\n\n请确认创建，或补充信息后再创建。`,
    );
  };

  const doCreate = (withExtra = false) => {
    const finalDraft: Draft = withExtra && extraText.trim()
      ? { ...draft, extra: [draft.extra, extraText.trim()].filter(Boolean).join("\n") }
      : draft;
    const name = finalDraft.name?.trim() || suggestName(finalDraft);
    if (finalDraft.platforms.length === 0) {
      toast.error("至少需要选择一个目标平台");
      return;
    }
    const tpl: TaskTemplate = {
      id: uid("tpl"),
      name,
      subtype: finalDraft.subtype,
      platforms: finalDraft.platforms,
      total: totalFromDraft(finalDraft),
      description: buildDescription(finalDraft),
      createdAt: fmtNow(),
      uses: 0,
      status: "draft",
      agentName: "账号运营助手",
      actions: finalDraft.actions,
      tags: finalDraft.scenario ? [finalDraft.scenario.slice(0, 8)] : [],
      monthlyUses: 0,
    };
    templatesActions.add(tpl);
    toast.success(`已创建任务模版「${tpl.name}」`);
    navigate({ to: "/tasks/templates" });
  };

  const progressSteps = PROGRESS_STEPS[mode ?? "none"];
  const progressIdx = mode ? step : 0;

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
            支持三种交互模式：一次性表单、引导式多轮、自由描述。完成后统一确认即可生成任务模版。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/tasks/templates"><ArrowLeft className="h-4 w-4" />返回任务模版</Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Chat */}
        <div className="flex h-[760px] min-w-0 flex-col rounded-xl border bg-card shadow-[var(--shadow-card)]">
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
              <p className="text-[11px] text-muted-foreground">
                {mode ? `当前模式：${MODE_LABEL[mode]}` : "请选择交互模式以开始"}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={resetAll} className="h-8 gap-1 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />重新开始
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-4 p-4">
              {chat.map((m) => <ChatBubble key={m.id} msg={m} />)}

              {/* 模式选择按钮（首次） */}
              {mode === null && (
                <div className="ml-9 flex flex-wrap gap-2">
                  <ModeButton icon={<ListChecks className="h-3.5 w-3.5" />} onClick={() => pickMode("form")}>
                    {MODE_LABEL.form}
                  </ModeButton>
                  <ModeButton icon={<Wand2 className="h-3.5 w-3.5" />} onClick={() => pickMode("guided")}>
                    {MODE_LABEL.guided}
                  </ModeButton>
                  <ModeButton icon={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => pickMode("freeform")}>
                    {MODE_LABEL.freeform}
                  </ModeButton>
                </div>
              )}

              {/* 模式 A：完整表单 */}
              {mode === "form" && !confirming && (
                <div className="ml-9">
                  <FullFormCard initial={draft} onSubmit={submitFormA} />
                </div>
              )}

              {/* 模式 B：分步表单 */}
              {mode === "guided" && !confirming && step === 1 && (
                <div className="ml-9">
                  <InlineCard title="业务场景">
                    <Textarea
                      value={guidedScenario}
                      onChange={(e) => setGuidedScenario(e.target.value)}
                      placeholder="例如：节日营销触达 / 日常养号 / 新品种草"
                      className="min-h-[72px]"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={submitGuidedScenario} disabled={!guidedScenario.trim()}>
                        下一步
                      </Button>
                    </div>
                  </InlineCard>
                </div>
              )}
              {mode === "guided" && !confirming && step === 2 && (
                <div className="ml-9">
                  <CoreCard draft={draft} onSubmit={submitGuidedCore} />
                </div>
              )}
              {mode === "guided" && !confirming && step === 3 && (
                <div className="ml-9">
                  <ParamsCard draft={draft} onSubmit={submitGuidedParams} />
                </div>
              )}
              {mode === "guided" && !confirming && step === 4 && (
                <div className="ml-9">
                  <AdvancedCard
                    draft={draft}
                    onSubmit={(p) => submitGuidedAdvanced(p, false)}
                    onSkip={() => submitGuidedAdvanced({}, true)}
                  />
                </div>
              )}
              {mode === "guided" && !confirming && step === 5 && (
                <div className="ml-9">
                  <NameCard
                    initial={draft.name ?? suggestName(draft)}
                    onSubmit={submitGuidedName}
                  />
                </div>
              )}

              {/* 模式 C：自由描述 */}
              {mode === "freeform" && !confirming && (
                <div className="ml-9">
                  <InlineCard title="自由描述">
                    <Textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="请尽量完整地描述：业务场景、平台、动作、模式、约束、通知、模版名称…"
                      className="min-h-[140px]"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={submitFreeform} disabled={!freeText.trim()}>
                        提交
                      </Button>
                    </div>
                  </InlineCard>
                </div>
              )}

              {/* 汇总确认 */}
              {confirming && (
                <div className="ml-9 space-y-3">
                  {showExtra && (
                    <InlineCard title="补充说明">
                      <Textarea
                        value={extraText}
                        onChange={(e) => setExtraText(e.target.value)}
                        placeholder="补充内容将追加到模版描述中..."
                        className="min-h-[80px]"
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setShowExtra(false)}>取消</Button>
                        <Button size="sm" onClick={() => doCreate(true)} disabled={!extraText.trim()}>
                          补充并创建
                        </Button>
                      </div>
                    </InlineCard>
                  )}
                  {!showExtra && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => doCreate(false)} className="h-8 gap-1 text-xs">
                        <Check className="h-3.5 w-3.5" />确认创建
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowExtra(true)} className="h-8 gap-1 text-xs">
                        补充信息后创建
                      </Button>
                      <Button size="sm" variant="ghost" onClick={resetAll} className="h-8 gap-1 text-xs">
                        <RotateCcw className="h-3.5 w-3.5" />重新开始
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Side: progress & preview */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-semibold">对话进度</h3>
            <ol className="space-y-2 text-xs">
              {progressSteps.map((label, i) => {
                const reached = progressIdx > i || (confirming && i === progressSteps.length - 1);
                const active = !confirming && progressIdx === i;
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      reached || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      active && "ring-2 ring-primary/30",
                    )}>{i + 1}</span>
                    <span className={cn(reached || active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
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
              <Field label="任务类型" value={
                <Badge variant="outline" className={cn("text-[10px] font-normal", SUBTYPE_CLS[draft.subtype])}>
                  {SUBTYPE_LABEL[draft.subtype]}
                </Badge>
              } />
              <Field label="覆盖平台" value={draft.platforms.length ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {draft.platforms.map((p) => (
                    <Badge key={p} variant="outline" className={cn("text-[10px] font-normal", PLATFORM_CHIP[p])}>{p}</Badge>
                  ))}
                </div>
              ) : undefined} />
              <Field label="操作类型" value={draft.actions.length ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {draft.actions.map((a) => (
                    <Badge key={a} variant="outline" className="text-[10px] font-normal">{TEMPLATE_ACTION_LABEL[a]}</Badge>
                  ))}
                </div>
              ) : undefined} />
              <Field label="默认数量" value={
                draft.countMode === "fixed"
                  ? (draft.countFixed != null ? `${draft.countFixed} 次` : undefined)
                  : ((draft.countMin != null || draft.countMax != null) ? `${draft.countMin ?? "-"} ~ ${draft.countMax ?? "-"} 次` : undefined)
              } />
              <Field label="执行时段" value={(draft.timeStart || draft.timeEnd) ? `${draft.timeStart ?? "--:--:--"} ~ ${draft.timeEnd ?? "--:--:--"}` : undefined} />
              <Field label="通知偏好" value={
                [draft.notify.success && "完成", draft.notify.failure && "失败"].filter(Boolean).join("、") || undefined
              } />
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
              <span className="mr-1 text-[11px] text-muted-foreground">可选平台：</span>
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

/* ============================================================ */
/* 通用组件                                                     */
/* ============================================================ */

function ModeButton({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} className="h-8 gap-1.5 text-xs">
      {icon}{children}
    </Button>
  );
}

function InlineCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-[640px] rounded-xl border bg-background/60 p-4 shadow-sm">
      <h4 className="mb-3 text-xs font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

function PlatformPicker({ value, onChange }: { value: Platform[]; onChange: (v: Platform[]) => void }) {
  const toggle = (p: Platform) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const on = value.includes(p);
        return (
          <button
            type="button"
            key={p}
            onClick={() => toggle(p)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition",
              on ? cn(PLATFORM_CHIP[p], "ring-2 ring-primary/40") : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

function ActionPicker({ value, onChange }: { value: TemplateAction[]; onChange: (v: TemplateAction[]) => void }) {
  const toggle = (a: TemplateAction) => onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATE_ACTIONS.map((a) => {
        const on = value.includes(a);
        return (
          <button
            type="button"
            key={a}
            onClick={() => toggle(a)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition",
              on ? "border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/30" : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {TEMPLATE_ACTION_LABEL[a]}
          </button>
        );
      })}
    </div>
  );
}

function CountInput({ draft, onChange }: { draft: Draft; onChange: (p: Partial<Draft>) => void }) {
  return (
    <div className="space-y-2">
      <RadioGroup
        value={draft.countMode}
        onValueChange={(v) => onChange({ countMode: v as CountMode })}
        className="flex gap-4"
      >
        <label className="flex items-center gap-1.5 text-xs">
          <RadioGroupItem value="range" id="range" />范围
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <RadioGroupItem value="fixed" id="fixed" />限定
        </label>
      </RadioGroup>
      {draft.countMode === "range" ? (
        <div className="flex items-center gap-2 text-xs">
          最少
          <Input
            type="number" min={1}
            value={draft.countMin ?? ""}
            onChange={(e) => onChange({ countMin: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 w-20"
          />
          -
          <Input
            type="number" min={1}
            value={draft.countMax ?? ""}
            onChange={(e) => onChange({ countMax: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 w-20"
          />
          次
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs">
          限定
          <Input
            type="number" min={1}
            value={draft.countFixed ?? ""}
            onChange={(e) => onChange({ countFixed: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 w-24"
          />
          次
        </div>
      )}
    </div>
  );
}

function TimeRange({ draft, onChange }: { draft: Draft; onChange: (p: Partial<Draft>) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Input
        type="time" step={1}
        value={draft.timeStart ?? ""}
        onChange={(e) => onChange({ timeStart: e.target.value })}
        className="h-8 w-32"
      />
      ~
      <Input
        type="time" step={1}
        value={draft.timeEnd ?? ""}
        onChange={(e) => onChange({ timeEnd: e.target.value })}
        className="h-8 w-32"
      />
    </div>
  );
}

function NotifyPicker({ value, onChange }: { value: NotifyPrefs; onChange: (v: NotifyPrefs) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <label className="flex items-center gap-1.5">
        <Checkbox checked={value.success} onCheckedChange={(c) => onChange({ ...value, success: !!c })} />
        任务完成通知
      </label>
      <label className="flex items-center gap-1.5">
        <Checkbox checked={value.failure} onCheckedChange={(c) => onChange({ ...value, failure: !!c })} />
        任务失败通知
      </label>
    </div>
  );
}

/* ============================================================ */
/* 模式 A：完整表单                                             */
/* ============================================================ */

function FullFormCard({ initial, onSubmit }: { initial: Draft; onSubmit: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(initial);
  const patch = (p: Partial<Draft>) => setD((prev) => ({ ...prev, ...p }));
  const ready = d.scenario && d.platforms.length > 0 && d.actions.length > 0;

  return (
    <InlineCard title="任务模版完整表单">
      <div className="grid max-h-[480px] gap-4 overflow-auto pr-1">
        <Block label="1. 业务场景">
          <Textarea
            value={d.scenario ?? ""}
            onChange={(e) => patch({ scenario: e.target.value })}
            placeholder="例如：节日营销触达 / 日常养号 / 新品种草"
            className="min-h-[60px]"
          />
        </Block>
        <Block label="2. 目标平台（可多选）">
          <PlatformPicker value={d.platforms} onChange={(v) => patch({ platforms: v })} />
        </Block>
        <Block label="3. 操作类型（可多选）">
          <ActionPicker value={d.actions} onChange={(v) => patch({ actions: v })} />
        </Block>
        <Block label="4. 执行模式">
          <RadioGroup
            value={d.subtype}
            onValueChange={(v) => patch({ subtype: v as TaskSubType })}
            className="flex gap-4"
          >
            <label className="flex items-center gap-1.5 text-xs">
              <RadioGroupItem value="action" id="sub-a" />单次执行
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <RadioGroupItem value="nurture" id="sub-n" />周期性执行
            </label>
          </RadioGroup>
        </Block>
        <Block label="5. 每账号建议执行次数">
          <CountInput draft={d} onChange={patch} />
        </Block>
        <Block label="6. 建议执行时段">
          <TimeRange draft={d} onChange={patch} />
        </Block>
        <Block label="7. 默认评论话术/互动内容（可选）">
          <Textarea
            value={d.script ?? ""}
            onChange={(e) => patch({ script: e.target.value })}
            placeholder="可后续再配"
            className="min-h-[60px]"
          />
        </Block>
        <Block label="8. 自定义约束条件">
          <Textarea
            value={d.constraints ?? ""}
            onChange={(e) => patch({ constraints: e.target.value })}
            placeholder="例如：仅在工作日执行 / 同一账号 24h 内不重复触达"
            className="min-h-[60px]"
          />
        </Block>
        <Block label="9. 通知偏好">
          <NotifyPicker value={d.notify} onChange={(v) => patch({ notify: v })} />
        </Block>
        <Block label="10. 模版名称">
          <Input
            value={d.name ?? ""}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder={suggestName(d)}
            className="h-8"
          />
        </Block>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => onSubmit({ ...d, name: d.name?.trim() || suggestName(d) })} disabled={!ready}>
          提交
        </Button>
      </div>
    </InlineCard>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ============================================================ */
/* 模式 B：分步表单卡片                                         */
/* ============================================================ */

function CoreCard({ draft, onSubmit }: { draft: Draft; onSubmit: (p: Partial<Draft>) => void }) {
  const [platforms, setPlatforms] = useState<Platform[]>(draft.platforms);
  const [actions, setActions] = useState<TemplateAction[]>(draft.actions);
  const [subtype, setSubtype] = useState<TaskSubType>(draft.subtype);
  return (
    <InlineCard title="核心操作">
      <div className="space-y-4">
        <Block label="目标平台（可多选）">
          <PlatformPicker value={platforms} onChange={setPlatforms} />
        </Block>
        <Block label="操作类型（可多选）">
          <ActionPicker value={actions} onChange={setActions} />
        </Block>
        <Block label="执行模式">
          <RadioGroup value={subtype} onValueChange={(v) => setSubtype(v as TaskSubType)} className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs">
              <RadioGroupItem value="action" id="g-a" />单次执行
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <RadioGroupItem value="nurture" id="g-n" />周期性执行
            </label>
          </RadioGroup>
        </Block>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!platforms.length || !actions.length}
          onClick={() => onSubmit({ platforms, actions, subtype })}>
          下一步
        </Button>
      </div>
    </InlineCard>
  );
}

function ParamsCard({ draft, onSubmit }: { draft: Draft; onSubmit: (p: Partial<Draft>) => void }) {
  const [local, setLocal] = useState<Draft>(draft);
  const patch = (p: Partial<Draft>) => setLocal((prev) => ({ ...prev, ...p }));
  return (
    <InlineCard title="执行参数">
      <div className="space-y-4">
        <Block label="每账号建议执行次数">
          <CountInput draft={local} onChange={patch} />
        </Block>
        <Block label="建议执行时段">
          <TimeRange draft={local} onChange={patch} />
        </Block>
        <Block label="默认评论话术/互动内容（可选）">
          <Textarea
            value={local.script ?? ""}
            onChange={(e) => patch({ script: e.target.value })}
            placeholder="可后续再配"
            className="min-h-[60px]"
          />
        </Block>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => onSubmit({
          countMode: local.countMode, countMin: local.countMin, countMax: local.countMax, countFixed: local.countFixed,
          timeStart: local.timeStart, timeEnd: local.timeEnd, script: local.script,
        })}>下一步</Button>
      </div>
    </InlineCard>
  );
}

function AdvancedCard({ draft, onSubmit, onSkip }: { draft: Draft; onSubmit: (p: Partial<Draft>) => void; onSkip: () => void }) {
  const [constraints, setConstraints] = useState(draft.constraints ?? "");
  const [notify, setNotify] = useState<NotifyPrefs>(draft.notify);
  return (
    <InlineCard title="高级配置（可选）">
      <div className="space-y-4">
        <Block label="自定义约束条件">
          <Textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="例如：仅在工作日执行 / 同一账号 24h 内不重复触达"
            className="min-h-[60px]"
          />
        </Block>
        <Block label="通知偏好">
          <NotifyPicker value={notify} onChange={setNotify} />
        </Block>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onSkip} className="gap-1">
          <SkipForward className="h-3.5 w-3.5" />跳过
        </Button>
        <Button size="sm" onClick={() => onSubmit({ constraints, notify })}>下一步</Button>
      </div>
    </InlineCard>
  );
}

function NameCard({ initial, onSubmit }: { initial: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return (
    <InlineCard title="模版名称">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={initial} className="h-8" />
      <p className="mt-1 text-[11px] text-muted-foreground">推荐名称：{initial}</p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => onSubmit(name)}>完成</Button>
      </div>
    </InlineCard>
  );
}

/* ============================================================ */
/* 通用                                                         */
/* ============================================================ */

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

function ChatBubble({ msg }: { msg: BubblePayload }) {
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
        {msg.content && (
          <div className={cn(
            "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
            isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted text-foreground",
          )}>
            {msg.content}
          </div>
        )}
        <div className={cn("text-[10px] text-muted-foreground", isUser && "text-right")}>{shortTime(msg.ts)}</div>
      </div>
    </div>
  );
}

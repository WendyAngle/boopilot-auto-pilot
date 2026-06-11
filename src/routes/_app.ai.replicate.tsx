import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Upload,
  FolderOpen,
  Sparkles,
  Link2,
  History,
  Copy,
  Plus,
  RefreshCw,
  Save,
  Download,
  Video,
  Zap,
  Wand2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai/replicate")({
  component: ReplicatePage,
  head: () => ({ meta: [{ title: "爆款复刻 — BooPilot" }] }),
});

type Stage = "input" | "analyzing" | "report";

type Segment = {
  id: string;
  name: string;
  start: string;
  end: string;
  copy: string;
  logic: string;
  transition: string;
  asset?: string;
};

const HISTORY_TEMPLATES = [
  { id: "h1", name: "户外露营带货模板", time: "2026-06-08" },
  { id: "h2", name: "护肤品种草模板", time: "2026-06-05" },
  { id: "h3", name: "3C 数码开箱模板", time: "2026-05-30" },
];

const MOCK_SEGMENTS: Segment[] = [
  {
    id: "s1",
    name: "黄金钩子",
    start: "00:00",
    end: "00:03",
    copy: "你绝对想不到，只要 3 秒钟，就能彻底改变你的体验！",
    logic: "痛点直击 + 悬念设置",
    transition: "快速切入",
  },
  {
    id: "s2",
    name: "产品展示",
    start: "00:03",
    end: "00:08",
    copy: "3 秒即热，专业级温控，无惧任何使用场景。",
    logic: "核心卖点 1 展示",
    transition: "淡入淡出",
  },
  {
    id: "s3",
    name: "场景应用",
    start: "00:08",
    end: "00:12",
    copy: "无论是办公室、健身房还是户外露营，都能轻松驾驭。",
    logic: "多场景适用性",
    transition: "叠化",
  },
  {
    id: "s4",
    name: "信任背书",
    start: "00:12",
    end: "00:18",
    copy: "已成为全球 10 万+ 用户的共同选择，五星好评如潮。",
    logic: "社交证明",
    transition: "缩放",
  },
  {
    id: "s5",
    name: "行动号召",
    start: "00:18",
    end: "00:22",
    copy: "限时 5 折，点击下方立即抢购，错过再等一年！",
    logic: "促单成交",
    transition: "硬切",
  },
];

const MY_MATERIALS = [
  { id: "m1", name: "产品白底图 A", thumb: "https://picsum.photos/seed/repmat-a/240/240" },
  { id: "m2", name: "户外场景视频", thumb: "https://picsum.photos/seed/repmat-b/240/240" },
  { id: "m3", name: "模特展示", thumb: "https://picsum.photos/seed/repmat-c/240/240" },
  { id: "m4", name: "产品细节特写", thumb: "https://picsum.photos/seed/repmat-d/240/240" },
  { id: "m5", name: "办公室场景", thumb: "https://picsum.photos/seed/repmat-e/240/240" },
  { id: "m6", name: "用户证言截图", thumb: "https://picsum.photos/seed/repmat-f/240/240" },
];

function ReplicatePage() {
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("正在识别：镜头节奏");
  const [segments, setSegments] = useState<Segment[]>(MOCK_SEGMENTS);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [pickingSegId, setPickingSegId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/(video|image)\//.test(f.type)) {
      toast.error("请上传视频文件");
      e.target.value = "";
      return;
    }
    setUploaded(f.name);
  }

  function startAnalyze() {
    if (!url.trim() && !uploaded) {
      return toast.error("请粘贴爆款视频链接或上传视频");
    }
    setStage("analyzing");
    setProgress(0);
    const labels = [
      "正在识别：镜头节奏",
      "正在识别：转场点",
      "正在识别：关键文案",
      "正在提取：卖点逻辑",
      "正在生成：复刻模板",
    ];
    let idx = 0;
    setProgressLabel(labels[0]);
    const timer = setInterval(() => {
      setProgress((p) => {
        const np = p + Math.round(4 + Math.random() * 8);
        const phase = Math.min(labels.length - 1, Math.floor(np / 20));
        if (phase !== idx) {
          idx = phase;
          setProgressLabel(labels[phase]);
        }
        if (np >= 100) {
          clearInterval(timer);
          setStage("report");
          return 100;
        }
        return np;
      });
    }, 260);
  }

  function openMaterialPicker(segId: string) {
    setPickingSegId(segId);
    setMaterialOpen(true);
  }

  function assignMaterial(matName: string) {
    if (!pickingSegId) return;
    setSegments((prev) =>
      prev.map((s) => (s.id === pickingSegId ? { ...s, asset: matName } : s)),
    );
    setMaterialOpen(false);
    setPickingSegId(null);
    toast.success("已匹配素材");
  }

  return (
    <div className="space-y-6">
      {stage === "input" && (
        <InputStage
          url={url}
          setUrl={setUrl}
          uploaded={uploaded}
          setUploaded={setUploaded}
          onUpload={() => fileRef.current?.click()}
          onPickLibrary={() => {
            setPickingSegId(null);
            setMaterialOpen(true);
          }}
          onStart={startAnalyze}
          onOpenHistory={() => setHistoryOpen(true)}
        />
      )}

      {stage === "analyzing" && (
        <AnalyzingStage
          progress={progress}
          label={progressLabel}
          onBack={() => setStage("input")}
        />
      )}

      {stage === "report" && (
        <ReportStage
          segments={segments}
          onBack={() => setStage("input")}
          onRerun={() => {
            setStage("analyzing");
            startAnalyze();
          }}
          onPickMaterial={openMaterialPicker}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={pickFile}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>查看历史保存模板</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {HISTORY_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  toast.success(`已载入模板：${t.name}`);
                  setHistoryOpen(false);
                  setStage("report");
                }}
                className="flex w-full items-center justify-between rounded-md border border-border/60 px-3 py-2.5 text-left hover:border-primary/50 hover:bg-muted/40"
              >
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.time}</div>
                </div>
                <Badge variant="secondary">载入</Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={materialOpen} onOpenChange={setMaterialOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>我的原料</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {MY_MATERIALS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (pickingSegId) {
                    assignMaterial(m.name);
                  } else {
                    setUploaded(m.name);
                    setMaterialOpen(false);
                    toast.success(`已选择：${m.name}`);
                  }
                }}
                className="group overflow-hidden rounded-md border border-border/60 text-left transition hover:border-primary"
              >
                <img
                  src={m.thumb}
                  alt={m.name}
                  className="aspect-square w-full object-cover transition group-hover:scale-105"
                />
                <div className="truncate px-2 py-1.5 text-xs">{m.name}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------- Stage: Input ----------------- */

function InputStage({
  url,
  setUrl,
  uploaded,
  setUploaded,
  onUpload,
  onPickLibrary,
  onStart,
  onOpenHistory,
}: {
  url: string;
  setUrl: (v: string) => void;
  uploaded: string | null;
  setUploaded: (v: string | null) => void;
  onUpload: () => void;
  onPickLibrary: () => void;
  onStart: () => void;
  onOpenHistory: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-bold tracking-tight">爆款视频复刻</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          粘贴 TikTok / Instagram / 亚马逊等平台爆款视频链接，AI 自动拆解节奏、转场、文案与卖点逻辑，一键生成可复用模板。
        </p>
      </div>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <span className="inline-block h-3.5 w-[3px] rounded-sm bg-primary" />
              输入爆款链接
              <span className="text-destructive">*</span>
            </Label>
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <History className="h-3 w-3" /> 查看历史保存模板
            </button>
          </div>

          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴 TikTok / 亚马逊视频链接"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">或者</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onUpload}
              className={cn(
                "flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition",
                uploaded
                  ? "border-primary/60 bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {uploaded ? "重新上传视频" : "上传视频"}
              </span>
              {uploaded && (
                <span className="max-w-[180px] truncate text-[11px] text-muted-foreground">
                  {uploaded}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onPickLibrary}
              className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/30 transition hover:border-primary/50 hover:bg-muted/50"
            >
              <FolderOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">我的原料</span>
              <span className="text-[11px] text-muted-foreground">从素材库选择</span>
            </button>
          </div>

          {uploaded && (
            <button
              type="button"
              onClick={() => setUploaded(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              清除已选择视频
            </button>
          )}

          <Button onClick={onStart} className="h-11 w-full text-base font-medium">
            <Sparkles className="h-4 w-4" /> 智能拆解爆款节奏
          </Button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3 text-warning" />
            预计消耗积分 <span className="font-medium text-foreground">20</span>
            <span>·</span>
            会员 8 折，实付 <span className="font-medium text-foreground">16</span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-3 border-dashed bg-muted/20 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Video className="h-7 w-7 text-primary" />
        </div>
        <div className="text-base font-medium">等待输入爆款视频</div>
        <div className="max-w-md text-xs text-muted-foreground">
          AI 将自动拆解视频的节奏、转场、文案与卖点逻辑，为您生成可直接复用的模板。
        </div>
      </Card>
    </div>
  );
}

/* ----------------- Stage: Analyzing ----------------- */

function AnalyzingStage({
  progress,
  label,
  onBack,
}: {
  progress: number;
  label: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回智能拆解
      </button>

      <Card className="flex min-h-[480px] flex-col items-center justify-center gap-6 p-10">
        <div className="relative h-28 w-28">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
              className="text-primary transition-all"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold">
            {progress}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold">AI 正在深度拆解爆款基因…</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["镜头节奏", "转场点", "关键文案", "卖点逻辑"].map((t, i) => (
            <Badge
              key={t}
              variant="secondary"
              className={cn(
                "gap-1",
                progress > i * 25
                  ? "bg-success/10 text-success"
                  : "text-muted-foreground",
              )}
            >
              {progress > i * 25 && <Check className="h-3 w-3" />}
              {t}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ----------------- Stage: Report ----------------- */

function ReportStage({
  segments,
  onBack,
  onRerun,
  onPickMaterial,
}: {
  segments: Segment[];
  onBack: () => void;
  onRerun: () => void;
  onPickMaterial: (segId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回智能拆解
      </button>

      {/* Report card */}
      <Card className="overflow-hidden p-0 shadow-[var(--shadow-card)]">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-lg font-semibold">爆款基因分析报告</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI 已识别出本视频的核心节奏、卖点逻辑与文案风格
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <GeneCard label="节奏感" value="高频快剪" hint="平均 2.4s / 切" tone="primary" />
          <GeneCard
            label="核心逻辑"
            value="痛点 → 方案 → 证言 → 促单"
            hint="经典 PSPC 模型"
            tone="success"
          />
          <GeneCard label="BGM 风格" value="Upbeat / 鼓点对齐" hint="动感节拍" tone="warning" />
          <GeneCard label="文案风格" value="口语化 / 强引导" hint="高情绪密度" tone="accent" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onRerun}>
            <RefreshCw className="h-4 w-4" /> 重新拆解
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("模板已保存")}>
            <Save className="h-4 w-4" /> 保存模板
          </Button>
          <Button size="sm" onClick={() => toast.success("模板已导出 JSON")}>
            <Download className="h-4 w-4" /> 导出模板
          </Button>
        </div>
      </Card>

      {/* Segment table */}
      <Card className="overflow-hidden p-0 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">逐秒拆解与素材匹配</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              为每个分镜匹配你自己的素材，一键生成可复用脚本
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("已批量匹配自有素材")}
          >
            <Wand2 className="h-4 w-4" /> 批量匹配自有素材
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-44 px-6 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">复制文案</th>
                <th className="w-56 px-4 py-3 font-medium">呈现逻辑</th>
                <th className="w-56 px-6 py-3 font-medium">匹配自有素材</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s, i) => (
                <tr
                  key={s.id}
                  className={cn(
                    "border-b border-border/40 align-top",
                    i % 2 === 1 && "bg-muted/10",
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
                      {s.start} - {s.end}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="group relative rounded-md border border-border/60 bg-background p-3 text-sm leading-relaxed">
                      <p className="pr-7">{s.copy}</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(s.copy);
                          toast.success("已复制文案");
                        }}
                        className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">
                        <Sparkles className="h-3 w-3" /> {s.logic}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        建议转场：
                        <span className="text-foreground">{s.transition}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {s.asset ? (
                      <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
                        <span className="truncate text-xs">{s.asset}</span>
                        <button
                          onClick={() => onPickMaterial(s.id)}
                          className="text-[11px] text-primary hover:underline"
                        >
                          更换
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onPickMaterial(s.id)}
                        className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-muted/20 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-muted/40 hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        <span>从我的原料添加</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-3">
          <div className="text-xs text-muted-foreground">
            共 {segments.length} 个分镜 · 已匹配
            <span className="px-1 font-medium text-foreground">
              {segments.filter((s) => s.asset).length}
            </span>
            个素材
          </div>
          <Button onClick={() => toast.success("已生成复刻视频任务")}>
            <Sparkles className="h-4 w-4" /> 一键生成复刻视频
          </Button>
        </div>
      </Card>
    </div>
  );
}

function GeneCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "success" | "warning" | "accent";
}) {
  const toneMap: Record<typeof tone, string> = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-success/10 to-success/5 text-success",
    warning: "from-warning/10 to-warning/5 text-warning",
    accent: "from-accent/30 to-accent/10 text-accent-foreground",
  };
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-gradient-to-br p-4",
        toneMap[tone],
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-base font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

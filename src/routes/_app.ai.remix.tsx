import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText, Music2, Smile, Globe2, Type, ChevronRight, ChevronDown, ChevronUp,
  Plus, Trash2, History, Eraser, Upload, ImageIcon, Video as VideoIcon, GripVertical,
  Copy, Sparkles, Play, Pause, Send, Save, Download, X, Cpu, FolderOpen,
  Clapperboard, HelpCircle, RotateCcw, RefreshCw, ArrowUp, ArrowDown, Settings2, Captions,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TagMultiSelect } from "@/components/tag-multi-select";
import {
  PLATFORM_LIMITS, CreatePostTaskDialog, type Platform, type PostItem,
} from "@/routes/_app.materials.posts";
import { getActiveModelsByModules } from "@/lib/models-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai/remix")({
  component: VideoRemixPage,
  head: () => ({ meta: [{ title: "视频混剪 — BooPilot" }] }),
});

type Status = "idle" | "loading" | "done";

const VOICES = ["女声-知性", "女声-甜美", "男声-沉稳", "男声-阳光", "童声"];
const EMOTIONS = ["默认/平和", "热情活泼", "深情款款", "严肃正式", "幽默轻松"];
const BGM = ["流行轻快", "电子节奏", "舒缓钢琴", "国风古韵", "燃情史诗"];
const LANGS = ["中文(简体)", "中文(繁体)", "English", "日本語", "한국어", "Español"];
const SUBTITLE_STYLES = ["经典黑条", "经典白条", "边框", "霓虹", "区块强调", "倾斜"];

type Shot = {
  id: string;
  voiceover: string;
  description: string;
  materialType: "video" | "image";
  materialUrl?: string;
  materialName?: string;
};

type Segment = {
  id: string;
  duration: number;
  collapsed: boolean;
  shots: Shot[];
};

type ScriptTemplate = {
  id: string;
  name: string;
  desc: string;
  createdAt: string;
};

const MOCK_HISTORY: ScriptTemplate[] = [
  { id: "h-1", name: "降噪耳机·爆款脚本 v3", desc: "通勤场景三段式：痛点-展示-行动召唤", createdAt: "2026-05-28 14:40:47" },
  { id: "h-2", name: "智能水杯·内容种草", desc: "晨练-办公-夜跑全天候演绎", createdAt: "2026-05-22 09:18:12" },
  { id: "h-3", name: "便携投影·开箱测评", desc: "强调对比效果与多场景适配", createdAt: "2026-05-15 16:02:35" },
  { id: "h-4", name: "美瞳·情绪化短剧", desc: "暧昧光影 + 大眼特写，强情绪带货", createdAt: "2026-04-30 11:25:08" },
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function newShot(): Shot {
  return { id: uid("sh"), voiceover: "", description: "", materialType: "video" };
}

function newSegment(): Segment {
  return { id: uid("seg"), duration: 5, collapsed: false, shots: [newShot()] };
}

function VideoRemixPage() {
  const [segments, setSegments] = useState<Segment[]>([newSegment()]);
  const [voice, setVoice] = useState("");
  const [lang, setLang] = useState(LANGS[0]);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [bgm, setBgm] = useState("");
  const [subtitleOn, setSubtitleOn] = useState(true);
  const [subStyle, setSubStyle] = useState(SUBTITLE_STYLES[0]);
  const [subPos, setSubPos] = useState("底部");
  const [subSize, setSubSize] = useState("32px");
  const [platform, setPlatform] = useState<Platform>("Tiktok");
  const [aiModel, setAiModel] = useState("");
  const availableAiModels = useMemo(() => getActiveModelsByModules(["image2video", "text2video"]), []);

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveScriptOpen, setSaveScriptOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [postTaskOpen, setPostTaskOpen] = useState(false);

  const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0);
  const totalShots = segments.reduce((acc, s) => acc + s.shots.length, 0);

  const updateSegment = (id: string, patch: Partial<Segment>) =>
    setSegments((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const updateShot = (segId: string, shotId: string, patch: Partial<Shot>) =>
    setSegments((arr) =>
      arr.map((s) =>
        s.id === segId
          ? { ...s, shots: s.shots.map((sh) => (sh.id === shotId ? { ...sh, ...patch } : sh)) }
          : s,
      ),
    );
  const addSegment = () => setSegments((arr) => [...arr, newSegment()]);
  const removeSegment = (id: string) =>
    setSegments((arr) => (arr.length > 1 ? arr.filter((s) => s.id !== id) : arr));
  const addShot = (segId: string) =>
    updateSegment(segId, { shots: [...(segments.find((s) => s.id === segId)?.shots ?? []), newShot()] });
  const removeShot = (segId: string, shotId: string) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg || seg.shots.length <= 1) return;
    updateSegment(segId, { shots: seg.shots.filter((sh) => sh.id !== shotId) });
  };
  const clearAll = () => {
    setSegments([newSegment()]);
    toast.success("已清空脚本");
  };

  const loadHistory = (h: ScriptTemplate) => {
    setSegments([
      {
        id: uid("seg"), duration: 8, collapsed: false,
        shots: [
          { id: uid("sh"), voiceover: `场景一：${h.name} —— 痛点引入`, description: "城市夜归人群特写,镜头快速推进", materialType: "video", materialName: "city_night.mp4" },
          { id: uid("sh"), voiceover: "产品出现,聚焦特写，光影对比", description: "桌面摆设特写,环境光从冷转暖", materialType: "video", materialName: "product_close.mp4" },
        ],
      },
      {
        id: uid("seg"), duration: 6, collapsed: false,
        shots: [
          { id: uid("sh"), voiceover: "三大核心卖点逐条展示", description: "卖点字幕弹出 + 使用场景剪辑", materialType: "video", materialName: "selling_points.mp4" },
        ],
      },
      {
        id: uid("seg"), duration: 4, collapsed: false,
        shots: [
          { id: uid("sh"), voiceover: "立即下单,享首发福利", description: "结尾价格卡片 + 品牌 Logo 上扬", materialType: "image", materialName: "cta_card.png" },
        ],
      },
    ]);
    setHistoryOpen(false);
    toast.success(`已载入模板「${h.name}」`);
  };

  const generate = () => {
    if (!voice) return toast.error("请选择配音音色");
    if (!bgm) return toast.error("请选择背景音乐");
    if (totalShots === 0) return toast.error("请至少添加一个分镜画面");
    setStatus("loading");
    setProgress(0);
    setGeneratedVideoUrl(null);
    const t = setInterval(() => {
      setProgress((p) => {
        const np = p + Math.round(6 + Math.random() * 10);
        if (np >= 100) {
          clearInterval(t);
          setStatus("done");
          setGeneratedVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
          return 100;
        }
        return np;
      });
    }, 320);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* ============== Left config ============== */}
        <Card className="flex flex-col overflow-hidden p-0 shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 px-5 py-4">
            <h2 className="text-base font-semibold">视频混剪</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              基于多分镜脚本的智能混剪,一键合成高品质营销短视频
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <Field label="视频脚本" required>
              <button
                type="button"
                onClick={() => document.getElementById("remix-script-anchor")?.scrollIntoView({ behavior: "smooth" })}
                className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/50"
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium text-foreground">
                  当前 {segments.length} 段脚本 · {totalShots} 个分镜
                </span>
                <span className="text-xs">点击右侧编辑脚本内容</span>
              </button>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="配音音色" required>
                <IconSelect icon={<Music2 className="h-4 w-4" />} value={voice} onChange={setVoice} options={VOICES} placeholder="请选择配音音色" />
              </Field>
              <Field label="配音语种" required>
                <IconSelect icon={<Globe2 className="h-4 w-4" />} value={lang} onChange={setLang} options={LANGS} />
              </Field>
            </div>

            <Field label="配音情绪" required>
              <IconSelect icon={<Smile className="h-4 w-4" />} value={emotion} onChange={setEmotion} options={EMOTIONS} />
            </Field>

            <Field label="视频背景音乐" required>
              <IconSelect icon={<Music2 className="h-4 w-4" />} value={bgm} onChange={setBgm} options={BGM} placeholder="请选择背景音乐" />
            </Field>

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">字幕效果</Label>
                <Switch checked={subtitleOn} onCheckedChange={setSubtitleOn} />
              </div>
              {subtitleOn && (
                <div className="space-y-2">
                  <IconSelect icon={<Type className="h-4 w-4" />} value={subStyle} onChange={setSubStyle} options={SUBTITLE_STYLES} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={subPos} onValueChange={setSubPos}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["顶部", "中部", "底部"].map((p) => (
                          <SelectItem key={p} value={p}>位置 {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={subSize} onValueChange={setSubSize}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["24px", "28px", "32px", "36px", "40px"].map((s) => (
                          <SelectItem key={s} value={s}>字号 {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="目标平台">
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Tiktok", "Instagram", "Facebook", "Twitter/X", "WhatsApp"] as Platform[]).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="总时长">
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/20 px-3 text-sm">
                  <span className="font-semibold text-foreground">{totalDuration}</span>
                  <span className="ml-1 text-muted-foreground">秒</span>
                </div>
              </Field>
            </div>

            <Field label="AI 模型">
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2 truncate">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="请选择 AI 模型" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableAiModels.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      暂无可用模型,请前往「系统管理 / 模型管理」配置
                    </div>
                  ) : (
                    availableAiModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.name}</span>
                          {m.vendor && <span className="text-[11px] text-muted-foreground">· {m.vendor}</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-3 border-t border-border/60 px-5 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>预计消耗积分</span>
              <span>实付 <span className="font-medium text-foreground">{Math.max(8, totalShots * 2)}</span></span>
            </div>
            <Button onClick={generate} disabled={status === "loading"} className="h-11 w-full text-base font-medium">
              <Sparkles className="h-4 w-4" />
              {status === "loading" ? "AI 正在混剪中…" : "开始生成"}
            </Button>
          </div>
        </Card>

        {/* ============== Right: script editor + preview ============== */}
        <div className="space-y-6">
          <div className="space-y-2 px-2">
            <h1 className="text-3xl font-bold tracking-tight">AI 智能混剪,把脚本变成爆款</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              按分镜组织视频脚本,AI 自动匹配镜头、配音、字幕与节奏。支持载入历史模板与一键复用,大幅提升内容生产效率。
            </p>
          </div>

          {/* Script editor */}
          <Card id="remix-script-anchor" className="overflow-hidden p-0 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-5 py-3">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4" /> 查看脚本列表
                </Button>
                <Button size="sm" variant="outline" onClick={clearAll}>
                  <Eraser className="h-4 w-4" /> 清空
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSaveScriptOpen(true)}>
                  <Save className="h-4 w-4" /> 保存脚本
                </Button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>共 <span className="font-medium text-foreground">{segments.length}</span> 段</span>
                <span>·</span>
                <span><span className="font-medium text-foreground">{totalShots}</span> 个分镜</span>
                <span>·</span>
                <span>总时长 <span className="font-medium text-foreground">{totalDuration}s</span></span>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              {segments.map((seg, idx) => (
                <SegmentCard
                  key={seg.id}
                  index={idx + 1}
                  segment={seg}
                  onChange={(p) => updateSegment(seg.id, p)}
                  onRemove={() => removeSegment(seg.id)}
                  canRemove={segments.length > 1}
                  onAddShot={() => addShot(seg.id)}
                  onUpdateShot={(shotId, p) => updateShot(seg.id, shotId, p)}
                  onRemoveShot={(shotId) => removeShot(seg.id, shotId)}
                />
              ))}

              <button
                onClick={addSegment}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" /> 添加脚本片段
              </button>
            </div>
          </Card>

          {/* Preview area */}
          {(status !== "idle" || generatedVideoUrl) && (
            <Card className="p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">混剪预览</h3>
                {status === "done" && (
                  <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
                    <Sparkles className="h-3 w-3" /> 生成完成
                  </Badge>
                )}
              </div>
              <div className="flex justify-center">
                <div className="relative flex aspect-[9/16] w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300">
                  {status === "loading" ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-24 w-24">
                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-700" />
                          <circle
                            cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none"
                            strokeDasharray={2 * Math.PI * 44}
                            strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                            className="text-primary transition-all"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">
                          {progress}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-semibold text-white">AI 正在混剪中…</div>
                        <div className="mt-1 text-xs text-slate-400">
                          正在合成第 {Math.min(segments.length, Math.ceil((progress / 100) * segments.length))} / {segments.length} 段
                        </div>
                      </div>
                    </div>
                  ) : status === "done" ? (
                    <div className="relative h-full w-full">
                      <video src={generatedVideoUrl ?? undefined} controls className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
                        <Button size="sm" onClick={() => setPostTaskOpen(true)}>
                          <Send className="h-4 w-4" /> 一键发帖
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setSaveOpen(true)}>
                          <Save className="h-4 w-4" /> 保存至成品素材
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={async () => {
                            if (!generatedVideoUrl) return;
                            try {
                              const res = await fetch(generatedVideoUrl);
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `remix-${Date.now()}.mp4`;
                              document.body.appendChild(a); a.click(); a.remove();
                              URL.revokeObjectURL(url);
                              toast.success("已开始下载");
                            } catch { toast.error("下载失败,请重试"); }
                          }}
                        >
                          <Download className="h-4 w-4" /> 下载到本地
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <Play className="h-10 w-10 text-slate-500" />
                      <div className="text-sm">尚未生成,请先编辑脚本并点击「开始生成」</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>历史脚本列表</DialogTitle>
            <DialogDescription>从已保存的脚本模板中快速复用</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>脚本名称</TableHead>
                  <TableHead>脚本描述</TableHead>
                  <TableHead className="w-44">创建时间</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_HISTORY.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" /> {h.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{h.desc || "--"}</TableCell>
                    <TableCell className="text-muted-foreground">{h.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-primary" onClick={() => loadHistory(h)}>
                        <Copy className="h-3.5 w-3.5" /> 复制
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => toast.success("已删除")}>
                        <Trash2 className="h-3.5 w-3.5" /> 删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save script dialog */}
      <SaveScriptDialog open={saveScriptOpen} onOpenChange={setSaveScriptOpen} />

      {/* Save to material (post) */}
      <SaveToMaterialDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        videoUrl={generatedVideoUrl}
        platform={platform}
        defaultTitle="AI 混剪视频"
        defaultContent={segments.flatMap((s) => s.shots.map((sh) => sh.voiceover)).filter(Boolean).join(" ")}
      />

      <CreatePostTaskDialog
        open={postTaskOpen}
        onOpenChange={setPostTaskOpen}
        lockedPlatform={platform}
        showPostEditor
        defaultPostTitle="AI 混剪视频"
        defaultPostContent={segments.flatMap((s) => s.shots.map((sh) => sh.voiceover)).filter(Boolean).join(" ")}
        selectedPosts={[
          {
            id: "remix-temp",
            type: "video",
            title: "AI 混剪视频",
            content: segments.flatMap((s) => s.shots.map((sh) => sh.voiceover)).filter(Boolean).join(" "),
            images: [],
            videoUrl: generatedVideoUrl ?? undefined,
            platforms: [platform],
            publishStatus: { [platform]: "unpublished" },
            tags: [],
            enabled: true,
            createdAt: new Date().toISOString(),
            tenantId: "",
            tenantName: "",
          } satisfies PostItem,
        ]}
        onCreated={() => setPostTaskOpen(false)}
      />
    </div>
  );
}

// ============= Segment card =============
function SegmentCard({
  index, segment, onChange, onRemove, canRemove, onAddShot, onUpdateShot, onRemoveShot,
}: {
  index: number;
  segment: Segment;
  onChange: (p: Partial<Segment>) => void;
  onRemove: () => void;
  canRemove: boolean;
  onAddShot: () => void;
  onUpdateShot: (shotId: string, p: Partial<Shot>) => void;
  onRemoveShot: (shotId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {index}
          </div>
          <span className="text-sm font-semibold">脚本片段 {index}</span>
          <button
            onClick={() => onChange({ collapsed: !segment.collapsed })}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", !segment.collapsed && "rotate-90")} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">画面时长</span>
            <Input
              type="number"
              min={1}
              value={segment.duration}
              onChange={(e) => onChange({ duration: Math.max(1, Number(e.target.value) || 1) })}
              className="h-7 w-16 text-center text-xs"
            />
            <span className="text-muted-foreground">s</span>
          </div>
          {canRemove && (
            <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!segment.collapsed && (
        <div className="space-y-3 px-4 py-4">
          {segment.shots.map((sh, i) => (
            <ShotRow
              key={sh.id}
              index={i + 1}
              shot={sh}
              onChange={(p) => onUpdateShot(sh.id, p)}
              onRemove={() => onRemoveShot(sh.id)}
              canRemove={segment.shots.length > 1}
            />
          ))}
          <button
            onClick={onAddShot}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/[0.04] py-2 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5" /> 添加分镜画面
          </button>
        </div>
      )}
    </div>
  );
}

// ============= Shot row =============
function ShotRow({
  index, shot, onChange, onRemove, canRemove,
}: {
  index: number;
  shot: Shot;
  onChange: (p: Partial<Shot>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onChange({ materialUrl: URL.createObjectURL(f), materialName: f.name });
  };
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px]">
            {index}
          </div>
          <span>分镜头画面 {index}</span>
          <Select value={shot.materialType} onValueChange={(v) => onChange({ materialType: v as Shot["materialType"] })}>
            <SelectTrigger className="ml-2 h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">视频</SelectItem>
              <SelectItem value="image">图片</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_120px]">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">中文旁白 / 台词</Label>
          <Textarea
            value={shot.voiceover}
            onChange={(e) => onChange({ voiceover: e.target.value })}
            placeholder="请输入中文旁白 / 台词"
            maxLength={500}
            className="min-h-24 resize-none text-sm"
          />
          <div className="text-right text-[10px] text-muted-foreground">{shot.voiceover.length}/500</div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">画面内容描述</Label>
          <Textarea
            value={shot.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="请输入画面内容描述"
            maxLength={500}
            className="min-h-24 resize-none text-sm"
          />
          <div className="text-right text-[10px] text-muted-foreground">{shot.description.length}/500</div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">画面素材</Label>
          <input
            ref={inputRef} type="file"
            accept={shot.materialType === "video" ? "video/mp4,video/quicktime" : "image/*"}
            className="hidden" onChange={handleUpload}
          />
          {shot.materialName ? (
            <div className="relative flex h-24 flex-col items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 text-center">
              {shot.materialType === "video" ? (
                <VideoIcon className="h-5 w-5 text-primary" />
              ) : (
                <ImageIcon className="h-5 w-5 text-primary" />
              )}
              <span className="truncate text-[10px] font-medium" title={shot.materialName}>
                {shot.materialName}
              </span>
              <button
                onClick={() => onChange({ materialName: undefined, materialUrl: undefined })}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-muted/20 px-2 text-center text-[10px] text-muted-foreground hover:border-primary/60 hover:bg-muted/40"
            >
              <Upload className="h-4 w-4" />
              <span>上传{shot.materialType === "video" ? "视频" : "图片"}</span>
              <span className="text-[9px]">{shot.materialType === "video" ? "MP4/MOV" : "JPG/PNG"}</span>
            </button>
          )}
          <button
            onClick={() => toast.info("从我的原料库选择功能开发中")}
            className="flex w-full items-center justify-center gap-1 text-[10px] text-primary hover:underline"
          >
            <FolderOpen className="h-3 w-3" /> 从原料库选择
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= Save script template dialog =============
function SaveScriptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>保存脚本模板</DialogTitle>
          <DialogDescription>将当前脚本保存为模板,后续可在历史脚本中快速复用。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="脚本名称" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：耳机·爆款脚本 v1" />
          </Field>
          <Field label="脚本描述">
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="简要描述脚本结构与适用场景" rows={3} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => {
            if (!name.trim()) return toast.error("请输入脚本名称");
            toast.success("已保存到历史脚本");
            setName(""); setDesc("");
            onOpenChange(false);
          }}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= Save to material dialog (same shape as video module) =============
function SaveToMaterialDialog({
  open, onOpenChange, videoUrl, platform, defaultTitle, defaultContent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  videoUrl: string | null;
  platform: Platform;
  defaultTitle: string;
  defaultContent: string;
}) {
  const SUPPORTED: Platform[] = ["Facebook", "Tiktok", "Instagram", "Twitter/X", "WhatsApp"];
  const lockedPlatform: Platform = SUPPORTED.includes(platform) ? platform : "Tiktok";
  const limit = PLATFORM_LIMITS[lockedPlatform].video;
  const hasTitle = limit.titleMax !== undefined;

  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);
  const [tags, setTags] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);

  useMemo(() => {
    if (open) {
      setTitle(defaultTitle); setContent(defaultContent); setTags([]); setEnabled(true);
    }
  }, [open, defaultTitle, defaultContent]);

  const submit = () => {
    if (hasTitle && !title.trim()) return toast.error("请输入贴文标题");
    if (hasTitle && title.length > (limit.titleMax ?? 0)) return toast.error(`标题最长 ${limit.titleMax} 字`);
    if (content.length > limit.contentMax) return toast.error(`文案内容最长 ${limit.contentMax} 字`);
    if (!videoUrl) return toast.error("缺少视频文件");
    toast.success("已保存至成品素材");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>保存至成品素材</DialogTitle>
          <DialogDescription>将刚生成的混剪视频保存为贴文素材。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="目标平台"><Input value={lockedPlatform} disabled /></Field>
            <Field label="贴文类型"><Input value="视频" disabled /></Field>
          </div>
          {hasTitle && (
            <Field label={`贴文标题 * (${title.length}/${limit.titleMax})`}>
              <Input value={title} maxLength={limit.titleMax} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          )}
          <Field label={`文案内容 (${content.length}/${limit.contentMax})`}>
            <Textarea value={content} maxLength={limit.contentMax} rows={4} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <Field label="视频预览">
            {videoUrl ? (
              <video src={videoUrl} controls className="max-h-72 w-full rounded-md bg-black" />
            ) : (
              <div className="rounded-md border border-dashed py-10 text-center text-xs text-muted-foreground">暂无视频</div>
            )}
          </Field>
          <Field label="标签">
            <TagMultiSelect value={tags} onChange={setTags} placeholder="选择或新增标签" />
          </Field>
          <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">启用状态</p>
              <p className="text-xs text-muted-foreground">关闭后该贴文将不会出现在可选素材中</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= Shared small components =============
function Field({
  label, required, children,
}: { label: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function IconSelect({
  icon, value, onChange, options, placeholder,
}: {
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10">
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <SelectValue placeholder={placeholder ?? "请选择"} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

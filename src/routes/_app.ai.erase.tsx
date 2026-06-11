import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Trash2,
  Sparkles,
  Zap,
  Wand2,
  Brush,
  MousePointerClick,
  Play,
  Pause,
  Download,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  FolderOpen,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai/erase")({
  component: ContentErasePage,
  head: () => ({ meta: [{ title: "内容消除 — BooPilot" }] }),
});

type EraseMode = "smart" | "brush";
type Status = "idle" | "processing" | "done";

type Region = {
  id: string;
  index: number;
  mode: EraseMode;
  startTime: string;
  endTime: string;
  thumbColor: string; // bg class
  // 在预览画面中的位置（百分比），用于绘制标记
  x: number;
  y: number;
  w: number;
  h: number;
};

const SAMPLE_THUMB =
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=70";

type MediaType = "video" | "image";

const SAMPLE_IMAGE_THUMB =
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=70";


function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(ms).padStart(3, "0")}`;
}

function ContentErasePage() {
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [mode, setMode] = useState<EraseMode>("smart");
  const [brushSize, setBrushSize] = useState([34]);
  const [showRegions, setShowRegions] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(128.725); // mock 02:08:725
  const [regions, setRegions] = useState<Region[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const handleUpload = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoName(file.name);
    setRegions([]);
    setResultUrl(null);
    setStatus("idle");
    toast.success(`已上传：${file.name}`);
  };

  const isImage = mediaType === "image";
  const previewBg = isImage ? SAMPLE_IMAGE_THUMB : SAMPLE_THUMB;

  const switchMediaType = (t: MediaType) => {
    if (t === mediaType) return;
    setMediaType(t);
    setVideoUrl(null);
    setVideoName("");
    setRegions([]);
    setResultUrl(null);
    setStatus("idle");
    setMode("smart");
    setPlaying(false);
    setCurrentTime(0);
  };


  const handleUseSample = () => {
    setVideoUrl(previewBg);
    setVideoName(isImage ? "sample-photo.jpg" : "sample-clip.mp4");
    setRegions([]);
    setResultUrl(null);
    setStatus("idle");
  };

  const removeVideo = () => {
    setVideoUrl(null);
    setVideoName("");
    setRegions([]);
    setResultUrl(null);
    setStatus("idle");
  };


  // 在预览画面上点选/涂抹生成区域
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    const sizePct = (brushSize[0] / rect.width) * 100;
    const w = mode === "brush" ? Math.max(sizePct * 2, 10) : Math.max(sizePct * 1.4, 8);
    const h = mode === "brush" ? Math.max(sizePct * 0.8, 6) : Math.max(sizePct * 1.4, 8);
    const palette = [
      "bg-orange-500/70",
      "bg-rose-500/70",
      "bg-sky-500/70",
      "bg-emerald-500/70",
      "bg-violet-500/70",
    ];
    setRegions((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        index: prev.length + 1,
        mode,
        startTime: isImage ? "—" : fmtTime(currentTime),
        endTime: isImage ? "—" : fmtTime(Math.min(currentTime + 2.5, duration)),
        thumbColor: palette[prev.length % palette.length],
        x: Math.max(0, Math.min(100 - w, cx - w / 2)),
        y: Math.max(0, Math.min(100 - h, cy - h / 2)),
        w,
        h,
      },
    ]);
  };


  const removeRegion = (id: string) => {
    setRegions((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r, i) => ({ ...r, index: i + 1 })),
    );
  };

  const resetAll = () => {
    setRegions([]);
    setResultUrl(null);
    setStatus("idle");
    toast.info("已清空所有标注");
  };

  // 模拟播放进度
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setCurrentTime((c) => {
        const n = c + 0.1;
        if (n >= duration) {
          setPlaying(false);
          return 0;
        }
        return n;
      });
    }, 100);
    return () => clearInterval(t);
  }, [playing, duration]);

  // 积分预估：基础 5 + 每个区域 3，视频时长系数 1（演示用）
  const baseCost = 5;
  const perRegion = 3;
  const rawCost = baseCost + regions.length * perRegion;
  const memberCost = Math.round(rawCost * 0.7 * 10) / 10;
  const saved = Math.round((rawCost - memberCost) * 10) / 10;

  const startProcess = () => {
    if (!videoUrl) {
      toast.error("请先上传需要消除内容的视频");
      return;
    }
    if (regions.length === 0) {
      toast.error("请至少标注一个消除区域");
      return;
    }
    setStatus("processing");
    setProgress(0);
    setResultUrl(null);
    const t = setInterval(() => {
      setProgress((p) => {
        const n = p + Math.random() * 8 + 3;
        if (n >= 100) {
          clearInterval(t);
          setStatus("done");
          setResultUrl(videoUrl);
          toast.success("内容消除完成");
          return 100;
        }
        return n;
      });
    }, 320);
  };

  return (
    <div className="bg-muted/30">
      <div className="mx-auto max-w-[1480px] space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                <Wand2 className="h-3 w-3" />
                AI 视觉内容后处理
              </Badge>
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                Beta
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">内容消除</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {isImage
                ? "一键去除图片中的水印、文字、Logo 或多余物体，AI 智能填充背景。支持「智能笔」自动识别主体，「涂抹笔」精细涂抹任意区域。"
                : "一键去除视频中的水印、字幕、Logo 或穿帮物体。支持「智能笔」追踪移动物体，「涂抹笔」涂抹固定区域，AI 自动逐帧重绘补全。"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Media type segmented */}
            <div className="inline-flex rounded-lg border border-border/60 bg-card p-1 shadow-sm">
              <MediaPill active={mediaType === "video"} onClick={() => switchMediaType("video")}>
                <Play className="h-3.5 w-3.5" />
                视频消除
              </MediaPill>
              <MediaPill active={mediaType === "image"} onClick={() => switchMediaType("image")}>
                <ImageIcon className="h-3.5 w-3.5" />
                图片消除
              </MediaPill>
            </div>
            <Button variant="outline" size="sm" onClick={resetAll} disabled={regions.length === 0}>
              <RotateCcw className="h-4 w-4" />
              重置标注
            </Button>
          </div>
        </div>


        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          {/* Left panel */}
          <Card className="flex flex-col overflow-hidden">
            <div className="flex-1 space-y-5 p-5">
              {/* 上传 */}
              <section className="space-y-2">
                <Label className="flex items-center gap-1 text-sm font-semibold">
                  {isImage ? "添加图片" : "添加视频"} <span className="text-destructive">*</span>
                  <span className="text-xs font-normal text-muted-foreground">(必填)</span>
                </Label>
                {!videoUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 bg-muted/40 px-4 py-8 text-center transition hover:border-primary/60 hover:bg-primary/5"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    <span className="text-sm font-medium">
                      {isImage ? "点击上传图片" : "点击上传视频"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isImage
                        ? "支持 JPG、PNG、WEBP、BMP 格式 · 单文件 ≤ 30MB · 推荐 ≤ 4096px"
                        : "支持 MP4、MOV、MKV、FLV、WMV、WEBM 格式 · 单文件 ≤ 500MB"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseSample();
                      }}
                      className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {isImage ? "或使用示例图片" : "或使用示例视频"}
                    </button>
                  </button>
                ) : (
                  <div className="relative overflow-hidden rounded-lg border border-border/60 bg-black">
                    <div
                      className={cn(
                        "relative w-full bg-cover bg-center",
                        isImage ? "aspect-[4/3]" : "aspect-video",
                      )}
                      style={{ backgroundImage: `url(${previewBg})` }}
                    >
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-white">
                        <span className="line-clamp-1 max-w-[60%]">{videoName}</span>
                        <span>{isImage ? "1920 × 1280" : fmtTime(duration)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={isImage ? "image/*" : "video/*"}
                  hidden
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </section>


              {/* 消除模式 */}
              <section className="space-y-2">
                <Label className="text-sm font-semibold">消除模式</Label>
                <div className="grid grid-cols-2 gap-3">
                  <ModeCard
                    active={mode === "smart"}
                    onClick={() => setMode("smart")}
                    icon={MousePointerClick}
                    title="智能笔"
                    desc={
                      isImage
                        ? "适用于主体点选，AI 自动勾边，如：杂物、人物"
                        : "适用于移动物体点选，如：水印"
                    }
                  />
                  <ModeCard
                    active={mode === "brush"}
                    onClick={() => setMode("brush")}
                    icon={Brush}
                    title="涂抹笔"
                    desc={
                      isImage
                        ? "适用于自由涂抹任意区域，如：文字、Logo"
                        : "适用于固定物体选择，如：字幕"
                    }
                  />

                </div>
              </section>

              {/* 已选区域 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">已选区域</Label>
                  <span className="text-xs text-muted-foreground">
                    共 {regions.length} 个
                  </span>
                </div>
                <div className="min-h-[200px] rounded-lg border border-dashed border-border/70 bg-muted/30 p-3">
                  {regions.length === 0 ? (
                    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-background shadow-sm">
                        {isImage ? (
                          <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                        ) : (
                          <Play className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        在右侧画面上{mode === "smart" ? "点选" : "涂抹"}需要消除的对象
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {regions.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-2"
                        >
                          <div
                            className={cn(
                              "relative h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-cover bg-center",
                            )}
                            style={{ backgroundImage: `url(${previewBg})` }}
                          >
                            <span
                              className={cn("absolute inset-0 mix-blend-multiply", r.thumbColor)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              区域{r.index}
                              <span className="text-xs font-normal text-muted-foreground">
                                ({r.mode === "smart" ? "点选" : "涂抹"})
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {isImage
                                ? `位置 ${Math.round(r.x)}, ${Math.round(r.y)}`
                                : `${r.startTime} → ${r.endTime}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRegion(r.id)}
                            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="space-y-3 border-t border-border/60 px-5 py-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  预计消耗积分 <Zap className="h-3 w-3 text-warning" />
                  <span className="font-medium text-foreground">{rawCost}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
                    <Sparkles className="h-3 w-3" />
                    会员 7 折
                  </Badge>
                  <span>
                    已省 <span className="font-medium text-foreground">{saved}</span>
                  </span>
                  <span>
                    实付 <span className="font-medium text-foreground">{memberCost}</span>
                  </span>
                </span>
              </div>
              <Button
                onClick={startProcess}
                disabled={status === "processing"}
                className="h-11 w-full text-base font-medium"
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 处理中… {Math.floor(progress)}%
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    开始处理
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right preview */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              {/* 工具栏 */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">显示区域</span>
                  <Switch checked={showRegions} onCheckedChange={setShowRegions} />
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-xs font-medium">画笔大小</span>
                  <Slider
                    value={brushSize}
                    onValueChange={setBrushSize}
                    min={8}
                    max={120}
                    step={1}
                    className="max-w-[260px] flex-1"
                  />
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                    {brushSize[0]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {showRegions ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  {mode === "smart"
                    ? isImage ? "智能笔模式：点选主体，AI 自动识别" : "智能笔模式：点选移动物体"
                    : isImage ? "涂抹笔模式：自由涂抹任意区域" : "涂抹笔模式：涂抹固定区域"}
                </div>
              </div>

              {/* 画布 */}
              <div className="bg-black">
                <div
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className={cn(
                    "relative mx-auto w-full max-w-[820px] select-none bg-cover bg-center",
                    isImage ? "aspect-[4/3]" : "aspect-video",
                    videoUrl ? (mode === "brush" ? "cursor-crosshair" : "cursor-pointer") : "cursor-default",
                  )}
                  style={
                    videoUrl
                      ? { backgroundImage: `url(${previewBg})` }
                      : { background: "linear-gradient(135deg,#1a1a1a,#0a0a0a)" }
                  }
                >
                  {!videoUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white/70">
                      <Upload className="h-10 w-10" />
                      <p className="text-sm">
                        请先在左侧上传{isImage ? "图片" : "视频"}
                      </p>
                    </div>
                  )}

                  {/* 区域标记 */}
                  {videoUrl && showRegions &&
                    regions.map((r) => (
                      <div
                        key={r.id}
                        className="pointer-events-none absolute"
                        style={{
                          left: `${r.x}%`,
                          top: `${r.y}%`,
                          width: `${r.w}%`,
                          height: `${r.h}%`,
                        }}
                      >
                        {r.mode === "brush" ? (
                          <div
                            className={cn(
                              "absolute inset-0 rounded-md border-2 border-white/90",
                              r.thumbColor,
                            )}
                          >
                            <span className="absolute -top-5 left-0 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow">
                              区域{r.index}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-0">
                            <div
                              className={cn(
                                "absolute inset-0 rounded-full border-2 border-white/90 shadow",
                                r.thumbColor,
                              )}
                            />
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow">
                              区域{r.index}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                  {/* 处理中遮罩 */}
                  {status === "processing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <p className="text-sm text-white">
                        {isImage ? "AI 正在智能填充背景…" : "AI 正在逐帧重绘补全画面…"}
                      </p>
                      <Progress value={progress} className="w-2/3 max-w-[320px]" />
                      <p className="text-xs text-white/70">{Math.floor(progress)}%</p>
                    </div>
                  )}
                </div>

                {/* 时间轴（仅视频） */}
                {!isImage && (
                  <div className="flex items-center gap-3 border-t border-white/10 bg-black px-4 py-3 text-white">
                    <button
                      type="button"
                      onClick={() => setPlaying((p) => !p)}
                      disabled={!videoUrl}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="font-mono text-xs tabular-nums text-white/80">
                      {fmtTime(currentTime)} / {fmtTime(duration)}
                    </span>
                    <div className="relative flex-1">
                      <div className="h-1.5 w-full rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      {regions.map((r, i) => (
                        <span
                          key={r.id}
                          className={cn("absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-sm", r.thumbColor)}
                          style={{ left: `${((i + 1) * 100) / (regions.length + 1)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* 结果区 */}
            {status === "done" && resultUrl && (
              <Card className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <h2 className="text-base font-semibold">处理完成</h2>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      消除 {regions.length} 处
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                      {isImage ? "下载图片" : "下载视频"}
                    </Button>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4" />
                      存入我的原料
                    </Button>
                    <Button size="sm">
                      <Send className="h-4 w-4" />
                      创建发布任务
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <CompareSlot label="处理前" overlay={!isImage} mediaType={mediaType} />
                  <CompareSlot label="处理后" mediaType={mediaType} />
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition",
        active
          ? "border-primary bg-primary/5"
          : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <div className={cn("flex items-center gap-1.5 text-sm font-semibold", active && "text-primary")}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function CompareSlot({
  label,
  overlay,
  mediaType,
}: {
  label: string;
  overlay?: boolean;
  mediaType: MediaType;
}) {
  const isImage = mediaType === "image";
  const bg = isImage ? SAMPLE_IMAGE_THUMB : SAMPLE_THUMB;
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <div className="flex items-center justify-between bg-muted/40 px-3 py-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {isImage ? "1920 × 1280 · PNG" : "1080P · MP4"}
        </span>
      </div>
      <div
        className={cn(
          "relative bg-cover bg-center",
          isImage ? "aspect-[4/3]" : "aspect-video",
        )}
        style={{ backgroundImage: `url(${bg})` }}
      >
        {overlay && (
          <div className="absolute left-1/2 top-[78%] -translate-x-1/2 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-foreground shadow">
            Watch what she will do
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}


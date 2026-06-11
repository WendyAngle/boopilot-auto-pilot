import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Upload, Image as ImageIcon, Type, Smartphone, Music2, Palette, Globe2,
  Smile, Play, Sparkles, ChevronRight, X, Zap, Cpu, ChevronDown, FolderOpen, Sparkle,
  Send, Save, Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagMultiSelect } from "@/components/tag-multi-select";
import { PLATFORM_LIMITS, CreatePostTaskDialog, type Platform, type PostItem } from "@/routes/_app.materials.posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai/video")({
  component: VideoGenPage,
  head: () => ({ meta: [{ title: "视频生成 — BooPilot" }] }),
});

type Mode = "image" | "text";
type Status = "idle" | "loading" | "done";

const PLATFORMS = ["Facebook", "Tiktok", "Twitter/X", "Instagram", "WhatsApp"];
const REGIONS = ["中国大陆", "北美", "东南亚", "欧洲", "全球"];
const PACE = ["慢速 (氛围)", "中等 (叙事)", "快速 (爆点)"];
const STYLES = ["商务专业", "时尚潮流", "温馨治愈", "科技未来", "极简文艺", "活力青春"];
const VOICES = ["女声-知性", "女声-甜美", "男声-沉稳", "男声-阳光", "童声"];
const EMOTIONS = ["默认/平和", "热情活泼", "深情款款", "严肃正式", "幽默轻松"];
const BGM = ["流行轻快", "电子节奏", "舒缓钢琴", "国风古韵", "燃情史诗"];
const AI_MODELS = ["待补充"];

const LIBRARY_VOICES = [
  { id: "lib-v-1", name: "知性女声-小雅", duration: "0:12" },
  { id: "lib-v-2", name: "甜美女声-糖糖", duration: "0:10" },
  { id: "lib-v-3", name: "沉稳男声-志远", duration: "0:15" },
  { id: "lib-v-4", name: "阳光男声-子默", duration: "0:11" },
  { id: "lib-v-5", name: "童声-小布", duration: "0:08" },
];
const LIBRARY_BGM = [
  { id: "lib-b-1", name: "城市夜晚-Lofi", duration: "1:24" },
  { id: "lib-b-2", name: "夏日海岸-Pop", duration: "1:48" },
  { id: "lib-b-3", name: "电子律动-EDM", duration: "2:02" },
  { id: "lib-b-4", name: "古风山水-国乐", duration: "1:36" },
  { id: "lib-b-5", name: "史诗大片-Cinematic", duration: "2:10" },
];

type SubtitlePreset = {
  id: string;
  name: string;
  bgClass: string;
  textStyle: React.CSSProperties;
};

const SUBTITLE_PRESETS: SubtitlePreset[] = [
  {
    id: "shadow3d",
    name: "3D阴影",
    bgClass: "bg-gradient-to-br from-indigo-200 to-indigo-400",
    textStyle: {
      color: "#fff",
      fontWeight: 800,
      fontSize: 18,
      textShadow: "2px 2px 0 #ff3d7f, 4px 4px 0 #1f1f1f",
      letterSpacing: 0.5,
    },
  },
  {
    id: "block",
    name: "区块强调",
    bgClass: "bg-gradient-to-br from-slate-200 to-slate-300",
    textStyle: {
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
      background: "#e11d48",
      padding: "4px 10px",
      borderRadius: 2,
    },
  },
  {
    id: "border",
    name: "边框",
    bgClass: "bg-gradient-to-br from-amber-100 to-amber-200",
    textStyle: {
      color: "#111",
      fontWeight: 700,
      fontSize: 14,
      background: "#fff",
      padding: "4px 10px",
      border: "2px solid #111",
      borderRadius: 4,
    },
  },
  {
    id: "classic-black",
    name: "经典黑条",
    bgClass: "bg-gradient-to-br from-zinc-200 to-zinc-300",
    textStyle: {
      color: "#fff",
      fontWeight: 600,
      fontSize: 14,
      background: "#000",
      padding: "3px 10px",
    },
  },
  {
    id: "classic-white",
    name: "经典白条",
    bgClass: "bg-gradient-to-br from-slate-700 to-slate-900",
    textStyle: {
      color: "#111",
      fontWeight: 600,
      fontSize: 14,
      background: "#fff",
      padding: "3px 10px",
    },
  },
  {
    id: "dark",
    name: "黑暗",
    bgClass: "bg-gradient-to-br from-neutral-800 to-neutral-950",
    textStyle: {
      color: "#f5f5f5",
      fontWeight: 700,
      fontSize: 16,
      textShadow: "0 0 6px rgba(0,0,0,0.9)",
    },
  },
  {
    id: "fresh",
    name: "清新",
    bgClass: "bg-gradient-to-br from-emerald-100 to-sky-200",
    textStyle: {
      color: "#0ea5e9",
      fontWeight: 700,
      fontSize: 16,
      textShadow: "0 1px 0 #fff, 0 0 6px rgba(255,255,255,0.8)",
    },
  },
  {
    id: "tilt",
    name: "倾斜",
    bgClass: "bg-gradient-to-br from-rose-100 to-rose-300",
    textStyle: {
      color: "#fff",
      fontWeight: 800,
      fontSize: 16,
      background: "#111",
      padding: "3px 10px",
      transform: "skewX(-12deg)",
      fontStyle: "italic",
    },
  },
  {
    id: "lemon",
    name: "柠檬",
    bgClass: "bg-gradient-to-br from-yellow-100 to-yellow-300",
    textStyle: {
      color: "#facc15",
      fontWeight: 900,
      fontSize: 18,
      WebkitTextStroke: "1px #1f2937",
      textShadow: "2px 2px 0 #1f2937",
    },
  },
  {
    id: "neon",
    name: "霓虹",
    bgClass: "bg-gradient-to-br from-slate-900 to-purple-950",
    textStyle: {
      color: "#fff",
      fontWeight: 800,
      fontSize: 16,
      textShadow:
        "0 0 4px #f0f, 0 0 8px #f0f, 0 0 12px #0ff, 0 0 18px #0ff",
    },
  },
  {
    id: "outline-hi",
    name: "轮廓高亮",
    bgClass: "bg-gradient-to-br from-fuchsia-200 to-fuchsia-400",
    textStyle: {
      color: "#fde047",
      fontWeight: 800,
      fontSize: 16,
      WebkitTextStroke: "1.5px #111",
    },
  },
  {
    id: "translucent",
    name: "半透明",
    bgClass: "bg-gradient-to-br from-slate-400 to-slate-600",
    textStyle: {
      color: "#fff",
      fontWeight: 600,
      fontSize: 14,
      background: "rgba(0,0,0,0.35)",
      padding: "3px 10px",
      borderRadius: 4,
      backdropFilter: "blur(2px)",
    },
  },
  {
    id: "shadow-block",
    name: "阴影区块强调",
    bgClass: "bg-gradient-to-br from-orange-100 to-orange-300",
    textStyle: {
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
      background: "#ea580c",
      padding: "4px 10px",
      borderRadius: 2,
      boxShadow: "4px 4px 0 #1f2937",
    },
  },
  {
    id: "spotlight",
    name: "聚光灯区块强调",
    bgClass: "bg-gradient-to-br from-slate-800 to-slate-950",
    textStyle: {
      color: "#111",
      fontWeight: 800,
      fontSize: 14,
      background: "#fde047",
      padding: "4px 10px",
      boxShadow: "0 0 20px 6px rgba(253,224,71,0.6)",
    },
  },
  {
    id: "bar-hi",
    name: "白条式高亮",
    bgClass: "bg-gradient-to-br from-cyan-100 to-cyan-300",
    textStyle: {
      color: "#0f172a",
      fontWeight: 700,
      fontSize: 14,
      background: "linear-gradient(transparent 55%, #fff 55%)",
      padding: "0 4px",
    },
  },
  {
    id: "white-outline",
    name: "白色轮廓",
    bgClass: "bg-gradient-to-br from-violet-300 to-violet-500",
    textStyle: {
      color: "#1f2937",
      fontWeight: 800,
      fontSize: 16,
      WebkitTextStroke: "2px #fff",
    },
  },
];

function VideoGenPage() {
  const [mode, setMode] = useState<Mode>("image");
  const [productImg, setProductImg] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState("Tiktok");
  const [sellingPoints, setSellingPoints] = useState("");
  const [textPrompt, setTextPrompt] = useState("");
  const [region, setRegion] = useState("中国大陆");
  const [duration, setDuration] = useState(15);
  const [pace, setPace] = useState(PACE[1]);
  const [style, setStyle] = useState(STYLES[0]);
  const [voice, setVoice] = useState<string>("");
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [bgm, setBgm] = useState<string>("");
  const [aiModel, setAiModel] = useState<string>("");
  const [subtitleOn, setSubtitleOn] = useState(true);
  const [subtitlePreset, setSubtitlePreset] = useState(SUBTITLE_PRESETS[2]);
  const [subPos, setSubPos] = useState("底部");
  const [subSize, setSubSize] = useState("32px");
  const [subtitleOpen, setSubtitleOpen] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [postTaskOpen, setPostTaskOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [recognizing, setRecognizing] = useState(false);

  function recognizeProduct() {
    setRecognizing(true);
    toast.info("AI 正在识别产品信息…");
    setTimeout(() => {
      setProductName("智能无线降噪耳机 Pro");
      setSellingPoints(
        "主动降噪 42dB | 单次续航 12 小时 | 蓝牙 5.3 低延迟 | IPX5 防水 | 入耳贴合设计",
      );
      setRecognizing(false);
      toast.success("已自动填充产品名称与核心卖点");
    }, 1200);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProductImg(URL.createObjectURL(f));
    recognizeProduct();
  }

  function generate() {
    if (mode === "image" && !productImg) return toast.error("请先上传产品图");
    if (mode === "text" && !textPrompt.trim()) return toast.error("请输入创意文案");
    if (!sellingPoints.trim() && mode === "image") return toast.error("请填写核心卖点");
    setStatus("loading");
    setProgress(0);
    setGeneratedVideoUrl(null);
    const timer = setInterval(() => {
      setProgress((p) => {
        const np = p + Math.round(6 + Math.random() * 10);
        if (np >= 100) {
          clearInterval(timer);
          setStatus("done");
          setGeneratedVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
          return 100;
        }
        return np;
      });
    }, 350);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Left config */}
        <Card className="flex flex-col overflow-hidden p-0 shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 px-5 py-4">
            <h2 className="text-base font-semibold">视频一键生成</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              利用 AI 驱动，快速将创意转化为高品质营销视频
            </p>
          </div>

          {/* Mode tabs */}
          <div className="px-5 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
              {([
                { v: "image", label: "图生视频", icon: ImageIcon },
                { v: "text", label: "文生视频", icon: Type },
              ] as const).map((t) => (
                <button
                  key={t.v}
                  onClick={() => setMode(t.v as Mode)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    mode === t.v
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {mode === "image" ? (
              <Field label="上传或选择产品图" required>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
                {productImg ? (
                  <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-primary/50">
                    <img src={productImg} alt="product" className="h-48 w-full object-cover" />
                    <Badge className={cn("absolute right-2 top-2 gap-1", recognizing ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground")}>
                      <Zap className="h-3 w-3" /> {recognizing ? "AI 识别中…" : "识别完成"}
                    </Badge>
                    <button
                      onClick={() => setProductImg(null)}
                      className="absolute left-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/50"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-sm font-medium text-foreground">点击或拖拽上传产品图</span>
                      <span className="text-xs">系统将自动识别产品信息</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 w-full justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            从已有素材中选择
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuItem onClick={() => toast.info("AI 成片库选择功能开发中")}>
                          <Sparkle className="mr-2 h-4 w-4" /> 从 AI 成片库选择
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("我的原料选择功能开发中")}>
                          <ImageIcon className="mr-2 h-4 w-4" /> 从我的原料选择
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </Field>
            ) : (
              <Field label="创意文案" required>
                <Textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="请输入您的创意文案或脚本"
                  className="min-h-32"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="产品名称" required={mode === "image"}>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="例如：智能无线降噪耳机"
                />
              </Field>
              <Field label="目标平台">
                <IconSelect
                  icon={<Smartphone className="h-4 w-4" />}
                  value={platform}
                  onChange={setPlatform}
                  options={PLATFORMS}
                />
              </Field>
            </div>

            <Field label="核心卖点" required={mode === "image"}>
              <Textarea
                value={sellingPoints}
                onChange={(e) => setSellingPoints(e.target.value)}
                placeholder="请输入产品的核心卖点，多个卖点用 | 分隔"
                className="min-h-20"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="目标地域">
                <IconSelect icon={<Globe2 className="h-4 w-4" />} value={region} onChange={setRegion} options={REGIONS} />
              </Field>
              <Field
                label={
                  <span className="flex items-center justify-between">
                    <span>视频时长</span>
                    <span className="text-xs text-muted-foreground">{duration}S</span>
                  </span>
                }
              >
                <div className="flex h-10 items-center">
                  <Slider
                    value={[duration]}
                    min={5}
                    max={60}
                    step={5}
                    onValueChange={(v) => setDuration(v[0])}
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="视频节奏">
                <IconSelect icon={<Music2 className="h-4 w-4" />} value={pace} onChange={setPace} options={PACE} />
              </Field>
              <Field label="视觉风格">
                <IconSelect icon={<Palette className="h-4 w-4" />} value={style} onChange={setStyle} options={STYLES} />
              </Field>
            </div>



            <div className="grid grid-cols-2 gap-3">
              <Field label="配音音色" required>
                <AudioPicker
                  value={voice}
                  onChange={setVoice}
                  presets={VOICES}
                  library={LIBRARY_VOICES}
                  placeholder="请选择配音音色"
                  uploadAccept="audio/*"
                  libraryTitle="从我的原料库选择音色"
                />
              </Field>
              <Field label="配音情绪">
                <IconSelect icon={<Smile className="h-4 w-4" />} value={emotion} onChange={setEmotion} options={EMOTIONS} />
              </Field>
            </div>

            <Field label="背景音乐" required>
              <AudioPicker
                value={bgm}
                onChange={setBgm}
                presets={BGM}
                library={LIBRARY_BGM}
                placeholder="请选择背景音乐"
                uploadAccept="audio/*"
                libraryTitle="从我的原料库选择背景音乐"
              />
            </Field>

            {/* Subtitle */}
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">字幕效果</Label>
                <Switch checked={subtitleOn} onCheckedChange={setSubtitleOn} />
              </div>
              {subtitleOn && (
                <>
                  <button
                    onClick={() => setSubtitleOpen(true)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm hover:border-primary/60"
                  >
                    <span className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">选择系统预设样式</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="text-xs text-muted-foreground">
                    当前样式：<span className="font-medium text-primary underline-offset-2 hover:underline">{subtitlePreset.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={subPos} onValueChange={setSubPos}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="位置" />
                      </SelectTrigger>
                      <SelectContent>
                        {["顶部", "中部", "底部"].map((p) => (
                          <SelectItem key={p} value={p}>位置 {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={subSize} onValueChange={setSubSize}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="字号" />
                      </SelectTrigger>
                      <SelectContent>
                        {["24px", "28px", "32px", "36px", "40px"].map((s) => (
                          <SelectItem key={s} value={s}>字号 {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <Field label="AI 模型">
              <IconSelect
                icon={<Cpu className="h-4 w-4" />}
                value={aiModel}
                onChange={setAiModel}
                options={AI_MODELS}
                placeholder="请选择 AI 模型"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="space-y-3 border-t border-border/60 px-5 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                预计消耗积分 <Zap className="h-3 w-3 text-warning" />
                <span className="font-medium text-foreground">10</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
                  <Sparkles className="h-3 w-3" />
                  会员 7 折
                </Badge>
                <span className="text-muted-foreground">已省 <span className="font-medium text-foreground">3.0</span></span>
                <span>实付 <span className="font-medium text-foreground">7</span></span>
              </span>
            </div>
            <Button onClick={generate} disabled={status === "loading"} className="h-11 w-full text-base font-medium">
              <Sparkles className="h-4 w-4" />
              {status === "loading" ? "AI 正在创作中…" : "立即一键生成视频"}
            </Button>
          </div>
        </Card>

        {/* Right preview */}
        <div className="space-y-6">
          <div className="space-y-2 px-2">
            <h1 className="text-3xl font-bold tracking-tight">AI 视频生成，让创意动起来</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              利用先进的 AI 技术，一键将您的产品图或创意文案转化为高品质的短视频。适配多平台规格，支持全球化风格定制，助力您的品牌营销更具吸引力。
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative flex aspect-[9/16] w-full max-w-sm items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300 shadow-[var(--shadow-card)]">
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
                    <div className="text-base font-semibold text-white">AI 正在创作中…</div>
                    <div className="mt-1 text-xs text-slate-400">正在渲染视觉素材</div>
                  </div>
                </div>
              ) : status === "done" ? (
                <div className="flex h-full w-full flex-col">
                  <video
                    src={generatedVideoUrl ?? undefined}
                    controls
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
                    <Button size="sm" onClick={() => setPostTaskOpen(true)}>
                      <Send className="h-4 w-4" /> 一键发帖
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSaveOpen(true)}>
                      <Save className="h-4 w-4" /> 保存至成品素材
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!generatedVideoUrl) return;
                        try {
                          const res = await fetch(generatedVideoUrl);
                          if (!res.ok) throw new Error("下载失败");
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${productName || "video"}.mp4`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                          toast.success("已开始下载");
                        } catch {
                          toast.error("下载失败，请重试");
                        }
                      }}
                    >
                      <Download className="h-4 w-4" /> 下载到本地
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <Play className="h-7 w-7 text-slate-500" />
                  </div>
                  <div className="text-base font-medium text-slate-200">视频预览区域</div>
                  <div className="text-xs text-slate-400">
                    配置左侧参数并点击生成，AI 将为您实时渲染高保真营销视频
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle preset dialog */}
      <Dialog open={subtitleOpen} onOpenChange={setSubtitleOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>字幕效果</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SUBTITLE_PRESETS.map((p) => {
              const active = subtitlePreset.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSubtitlePreset(p)}
                  className={cn(
                    "group overflow-hidden rounded-lg border bg-card text-left transition-all hover:shadow-md",
                    active ? "border-primary ring-2 ring-primary/30" : "border-border",
                  )}
                >
                  <div className={cn("flex h-20 items-center justify-center px-2", p.bgClass)}>
                    <span style={p.textStyle}>Cool Text</span>
                  </div>

                  <div className="border-t border-border px-3 py-2 text-xs font-medium">
                    {p.name}
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubtitleOpen(false)}>取消</Button>
            <Button onClick={() => setSubtitleOpen(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveToMaterialDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        videoUrl={generatedVideoUrl}
        platform={platform as Platform}
        defaultTitle={productName}
        defaultContent={sellingPoints}
      />

      <CreatePostTaskDialog
        open={postTaskOpen}
        onOpenChange={setPostTaskOpen}
        lockedPlatform={platform as Platform}
        showPostEditor
        defaultPostTitle={productName}
        defaultPostContent={sellingPoints}
        selectedPosts={[
          {
            id: "video-gen-temp",
            type: "video",
            title: productName || "AI 生成视频",
            content: sellingPoints,
            images: [],
            videoUrl: generatedVideoUrl ?? undefined,
            platforms: [platform as Platform],
            publishStatus: { [platform as Platform]: "unpublished" },
            tags: [],
            enabled: true,
            createdAt: new Date().toISOString(),
            tenantId: "",
            tenantName: "",
          } satisfies PostItem,
        ]}
        onCreated={() => {
          setPostTaskOpen(false);
        }}
      />
    </div>
  );
}

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
      setTitle(defaultTitle);
      setContent(defaultContent);
      setTags([]);
      setEnabled(true);
    }
  }, [open, defaultTitle, defaultContent]);

  const handleSubmit = () => {
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
          <DialogDescription>
            将刚生成的视频保存为贴文素材。目标平台与贴文类型已锁定，其他信息可继续编辑。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="目标平台">
              <Input value={lockedPlatform} disabled />
            </Field>
            <Field label="贴文类型">
              <Input value="视频" disabled />
            </Field>
          </div>

          {hasTitle && (
            <Field label={`贴文标题 * (${title.length}/${limit.titleMax})`}>
              <Input
                value={title}
                maxLength={limit.titleMax}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入贴文标题"
              />
            </Field>
          )}

          <Field label={`文案内容 (${content.length}/${limit.contentMax})`}>
            <Textarea
              value={content}
              maxLength={limit.contentMax}
              rows={4}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入贴文文案内容"
            />
          </Field>

          <Field label="上传视频 *">
            {videoUrl ? (
              <video src={videoUrl} controls className="max-h-72 w-full rounded-md bg-black" />
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/30 py-10 text-center text-xs text-muted-foreground">
                暂无视频
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              视频时长建议受 {lockedPlatform} 限制：格式 {limit.videoFormats.join(", ")}，文件大小 {limit.videoMaxFileText}
            </p>
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
          <Button onClick={handleSubmit}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

type LibraryAudio = { id: string; name: string; duration: string };

function AudioPicker({
  value, onChange, presets, library, placeholder, uploadAccept, libraryTitle,
}: {
  value: string;
  onChange: (v: string) => void;
  presets: string[];
  library: LibraryAudio[];
  placeholder?: string;
  uploadAccept?: string;
  libraryTitle?: string;
}) {
  const [tab, setTab] = useState<"preset" | "upload" | "library">("preset");
  const [libOpen, setLibOpen] = useState(false);
  const [uploadName, setUploadName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadName(f.name);
    onChange(`本地：${f.name}`);
    toast.success(`已选择本地文件 ${f.name}`);
  };

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-md border border-border/60 bg-muted/30 p-0.5 text-xs">
        {[
          { k: "preset", label: "系统预设" },
          { k: "upload", label: "本地上传" },
          { k: "library", label: "我的原料库" },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k as typeof tab)}
            className={cn(
              "rounded-[5px] px-2.5 py-1 transition",
              tab === t.k ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "preset" && (
        <IconSelect value={value.startsWith("本地：") || value.startsWith("原料库：") ? "" : value} onChange={onChange} options={presets} placeholder={placeholder} />
      )}

      {tab === "upload" && (
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept={uploadAccept} className="hidden" onChange={handleUpload} />
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> 选择本地文件
          </Button>
          <span className="truncate text-xs text-muted-foreground">
            {value.startsWith("本地：") ? value.replace("本地：", "") : uploadName || "支持 MP3 / WAV / M4A"}
          </span>
        </div>
      )}

      {tab === "library" && (
        <>
          <button
            type="button"
            onClick={() => setLibOpen(true)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm hover:border-primary/60"
          >
            <span className="flex items-center gap-2 truncate">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className={cn("truncate", !value.startsWith("原料库：") && "text-muted-foreground")}>
                {value.startsWith("原料库：") ? value.replace("原料库：", "") : "从我的原料库选择"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <Dialog open={libOpen} onOpenChange={setLibOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{libraryTitle ?? "从我的原料库选择"}</DialogTitle>
                <DialogDescription>从已上传到原料库的音频中选择一项使用</DialogDescription>
              </DialogHeader>
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                {library.map((item) => {
                  const selected = value === `原料库：${item.name}`;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(`原料库：${item.name}`);
                        setLibOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition hover:border-primary/60 hover:bg-muted/40",
                        selected ? "border-primary bg-primary/5" : "border-border/60",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Music2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    </button>
                  );
                })}
                {library.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">原料库暂无音频</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLibOpen(false)}>取消</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

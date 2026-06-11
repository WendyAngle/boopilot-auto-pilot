import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Video as VideoIcon } from "lucide-react";
import {
  Upload,
  X,
  Sparkles,
  Zap,
  Cpu,
  Image as ImageIcon,
  Download,
  Send,
  Save,
  RefreshCw,
  Wand2,
  User,
  Package,
  Type,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getActiveModelsByModules } from "@/lib/models-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai/image")({
  component: ImageGenPage,
  head: () => ({ meta: [{ title: "图片生成 — BooPilot" }] }),
});

type Status = "idle" | "loading" | "done";
type Mode = "image2image" | "text2image";

const PROMPT_MAX = 200;
const FILE_MAX_MB = 10;
const ACCEPT_TYPES = "image/jpeg,image/png,image/webp";
const ACCEPT_LABEL = "支持 JPG、JPEG、PNG、WEBP，单张不超过 10MB";

function ImageGenPage() {
  const [mode, setMode] = useState<Mode>("image2image");
  const [aiModel, setAiModel] = useState<string>("");
  const availableAiModels = useMemo(
    () => getActiveModelsByModules(mode),
    [mode],
  );

  const [modelImg, setModelImg] = useState<string | null>(null);
  const [productImg, setProductImg] = useState<string | null>(null);
  const modelFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState<string[]>([]);
  const [activeResult, setActiveResult] = useState<number>(0);

  function pickImage(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > FILE_MAX_MB * 1024 * 1024) {
      toast.error(`单张图片不超过 ${FILE_MAX_MB}MB`);
      e.target.value = "";
      return;
    }
    setter(URL.createObjectURL(f));
  }

  function generate() {
    if (mode === "image2image") {
      if (!modelImg) return toast.error("请上传模特图片");
      if (!productImg) return toast.error("请上传商品图片");
    }
    if (!prompt.trim()) return toast.error("请填写提示词");
    if (!aiModel) return toast.error("请选择 AI 模型");

    setStatus("loading");
    setProgress(0);
    setGenerated([]);
    const timer = setInterval(() => {
      setProgress((p) => {
        const np = p + Math.round(6 + Math.random() * 12);
        if (np >= 100) {
          clearInterval(timer);
          const seed = Date.now();
          const imgs = Array.from({ length: 4 }).map(
            (_, i) =>
              `https://picsum.photos/seed/booimg-${seed}-${i}/600/800`,
          );
          setGenerated(imgs);
          setActiveResult(0);
          setStatus("done");
          return 100;
        }
        return np;
      });
    }, 280);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Left config */}
        <Card className="flex flex-col overflow-hidden p-0 shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 px-5 py-4">
            <h2 className="text-base font-semibold">商品图一键生成</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              上传模特与商品，AI 即刻为你合成高质感电商主图
            </p>
          </div>

          {/* Mode tabs */}
          <div className="px-5 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
              {([
                { v: "image2image", label: "图生图", icon: ImageIcon },
                { v: "text2image", label: "文生图", icon: Type },
              ] as const).map((t) => (
                <button
                  key={t.v}
                  onClick={() => {
                    setMode(t.v as Mode);
                    setAiModel("");
                  }}
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

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {mode === "image2image" && (
              <>
                <Field label="上传模特图片" required>
                  <UploadBox
                    value={modelImg}
                    inputRef={modelFileRef}
                    onChange={(e) => pickImage(e, setModelImg)}
                    onClear={() => setModelImg(null)}
                    icon={<User className="h-5 w-5" />}
                  />
                </Field>

                <Field label="上传商品图片" required>
                  <UploadBox
                    value={productImg}
                    inputRef={productFileRef}
                    onChange={(e) => pickImage(e, setProductImg)}
                    onClear={() => setProductImg(null)}
                    icon={<Package className="h-5 w-5" />}
                  />
                </Field>
              </>
            )}

            <Field label="提示词" required>
              <div className="relative">
                <Textarea
                  value={prompt}
                  maxLength={PROMPT_MAX}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === "image2image"
                      ? "请描述：模特 + 手持 / 佩戴 / 试穿 商品 + 场景 + 风格。\n例如：\n - 女模特手持护肤品，白色背景，高清电商主图\n - 男模特佩戴耳机，干净纯色背景，均匀柔光，突出产品细节与质感，构图居中，高清画质，8K，商业级质感，无水印，专业电商商品图"
                      : "请描述你想生成的画面：主体 + 场景 + 风格 + 细节。\n例如：\n - 一只在樱花树下喝抹茶的柴犬，日式浮世绘风格，高饱和度\n - 极简电商主图，纯白背景，悬浮的香水瓶，高级感，8K"
                  }
                  className="min-h-40 pb-6"
                />
                <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-muted-foreground">
                  {prompt.length}/{PROMPT_MAX}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                onClick={() => {
                  setPrompt(
                    mode === "image2image"
                      ? "女模特手持产品，纯白背景，柔和光影，电商主图风格，超高清细节，8K，商业级质感，无水印"
                      : "极简电商主图，纯白背景，柔和光影，构图居中，超高清细节，8K，商业级质感",
                  );
                  toast.success("AI 已为你润色提示词");
                }}
              >
                <Wand2 className="h-3 w-3" /> AI 智能润色
              </button>
            </Field>

            <Field label="AI 模型" required>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground">
                      <Cpu className="h-4 w-4" />
                    </span>
                    <SelectValue placeholder="请选择 AI 模型" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableAiModels.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      暂无可用模型，请前往「系统管理 / 模型管理」配置
                    </div>
                  ) : (
                    availableAiModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.name}</span>
                          {m.vendor && (
                            <span className="text-[11px] text-muted-foreground">
                              · {m.vendor}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Footer */}
          <div className="space-y-3 border-t border-border/60 px-5 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                预计消耗积分 <Zap className="h-3 w-3 text-warning" />
                <span className="font-medium text-foreground">12</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
                  <Sparkles className="h-3 w-3" />
                  会员 8 折
                </Badge>
                <span>已省 <span className="font-medium text-foreground">2.4</span></span>
                <span>实付 <span className="font-medium text-foreground">9.6</span></span>
              </span>
            </div>
            <Button
              onClick={generate}
              disabled={status === "loading"}
              className="h-11 w-full text-base font-medium"
            >
              <Sparkles className="h-4 w-4" />
              {status === "loading" ? "AI 正在创作中…" : "开始生成"}
            </Button>
          </div>
        </Card>

        {/* Right preview */}
        <div className="space-y-6">
          <div className="space-y-2 px-2">
            <h1 className="text-3xl font-bold tracking-tight">AI 商品图生成，让卖货更轻松</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              上传模特与商品图片，AI 自动合成高质感电商主图。覆盖 3C / 美妆 / 家居 / 饰品等品类，让出图效率提升 10 倍。
            </p>
          </div>

          {status === "idle" && (
            <Card className="flex min-h-[480px] flex-col items-center justify-center gap-3 border-dashed bg-muted/20 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImageIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-base font-medium">图片预览区域</div>
              <div className="max-w-sm text-xs text-muted-foreground">
                配置左侧参数并点击「开始生成」，AI 将为你输出高保真电商商品图
              </div>
            </Card>
          )}

          {status === "loading" && (
            <Card className="flex min-h-[480px] flex-col items-center justify-center gap-5 p-10">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted" />
                  <circle
                    cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                    className="text-primary transition-all"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                  {progress}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-base font-semibold">AI 正在创作中…</div>
                <div className="mt-1 text-xs text-muted-foreground">正在合成模特与商品场景</div>
              </div>
              <div className="grid w-full max-w-md grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] animate-pulse rounded-md bg-gradient-to-br from-muted to-muted/40"
                  />
                ))}
              </div>
            </Card>
          )}

          {status === "done" && (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col lg:flex-row">
                <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                  <img
                    src={generated[activeResult]}
                    alt="result"
                    className="max-h-[520px] aspect-[3/4] rounded-lg object-contain shadow-2xl"
                  />
                </div>
                <div className="w-full shrink-0 space-y-3 border-t border-border/60 p-4 lg:w-64 lg:border-l lg:border-t-0">
                  <div>
                    <div className="text-sm font-semibold">生成结果</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      共 {generated.length} 张 · 已选第 {activeResult + 1} 张
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
                    {generated.map((src, i) => (
                      <button
                        key={src}
                        onClick={() => setActiveResult(i)}
                        className={cn(
                          "overflow-hidden rounded-md border-2 transition",
                          activeResult === i ? "border-primary" : "border-transparent hover:border-primary/40",
                        )}
                      >
                        <img src={src} alt="" className="aspect-square w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button className="w-full" onClick={() => toast.success("已创建发帖任务")}>
                      <Send className="h-4 w-4" /> 一键发帖
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        try {
                          sessionStorage.setItem(
                            "ai_image_to_video",
                            JSON.stringify({
                              imageUrl: generated[activeResult],
                              from: "image-gen",
                              ts: Date.now(),
                            }),
                          );
                        } catch {}
                        navigate({ to: "/ai/video" });
                      }}
                    >
                      <VideoIcon className="h-4 w-4" /> 生成视频
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => toast.success("已保存至成品素材")}
                    >
                      <Save className="h-4 w-4" /> 保存至成品素材
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          const res = await fetch(generated[activeResult]);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `product-image-${activeResult + 1}.jpg`;
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
                    <Button variant="ghost" className="w-full" onClick={generate}>
                      <RefreshCw className="h-4 w-4" /> 重新生成
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadBox({
  value,
  inputRef,
  onChange,
  onClear,
  icon,
}: {
  value: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  icon: React.ReactNode;
}) {
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES}
        className="hidden"
        onChange={onChange}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-primary/50">
          <img
            src={value}
            alt="upload"
            className="h-48 w-full bg-[conic-gradient(at_top_left,_var(--muted),_var(--background))] object-contain"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur hover:bg-background"
          >
            <Upload className="h-3 w-3" /> 重新上传
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
            {icon}
          </span>
          <span className="text-sm font-medium text-foreground">点击或拖拽上传图片</span>
          <span className="px-3 text-center text-[11px] leading-relaxed">
            {ACCEPT_LABEL}
          </span>
        </button>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-sm font-medium">
        <span className="inline-block h-3.5 w-[3px] rounded-sm bg-primary" />
        <span className="text-foreground">{label}</span>
        {required && <span className="text-destructive">*</span>}
        <span className="text-xs font-normal text-muted-foreground">(必选)</span>
      </Label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

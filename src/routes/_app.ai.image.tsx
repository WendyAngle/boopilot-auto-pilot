import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  X,
  Plus,
  Sparkles,
  Zap,
  Cpu,
  Image as ImageIcon,
  Check,
  Download,
  Send,
  Save,
  RefreshCw,
  Wand2,
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

const CATEGORY_TREE: Record<string, string[]> = {
  "3C 数码 / 小家电": [
    "手机", "耳机", "充电宝", "数据线", "剃须刀", "吹风机", "卷发棒",
    "小风扇", "智能手表", "摄像头", "小音箱",
  ],
  "家居日用小件": ["收纳盒", "保温杯", "餐具", "毛巾", "拖鞋", "香薰"],
  "美妆工具 / 个护": ["化妆刷", "美妆蛋", "护肤瓶", "梳子", "面膜", "卷睫毛器"],
  "饰品配件（非佩戴类）": ["手机壳", "钥匙扣", "包挂件", "汽车挂件"],
  "工具 / 小件产品": ["螺丝刀", "卷尺", "胶带", "小型工具箱", "充电插头"],
};

type ModelOption = {
  id: string;
  name: string;
  cover: string;
  custom?: boolean;
};

const PRESET_MODELS: ModelOption[] = [
  { id: "m-elegant-f", name: "优雅女性", cover: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=70&auto=format&fit=crop" },
  { id: "m-sunny-m", name: "阳光男性", cover: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=70&auto=format&fit=crop" },
  { id: "m-home-f", name: "居家女性", cover: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=70&auto=format&fit=crop" },
  { id: "m-cool-f", name: "酷感女性", cover: "https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=300&q=70&auto=format&fit=crop" },
  { id: "m-mature-m", name: "成熟男性", cover: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&q=70&auto=format&fit=crop" },
  { id: "m-sweet-f", name: "甜美女性", cover: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=300&q=70&auto=format&fit=crop" },
];

const ASPECT_OPTIONS = [
  { v: "1:1", label: "1:1 方图" },
  { v: "3:4", label: "3:4 竖图" },
  { v: "4:3", label: "4:3 横图" },
  { v: "9:16", label: "9:16 长图" },
];

const QUALITY_OPTIONS = [
  { v: "standard", label: "标准 (1024)" },
  { v: "hd", label: "高清 (2048)" },
];

function ImageGenPage() {
  const [cat1, setCat1] = useState<string>("");
  const [cat2, setCat2] = useState<string>("");
  const cat2Options = cat1 ? CATEGORY_TREE[cat1] ?? [] : [];

  const [productImg, setProductImg] = useState<string | null>(null);
  const productFileRef = useRef<HTMLInputElement>(null);

  const [models, setModels] = useState<ModelOption[]>(PRESET_MODELS);
  const [activeModelId, setActiveModelId] = useState<string>(PRESET_MODELS[0].id);
  const modelFileRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("3:4");
  const [quality, setQuality] = useState("standard");
  const [count, setCount] = useState(4);

  const [aiModel, setAiModel] = useState<string>("");
  const availableAiModels = useMemo(
    () => getActiveModelsByModules(["text2image", "image2image"]),
    [],
  );

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState<string[]>([]);
  const [activeResult, setActiveResult] = useState<number>(0);

  function pickProduct(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProductImg(URL.createObjectURL(f));
    toast.success("商品图已上传");
  }

  function pickModel(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const id = `m-custom-${Date.now()}`;
    const newModel: ModelOption = { id, name: "自定义模特", cover: url, custom: true };
    setModels((arr) => [...arr, newModel]);
    setActiveModelId(id);
    toast.success("自定义模特已添加");
  }

  function generate() {
    if (!cat1 || !cat2) return toast.error("请选择产品分类");
    if (!productImg) return toast.error("请上传商品图");
    if (!activeModelId) return toast.error("请选择模特");
    if (!prompt.trim()) return toast.error("请填写提示词");

    setStatus("loading");
    setProgress(0);
    setGenerated([]);
    const timer = setInterval(() => {
      setProgress((p) => {
        const np = p + Math.round(6 + Math.random() * 12);
        if (np >= 100) {
          clearInterval(timer);
          const seed = Date.now();
          const ratio = aspect === "1:1" ? [600, 600]
            : aspect === "3:4" ? [600, 800]
            : aspect === "4:3" ? [800, 600]
            : [450, 800];
          const imgs = Array.from({ length: count }).map(
            (_, i) =>
              `https://picsum.photos/seed/booimg-${seed}-${i}/${ratio[0]}/${ratio[1]}`,
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

  const aspectClass =
    aspect === "1:1" ? "aspect-square"
    : aspect === "4:3" ? "aspect-[4/3]"
    : aspect === "9:16" ? "aspect-[9/16]"
    : "aspect-[3/4]";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Left config */}
        <Card className="flex flex-col overflow-hidden p-0 shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 px-5 py-4">
            <h2 className="text-base font-semibold">商品图一键生成</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              上传商品 + 选择模特，AI 即刻为你生成高质量电商主图
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <Field label="产品分类" required>
              <div className="space-y-2">
                <Select
                  value={cat1}
                  onValueChange={(v) => {
                    setCat1(v);
                    setCat2("");
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="请选择产品所属分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CATEGORY_TREE).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cat2} onValueChange={setCat2} disabled={!cat1}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="请选择二级分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {cat2Options.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <Field label="上传商品图" required>
              <input
                ref={productFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickProduct}
              />
              {productImg ? (
                <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-primary/50">
                  <img src={productImg} alt="product" className="h-56 w-full object-contain bg-[conic-gradient(at_top_left,_var(--muted),_var(--background))]" />
                  <button
                    onClick={() => setProductImg(null)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => productFileRef.current?.click()}
                  className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/50"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium text-foreground">点击或拖拽上传</span>
                  <span className="text-xs">支持透明底图效果更佳</span>
                </button>
              )}
            </Field>

            <Field label="选择模特" required>
              <input
                ref={modelFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickModel}
              />
              <div className="grid grid-cols-3 gap-2">
                {models.map((m) => {
                  const active = activeModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveModelId(m.id)}
                      className={cn(
                        "group relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-muted transition-all",
                        active ? "border-primary shadow-md" : "border-transparent hover:border-primary/40",
                      )}
                    >
                      <img src={m.cover} alt={m.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-1.5 text-center text-[11px] font-medium text-white">
                        {m.name}
                      </div>
                      {active && (
                        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => modelFileRef.current?.click()}
                  className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/50"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-[11px] font-medium text-foreground">上传模特</span>
                </button>
              </div>
            </Field>

            <Field label="提示词编辑" required>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={"请描述：模特 + 手持 商品 + 场景 + 风格。\n例如：女模特手持护肤品，白色背景，高清电商主图。"}
                className="min-h-28"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => {
                    setPrompt("女模特手持产品，纯白背景，柔和光影，电商主图风格，超高清细节");
                    toast.success("AI 已为你润色提示词");
                  }}
                >
                  <Wand2 className="h-3 w-3" /> AI 智能润色
                </button>
                <span>{prompt.length}/500</span>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="图片比例">
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASPECT_OPTIONS.map((o) => (
                      <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="出图质量">
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUALITY_OPTIONS.map((o) => (
                      <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="单次生成张数">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={cn(
                      "h-9 rounded-md border text-sm font-medium transition-colors",
                      count === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {n} 张
                  </button>
                ))}
              </div>
            </Field>

            <Field label="AI 模型">
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
                <span className="font-medium text-foreground">{count * 3}</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
                  <Sparkles className="h-3 w-3" />
                  会员 8 折
                </Badge>
                <span>已省 <span className="font-medium text-foreground">{(count * 3 * 0.2).toFixed(1)}</span></span>
                <span>实付 <span className="font-medium text-foreground">{(count * 3 * 0.8).toFixed(1)}</span></span>
              </span>
            </div>
            <Button
              onClick={generate}
              disabled={status === "loading"}
              className="h-11 w-full text-base font-medium"
            >
              <Sparkles className="h-4 w-4" />
              {status === "loading" ? "AI 正在创作中…" : "立即开始生成"}
            </Button>
          </div>
        </Card>

        {/* Right preview */}
        <div className="space-y-6">
          <div className="space-y-2 px-2">
            <h1 className="text-3xl font-bold tracking-tight">AI 商品图生成，让卖货更轻松</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              上传商品图，选择模特与场景，AI 自动合成高质感电商主图。覆盖 3C / 美妆 / 家居 / 饰品等品类，让出图效率提升 10 倍。
            </p>
          </div>

          {status === "idle" && (
            <Card className="flex min-h-[480px] flex-col items-center justify-center gap-3 border-dashed bg-muted/20 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImageIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-base font-medium">图片预览区域</div>
              <div className="max-w-sm text-xs text-muted-foreground">
                配置左侧参数并点击「立即开始生成」，AI 将为你输出高保真电商商品图
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
                {Array.from({ length: count }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      aspectClass,
                      "animate-pulse rounded-md bg-gradient-to-br from-muted to-muted/40",
                    )}
                  />
                ))}
              </div>
            </Card>
          )}

          {status === "done" && (
            <div className="space-y-4">
              <Card className="overflow-hidden p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Main preview */}
                  <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                    <img
                      src={generated[activeResult]}
                      alt="result"
                      className={cn(
                        "max-h-[520px] rounded-lg object-contain shadow-2xl",
                        aspectClass,
                      )}
                    />
                  </div>
                  {/* Side actions */}
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
                      <Button
                        className="w-full"
                        onClick={() => toast.success("已创建发帖任务")}
                      >
                        <Send className="h-4 w-4" /> 一键发帖
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
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={generate}
                      >
                        <RefreshCw className="h-4 w-4" /> 重新生成
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
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
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

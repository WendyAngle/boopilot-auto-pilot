import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Cpu,
  ChevronDown,
  Boxes,
  Power,
  Wallet,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/pagination-bar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/system/models")({
  component: ModelManagement,
  head: () => ({
    meta: [
      { title: "模型管理 — BooPilot" },
      { name: "description", content: "维护 AI 模型接入配置与启用状态" },
    ],
  }),
});

/* ============================================================ */
/* 类型 & 常量(来自共享 lib)                                     */
/* ============================================================ */

import {
  MODULE_OPTIONS,
  MODULE_LABEL,
  PRICING_LABEL,
  MOCK_MODELS,
  type AppModule,
  type ModelItem,
  type ModelStatus,
  type PricingType,
} from "@/lib/models-mock";

function genModelId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MDL-${ts}${rand}`;
}

function maskKey(key: string) {
  if (!key) return "—";
  if (key.length <= 8) return "••••" + key.slice(-2);
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

/* ============================================================ */
/* 表单弹窗                                                      */
/* ============================================================ */

interface ModelFormValue {
  id: string;
  name: string;
  apiName: string;
  apiKey: string;
  modules: AppModule[];
  status: ModelStatus;
  vendor: string;
  pricing: PricingType | "";
  remark: string;
}

function emptyForm(): ModelFormValue {
  return {
    id: genModelId(),
    name: "",
    apiName: "",
    apiKey: "",
    modules: [],
    status: "active",
    vendor: "",
    pricing: "",
    remark: "",
  };
}

function ModelFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial?: ModelFormValue;
  onSubmit: (v: ModelFormValue) => void;
}) {
  const [form, setForm] = useState<ModelFormValue>(initial ?? emptyForm());
  const [modulesOpen, setModulesOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // re-init when dialog opens
  useMemo(() => {
    if (open) {
      setForm(initial ?? emptyForm());
      setShowKey(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleModule = (m: AppModule) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(m)
        ? f.modules.filter((x) => x !== m)
        : [...f.modules, m],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("请输入模型名称");
    if (form.name.length > 100) return toast.error("模型名称不超过 100 字符");
    if (!form.apiName.trim()) return toast.error("请输入 API 名称");
    if (form.apiName.length > 100) return toast.error("API 名称不超过 100 字符");
    if (!form.apiKey.trim()) return toast.error("请输入 API Key");
    if (form.apiKey.length > 200) return toast.error("API Key 不超过 200 字符");
    if (form.modules.length === 0) return toast.error("请选择至少一个应用模块");
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增模型配置" : "编辑模型配置"}</DialogTitle>
          <DialogDescription>
            配置模型接入的 API 信息与可用模块，保存后将在 AI 创作中可选。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right text-muted-foreground">模型编号</Label>
            <div className="col-span-3 flex h-9 items-center rounded-md bg-muted/50 px-3 text-sm font-mono text-muted-foreground">
              {form.id}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="m-name" className="text-right">
              模型名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="m-name"
              className="col-span-3"
              maxLength={100}
              placeholder="如：Kling 2.0 图生视频"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="m-apiname" className="text-right">
              API 名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="m-apiname"
              className="col-span-3"
              maxLength={100}
              placeholder="如：kling-v2-image2video"
              value={form.apiName}
              onChange={(e) => setForm({ ...form, apiName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-3">
            <Label htmlFor="m-apikey" className="pt-2 text-right">
              API Key <span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3 space-y-1">
              <div className="relative">
                <Input
                  id="m-apikey"
                  type={showKey ? "text" : "password"}
                  maxLength={200}
                  placeholder="请输入 API Key(最多 200 字符)"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {form.apiKey.length} / 200
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">
              应用模块 <span className="text-destructive">*</span>
            </Label>
            <Popover open={modulesOpen} onOpenChange={setModulesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="col-span-3 h-9 justify-between font-normal"
                >
                  <span className="truncate text-left">
                    {form.modules.length === 0
                      ? "请选择应用模块（支持多选）"
                      : form.modules.map((m) => MODULE_LABEL[m]).join("、")}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                <div className="space-y-1">
                  {MODULE_OPTIONS.map((m) => {
                    const checked = form.modules.includes(m.value);
                    return (
                      <label
                        key={m.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleModule(m.value)}
                        />
                        <span>{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right">启用状态</Label>
            <div className="col-span-3 flex items-center gap-3">
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })}
              />
              <span className="text-sm text-muted-foreground">
                {form.status === "active" ? "启用" : "停用"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="m-vendor" className="text-right text-muted-foreground">
              开发商
            </Label>
            <Input
              id="m-vendor"
              className="col-span-3"
              maxLength={100}
              placeholder="如:快手、字节跳动、OpenAI(选填)"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-right text-muted-foreground">是否付费</Label>
            <Select
              value={form.pricing === "" ? "none" : form.pricing}
              onValueChange={(v) =>
                setForm({ ...form, pricing: v === "none" ? "" : (v as PricingType) })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="请选择(选填)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未设置</SelectItem>
                <SelectItem value="free">开源免费</SelectItem>
                <SelectItem value="paid">付费</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-3">
            <Label htmlFor="m-remark" className="pt-2 text-right text-muted-foreground">
              备注
            </Label>
            <div className="col-span-3 space-y-1">
              <Textarea
                id="m-remark"
                rows={3}
                maxLength={200}
                placeholder="备注信息(选填,最多 200 字符)"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">{form.remark.length} / 200</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================ */
/* 详情弹窗                                                      */
/* ============================================================ */

function ModelDetailDialog({
  model,
  onOpenChange,
}: {
  model: ModelItem | null;
  onOpenChange: (v: boolean) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  return (
    <Dialog
      open={!!model}
      onOpenChange={(v) => {
        if (!v) setShowKey(false);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>模型详情</DialogTitle>
        </DialogHeader>
        {model && (
          <div className="space-y-3 text-sm">
            <DetailRow label="模型编号" value={<span className="font-mono">{model.id}</span>} />
            <DetailRow label="模型名称" value={model.name} />
            <DetailRow label="API 名称" value={<span className="font-mono">{model.apiName}</span>} />
            <DetailRow
              label="API Key"
              value={
                <div className="flex items-center gap-1">
                  <code className="flex-1 truncate rounded-md bg-muted/60 px-2 py-1 font-mono text-xs">
                    {showKey ? model.apiKey || "—" : maskKey(model.apiKey)}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={showKey ? "隐藏" : "查看明文"}
                    title={showKey ? "隐藏" : "查看明文"}
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(model.apiKey);
                      toast.success("已复制 API Key");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="复制"
                    title="复制"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              }
            />
            <DetailRow
              label="应用模块"
              value={
                <div className="flex flex-wrap gap-1">
                  {model.modules.map((m) => (
                    <Badge key={m} variant="secondary">
                      {MODULE_LABEL[m]}
                    </Badge>
                  ))}
                </div>
              }
            />
            <DetailRow
              label="启用状态"
              value={
                model.status === "active" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                    <Check className="mr-1 h-3 w-3" /> 启用
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <X className="mr-1 h-3 w-3" /> 停用
                  </Badge>
                )
              }
            />
            <DetailRow label="开发商" value={model.vendor || "—"} />
            <DetailRow
              label="是否付费"
              value={model.pricing ? PRICING_LABEL[model.pricing] : "—"}
            />
            <DetailRow
              label="备注"
              value={
                model.remark ? (
                  <span className="whitespace-pre-wrap">{model.remark}</span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="创建时间" value={model.createdAt} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-4 items-start gap-3">
      <div className="text-right text-muted-foreground">{label}</div>
      <div className="col-span-3">{value}</div>
    </div>
  );
}


/* ============================================================ */
/* 主组件                                                        */
/* ============================================================ */

function ModelManagement() {
  const [models, setModels] = useState<ModelItem[]>(MOCK_MODELS);

  // search state
  const [keyword, setKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | AppModule>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ModelStatus>("all");
  const [applied, setApplied] = useState({
    keyword: "",
    module: "all" as "all" | AppModule,
    status: "all" as "all" | ModelStatus,
  });

  // selection / pagination
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ModelFormValue | undefined>(undefined);
  const [viewing, setViewing] = useState<ModelItem | null>(null);
  const [deleting, setDeleting] = useState<ModelItem | null>(null);
  const [batchConfirm, setBatchConfirm] = useState<null | "enable" | "disable">(null);

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (applied.keyword && !m.name.toLowerCase().includes(applied.keyword.toLowerCase()))
        return false;
      if (applied.module !== "all" && !m.modules.includes(applied.module)) return false;
      if (applied.status !== "all" && m.status !== applied.status) return false;
      return true;
    });
  }, [models, applied]);

  const stats = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.status === "active").length;
    const inactive = total - active;
    const free = models.filter((m) => m.pricing === "free").length;
    const paid = models.filter((m) => m.pricing === "paid").length;
    const vendors = new Set(models.map((m) => m.vendor).filter(Boolean)).size;
    const moduleCounts = MODULE_OPTIONS.map((opt) => ({
      ...opt,
      count: models.filter((m) => m.modules.includes(opt.value)).length,
    }));
    return { total, active, inactive, free, paid, vendors, moduleCounts };
  }, [models]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((m) => selected.includes(m.id));

  const handleSearch = () => {
    setApplied({ keyword, module: moduleFilter, status: statusFilter });
    setPage(1);
  };
  const handleReset = () => {
    setKeyword("");
    setModuleFilter("all");
    setStatusFilter("all");
    setApplied({ keyword: "", module: "all", status: "all" });
    setPage(1);
  };

  const toggleRow = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const togglePageAll = () => {
    if (allPageSelected) {
      setSelected((s) => s.filter((id) => !pageItems.some((m) => m.id === id)));
    } else {
      setSelected((s) => Array.from(new Set([...s, ...pageItems.map((m) => m.id)])));
    }
  };

  const upsert = (v: ModelFormValue) => {
    setModels((list) => {
      const exists = list.some((m) => m.id === v.id);
      if (exists) {
        toast.success("模型配置已更新");
        return list.map((m) =>
          m.id === v.id
            ? { ...m, name: v.name, apiName: v.apiName, apiKey: v.apiKey, modules: v.modules, status: v.status, vendor: v.vendor, pricing: v.pricing, remark: v.remark }
            : m,
        );
      }
      toast.success("模型配置已新增");
      return [
        {
          ...v,
          createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        },
        ...list,
      ];
    });
    setFormOpen(false);
  };

  const toggleStatus = (m: ModelItem) => {
    setModels((list) =>
      list.map((x) =>
        x.id === m.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x,
      ),
    );
    toast.success(m.status === "active" ? "已停用" : "已启用");
  };

  const doDelete = () => {
    if (!deleting) return;
    setModels((list) => list.filter((m) => m.id !== deleting.id));
    setSelected((s) => s.filter((id) => id !== deleting.id));
    toast.success("已删除");
    setDeleting(null);
  };

  const doBatch = () => {
    if (!batchConfirm) return;
    const target: ModelStatus = batchConfirm === "enable" ? "active" : "inactive";
    setModels((list) =>
      list.map((m) => (selected.includes(m.id) ? { ...m, status: target } : m)),
    );
    toast.success(`已批量${batchConfirm === "enable" ? "启用" : "停用"} ${selected.length} 条`);
    setBatchConfirm(null);
    setSelected([]);
  };

  const hasSelection = selected.length > 0;

  return (
    <TooltipProvider>
      <div className="space-y-4 p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">模型管理</h1>
              <p className="text-xs text-muted-foreground">
                管理 AI 模型接入配置,控制各业务模块可用的模型
              </p>
            </div>
          </div>
        </div>

        {/* 数据统计区 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">模型总数</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-2 text-primary">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                启用 <span className="font-medium text-foreground">{stats.active}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                停用 <span className="font-medium text-foreground">{stats.inactive}</span>
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">启用率</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {stats.total === 0 ? "0%" : `${Math.round((stats.active / stats.total) * 100)}%`}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-2 text-emerald-600">
                <Power className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: stats.total === 0 ? "0%" : `${(stats.active / stats.total) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">付费类型分布</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {stats.free + stats.paid}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">已标注</span>
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-2 text-amber-600">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                开源免费 <span className="font-medium text-foreground">{stats.free}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                付费 <span className="font-medium text-foreground">{stats.paid}</span>
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">合作开发商</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{stats.vendors}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 p-2 text-violet-600">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              覆盖国内外主流 AI 模型厂商
            </p>
          </div>
        </div>

        {/* 应用模块分布 */}
        <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">应用模块分布</p>
              <p className="text-xs text-muted-foreground">各业务模块当前可用模型数量</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {stats.moduleCounts.map((m) => {
              const pct = stats.total === 0 ? 0 : (m.count / stats.total) * 100;
              return (
                <div key={m.value} className="rounded-lg border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">{m.label}</span>
                    <span className="text-sm font-semibold tabular-nums">{m.count}</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 搜索区 */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">模型名称</Label>
              <Input
                placeholder="请输入模型名称"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">应用模块</Label>
              <Select
                value={moduleFilter}
                onValueChange={(v) => setModuleFilter(v as "all" | AppModule)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">状态</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | ModelStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="gap-1.5">
                <Search className="h-4 w-4" /> 查询
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> 重置
              </Button>
            </div>
          </div>
        </div>

        {/* 操作区 + 表格 */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setFormMode("create");
                  setEditing(undefined);
                  setFormOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> 新增模型配置
              </Button>
              <Button
                variant="outline"
                disabled={!hasSelection}
                onClick={() => setBatchConfirm("enable")}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" /> 批量启用
              </Button>
              <Button
                variant="outline"
                disabled={!hasSelection}
                onClick={() => setBatchConfirm("disable")}
                className="gap-1.5"
              >
                <X className="h-4 w-4" /> 批量停用
              </Button>
              {hasSelection && (
                <span className="ml-2 text-xs text-muted-foreground">
                  已选择 <span className="font-medium text-foreground">{selected.length}</span> 项
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              共 <span className="font-medium text-foreground">{filtered.length}</span> 条
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={togglePageAll}
                    aria-label="全选"
                  />
                </TableHead>
                <TableHead className="w-[180px]">模型编号</TableHead>
                <TableHead>模型名称</TableHead>
                <TableHead className="w-[140px]">开发商</TableHead>
                <TableHead className="w-[100px]">是否付费</TableHead>
                <TableHead>应用模块</TableHead>
                <TableHead className="w-[120px]">启用状态</TableHead>
                <TableHead className="w-[200px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                    暂无数据,点击「新增模型配置」开始添加
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((m) => (
                  <TableRow key={m.id} className={cn(selected.includes(m.id) && "bg-muted/30")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(m.id)}
                        onCheckedChange={() => toggleRow(m.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {m.id}
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.vendor || "—"}
                    </TableCell>
                    <TableCell>
                      {m.pricing === "free" ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                          开源免费
                        </Badge>
                      ) : m.pricing === "paid" ? (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-700">
                          付费
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.modules.map((mod) => (
                          <Badge key={mod} variant="secondary" className="font-normal">
                            {MODULE_LABEL[mod]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => toggleStatus(m)}
                            className="inline-flex items-center gap-2"
                          >
                            <Switch checked={m.status === "active"} />
                            <span
                              className={cn(
                                "text-xs",
                                m.status === "active" ? "text-emerald-600" : "text-muted-foreground",
                              )}
                            >
                              {m.status === "active" ? "启用" : "停用"}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {m.status === "active" ? "点击停用" : "点击启用"}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => setViewing(m)}
                        >
                          <Eye className="h-3.5 w-3.5" /> 查看
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => {
                            setFormMode("edit");
                            setEditing({
                              id: m.id,
                              name: m.name,
                              apiName: m.apiName,
                              apiKey: m.apiKey,
                              modules: m.modules,
                              status: m.status,
                              vendor: m.vendor,
                              pricing: m.pricing,
                              remark: m.remark,
                            });
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" /> 编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleting(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> 删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filtered.length > 0 && (
            <PaginationBar
              page={page}
              totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
              total={filtered.length}
              setPage={setPage}
            />
          )}
        </div>
      </div>

      {/* 表单弹窗 */}
      <ModelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={editing}
        onSubmit={upsert}
      />

      {/* 详情弹窗 */}
      <ModelDetailDialog model={viewing} onOpenChange={(v) => !v && setViewing(null)} />

      {/* 删除确认 */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该模型?</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除模型「{deleting?.name}」({deleting?.id}),该操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量启用/停用确认 */}
      <AlertDialog open={!!batchConfirm} onOpenChange={(v) => !v && setBatchConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认批量{batchConfirm === "enable" ? "启用" : "停用"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              将对已选 {selected.length} 个模型执行「
              {batchConfirm === "enable" ? "启用" : "停用"}」操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={doBatch}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

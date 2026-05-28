import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookmarkPlus, ExternalLink, Lock, Bot, MousePointerClick,
  Sparkles, Clock3, Target, Upload,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PLATFORMS, PLATFORM_CHIP, SUBTYPE_LABEL,
  fmtNow, genTaskId, pad, tasksActions, templatesActions, executeTask,
  type Platform, type TaskRow, type TaskTemplate,
} from "@/lib/operations-store";
import { getUsableTags } from "@/lib/systemTags";
import { TENANTS_SEED } from "@/lib/tenants";

type Priority = "low" | "normal" | "high" | "urgent";
const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; hint?: string }> = [
  { value: "low", label: "低" },
  { value: "normal", label: "中", hint: "默认" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

type ExecMode = "now" | "scheduled" | "recurring";
type TargetMode = "keyword" | "specified";
type ScriptMode = "default" | "other" | "custom";

interface DraftState {
  name: string;
  priority: Priority;
  platforms: Platform[];
  targetMode: TargetMode;
  targetKeyword: string;
  targetUrl: string;
  reachTags: string[];
  reachTenants: string[];
  perAccount: number;
  execMode: ExecMode;
  scheduledDate: string;
  scheduledTime: string;
  recurFreq: "daily" | "weekly";
  recurStart: string;
  recurEnd: string;
  recurDuration: number;
  recurForever: boolean;
  scriptMode: ScriptMode;
  scriptOther: string;
  scriptCustom: string;
  attachMaterial: string;
  notifyDone: boolean;
  notifyFail: boolean;
  notifyMilestone: boolean;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function nowTimeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function autoName(tpl: TaskTemplate) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `${tpl.name}_${stamp}`;
}

const REACH_TAG_OPTIONS = ["加微信", "高活跃", "主账号", "节日问候", "高意向"];
const SCRIPT_OTHER_OPTIONS = ["养号通用话术 v2", "新品种草话术 v1", "节日问候话术 v3"];
const MATERIAL_OPTIONS = ["春季新品图文包", "节日 banner 模版", "短视频脚本 #A"];

const TAG_OPTIONS = getUsableTags().map((t) => ({ id: t.id, name: t.name, color: t.color }));
const TENANT_OPTIONS = TENANTS_SEED.filter((t) => t.status === "active").map((t) => t.name);

const SectionTitle = ({ index, title }: { index: string; title: string }) => (
  <div className="flex items-center gap-2 pt-1">
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
      {index}
    </span>
    <h4 className="text-xs font-semibold text-foreground">{title}</h4>
    <Separator className="flex-1" />
  </div>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <Label className="text-xs text-muted-foreground">
    {children}
    {required && <span className="ml-0.5 text-destructive">*</span>}
  </Label>
);

interface Props {
  template: TaskTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetail?: (tpl: TaskTemplate) => void;
}

export function UseTemplateDialog({ template, open, onOpenChange, onViewDetail }: Props) {
  const [draft, setDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    if (open && template) {
      setDraft({
        name: autoName(template),
        priority: "normal",
        platforms: [...template.platforms],
        targetMode: "keyword",
        targetKeyword: "旅游、旅游达人的账号",
        targetUrl: "",
        reachTags: [],
        reachTenants: [],
        perAccount: Math.max(1, template.total),
        execMode: template.subtype === "nurture" ? "recurring" : "now",
        scheduledDate: todayStr(),
        scheduledTime: nowTimeStr(),
        recurFreq: "daily",
        recurStart: "09:00",
        recurEnd: "18:00",
        recurDuration: 30,
        recurForever: false,
        scriptMode: "default",
        scriptOther: SCRIPT_OTHER_OPTIONS[0],
        scriptCustom: "",
        attachMaterial: "",
        notifyDone: true,
        notifyFail: true,
        notifyMilestone: false,
      });
    }
  }, [open, template]);

  const tpl = template;
  if (!tpl || !draft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" />
      </Dialog>
    );
  }

  const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((p) => (p ? { ...p, [key]: value } : p));

  const togglePlatform = (p: Platform) => {
    if (tpl.platforms.includes(p)) return; // locked by template
    update(
      "platforms",
      draft.platforms.includes(p) ? draft.platforms.filter((x) => x !== p) : [...draft.platforms, p],
    );
  };

  // 预估
  const estimatedAccounts = Math.max(
    draft.reachTags.length * 30 + draft.reachTenants.length * 25,
    draft.reachTags.length + draft.reachTenants.length > 0 ? 10 : 0,
  );
  const totalOps = estimatedAccounts * draft.perAccount;
  const estimatedHours = Math.max(0.5, +(totalOps / 350).toFixed(1));

  const composeDescription = () => {
    const lines: string[] = [];
    lines.push(`来源模版：${tpl.name}`);
    lines.push(tpl.description);
    lines.push(
      `目标：${draft.targetMode === "keyword"
        ? `关键词「${draft.targetKeyword || "未填写"}」`
        : `指定 URL「${draft.targetUrl || "未填写"}」`}`,
    );
    const reachParts: string[] = [];
    if (draft.reachTags.length) reachParts.push(`标签：${draft.reachTags.join("、")}`);
    if (draft.reachTenants.length) reachParts.push(`租户：${draft.reachTenants.join("、")}`);
    lines.push(
      `指定账号：${reachParts.length ? reachParts.join(" ｜ ") : "未指定"} ｜ 每账号执行 ${draft.perAccount} 次`,
    );
    if (draft.execMode === "now") {
      lines.push("执行方式：立即执行");
    } else if (draft.execMode === "scheduled") {
      lines.push(`执行方式：定时执行 ${draft.scheduledDate} ${draft.scheduledTime}`);
    } else {
      lines.push(
        `执行方式：周期执行（${draft.recurFreq === "daily" ? "每日" : "每周"} ${draft.recurStart}-${draft.recurEnd}，${draft.recurForever ? "持续执行直到手动停止" : `持续 ${draft.recurDuration} 天`}）`,
      );
    }
    const script =
      draft.scriptMode === "default"
        ? "默认话术"
        : draft.scriptMode === "other"
          ? draft.scriptOther
          : draft.scriptCustom || "自定义";
    lines.push(`互动话术：${script}`);
    if (draft.attachMaterial) lines.push(`关联素材：${draft.attachMaterial}`);
    const notify = [
      draft.notifyDone && "完成通知",
      draft.notifyFail && "失败通知",
      draft.notifyMilestone && "里程碑通知",
    ].filter(Boolean).join("、");
    if (notify) lines.push(`通知：${notify}`);
    return lines.join("\n");
  };

  const buildTask = (): TaskRow => ({
    id: genTaskId(),
    name: draft.name.trim() || autoName(tpl),
    subtype: draft.execMode === "now" ? tpl.subtype : draft.execMode === "recurring" ? "nurture" : "action",
    platforms: draft.platforms,
    total: totalOps,
    done: 0,
    failed: 0,
    status: "pending",
    description: composeDescription(),
    createdBy: "黄雪",
    createdAt: fmtNow(),
    fromTemplate: tpl.name,
  });

  const handleSubmit = (execute: boolean) => {
    if (!draft.name.trim()) return toast.error("请输入任务名称");
    if (draft.platforms.length === 0) return toast.error("至少选择一个平台");
    const task = buildTask();
    tasksActions.add(task);
    templatesActions.update(tpl.id, {
      uses: tpl.uses + 1,
      monthlyUses: (tpl.monthlyUses ?? 0) + 1,
    });
    if (execute && draft.execMode === "now") {
      setTimeout(() => executeTask(task.id), 400);
      toast.success(`已根据模版「${tpl.name}」创建任务并开始执行`);
    } else {
      toast.success(execute ? `任务已创建（${draft.execMode === "scheduled" ? "等待定时执行" : "已进入排程"}）` : "已保存为草稿");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="space-y-2 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookmarkPlus className="h-4 w-4 text-violet-600" />
              从模版创建任务
            </DialogTitle>
            {onViewDetail && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-primary"
                onClick={() => onViewDetail(tpl)}
              >
                查看模版详情<ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              来源模版：<span className="font-medium text-foreground">{tpl.name}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              {tpl.subtype === "nurture" ? <Bot className="h-3.5 w-3.5" /> : <MousePointerClick className="h-3.5 w-3.5" />}
              {SUBTYPE_LABEL[tpl.subtype]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            <span className="text-foreground/70">方法论：</span>{tpl.description}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-5 px-6 py-5">
            {/* 步骤1 任务基本信息 */}
            <section className="space-y-3">
              <SectionTitle index="1/5" title="任务基本信息" />
              <div className="space-y-1.5">
                <FieldLabel required>任务名称</FieldLabel>
                <Input
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="自动根据模版名_日期时间 生成"
                />
                <p className="text-[11px] text-muted-foreground">自动根据"模版名_日期时间"生成，可手动修改</p>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>优先级</FieldLabel>
                <RadioGroup
                  value={draft.priority}
                  onValueChange={(v) => update("priority", v as Priority)}
                  className="flex flex-wrap gap-3"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors",
                        draft.priority === o.value
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      <RadioGroupItem value={o.value} className="h-3.5 w-3.5" />
                      {o.label}
                      {o.hint && <span className="text-[10px] text-muted-foreground">（{o.hint}）</span>}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </section>

            {/* 步骤2 执行目标 */}
            <section className="space-y-3">
              <SectionTitle index="2/5" title="执行目标" />
              <div className="space-y-1.5">
                <FieldLabel required>目标平台</FieldLabel>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => {
                      const locked = tpl.platforms.includes(p);
                      const active = draft.platforms.includes(p);
                      const recommended = locked;
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => togglePlatform(p)}
                          disabled={locked}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                            active
                              ? PLATFORM_CHIP[p]
                              : recommended
                                ? "border-border/60 bg-background text-muted-foreground"
                                : "border-dashed border-border/60 bg-background text-muted-foreground/70 hover:border-primary/40 hover:text-primary",
                          )}
                        >
                          {locked && <Lock className="h-3 w-3" />}
                          {p}
                          {locked && active && <span className="text-[10px]">（必选）</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    虚线=模版未推荐 · <Lock className="-mt-0.5 inline h-3 w-3" /> 模版约束必选，不可取消
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>目标账号</FieldLabel>
                <RadioGroup
                  value={draft.targetMode}
                  onValueChange={(v) => update("targetMode", v as TargetMode)}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="keyword" id="tm-kw" className="h-3.5 w-3.5" />
                    <label htmlFor="tm-kw" className="text-xs">匹配关键词</label>
                    <Input
                      value={draft.targetKeyword}
                      onChange={(e) => update("targetKeyword", e.target.value)}
                      disabled={draft.targetMode !== "keyword"}
                      className="h-7 flex-1 text-xs"
                      placeholder="例如：旅游、旅游达人"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="specified" id="tm-url" className="h-3.5 w-3.5" />
                    <label htmlFor="tm-url" className="text-xs whitespace-nowrap">指定目标</label>
                    <Input
                      value={draft.targetUrl}
                      onChange={(e) => update("targetUrl", e.target.value)}
                      disabled={draft.targetMode !== "specified"}
                      className="h-7 flex-1 text-xs"
                      placeholder="目标群组链接 / 目标账号主页 URL"
                    />
                  </div>
                </RadioGroup>
                
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>指定账号</FieldLabel>
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-muted-foreground">选择标签</div>
                    <div className="flex flex-wrap gap-1.5">
                      {TAG_OPTIONS.map((t) => {
                        const active = draft.reachTags.includes(t.name);
                        return (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() =>
                              update(
                                "reachTags",
                                active
                                  ? draft.reachTags.filter((x) => x !== t.name)
                                  : [...draft.reachTags, t.name],
                              )
                            }
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                              active
                                ? "border-primary/50 bg-primary/10 text-primary"
                                : "border-dashed border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary",
                            )}
                          >
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-muted-foreground">指定租户</div>
                    <div className="flex flex-wrap gap-1.5">
                      {TENANT_OPTIONS.map((name) => {
                        const active = draft.reachTenants.includes(name);
                        return (
                          <button
                            type="button"
                            key={name}
                            onClick={() =>
                              update(
                                "reachTenants",
                                active
                                  ? draft.reachTenants.filter((x) => x !== name)
                                  : [...draft.reachTenants, name],
                              )
                            }
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                              active
                                ? "border-primary/50 bg-primary/10 text-primary"
                                : "border-dashed border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary",
                            )}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">指定标签和指定租户至少需要设置一项</p>
                </div>
              </div>


              <div className="space-y-1.5">
                <FieldLabel required>每账号执行次数</FieldLabel>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Input
                    type="number"
                    min={1}
                    value={draft.perAccount}
                    onChange={(e) => update("perAccount", Math.max(1, parseInt(e.target.value || "1", 10)))}
                    className="h-7 w-24 text-xs"
                  />
                  <span className="text-[11px] text-muted-foreground">模版建议：5-20 次 / 天 / 账号</span>
                </div>
              </div>
            </section>

            {/* 步骤3 执行方式 */}
            <section className="space-y-3">
              <SectionTitle index="3/5" title="执行方式" />
              <RadioGroup
                value={draft.execMode}
                onValueChange={(v) => update("execMode", v as ExecMode)}
                className="space-y-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="now" id="ex-now" className="h-3.5 w-3.5" />
                  <label htmlFor="ex-now" className="text-xs">立即执行</label>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="scheduled" id="ex-sch" className="h-3.5 w-3.5" />
                    <label htmlFor="ex-sch" className="text-xs">定时执行</label>
                    <Input
                      type="date"
                      value={draft.scheduledDate}
                      onChange={(e) => update("scheduledDate", e.target.value)}
                      disabled={draft.execMode !== "scheduled"}
                      className="h-7 w-36 text-xs"
                    />
                    <Input
                      type="time"
                      value={draft.scheduledTime}
                      onChange={(e) => update("scheduledTime", e.target.value)}
                      disabled={draft.execMode !== "scheduled"}
                      className="h-7 w-24 text-xs"
                    />
                  </div>
                  {draft.execMode === "scheduled" && (
                    <p className="ml-6 text-[11px] text-muted-foreground">模版建议时段：09:00-18:00</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="recurring" id="ex-rec" className="h-3.5 w-3.5" />
                    <label htmlFor="ex-rec" className="text-xs">周期执行</label>
                  </div>
                  {draft.execMode === "recurring" && (
                    <div className="ml-6 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">频率：</span>
                        <Select value={draft.recurFreq} onValueChange={(v) => update("recurFreq", v as "daily" | "weekly")}>
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">每日</SelectItem>
                            <SelectItem value="weekly">每周</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">时段：</span>
                        <Input type="time" value={draft.recurStart} onChange={(e) => update("recurStart", e.target.value)} className="h-7 w-24 text-xs" />
                        <span>—</span>
                        <Input type="time" value={draft.recurEnd} onChange={(e) => update("recurEnd", e.target.value)} className="h-7 w-24 text-xs" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">持续：</span>
                        <Input
                          type="number"
                          min={1}
                          value={draft.recurDuration}
                          onChange={(e) => update("recurDuration", Math.max(1, parseInt(e.target.value || "1", 10)))}
                          disabled={draft.recurForever}
                          className="h-7 w-20 text-xs"
                        />
                        <span className="text-muted-foreground">天 / </span>
                        <label className="inline-flex cursor-pointer items-center gap-1.5">
                          <Checkbox
                            checked={draft.recurForever}
                            onCheckedChange={(c) => update("recurForever", Boolean(c))}
                          />
                          <span>持续执行直到手动停止</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </section>

            {/* 步骤4 内容配置 */}
            <section className="space-y-3">
              <SectionTitle index="4/5" title="内容配置（可选）" />
              <div className="space-y-1.5">
                <FieldLabel>互动话术</FieldLabel>
                <RadioGroup
                  value={draft.scriptMode}
                  onValueChange={(v) => update("scriptMode", v as ScriptMode)}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="default" id="sc-def" className="h-3.5 w-3.5" />
                    <label htmlFor="sc-def" className="text-xs">使用模版默认话术（养号通用话术 v2）</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="other" id="sc-other" className="h-3.5 w-3.5" />
                    <label htmlFor="sc-other" className="text-xs">选择其他话术模版</label>
                    <Select
                      value={draft.scriptOther}
                      onValueChange={(v) => update("scriptOther", v)}
                      disabled={draft.scriptMode !== "other"}
                    >
                      <SelectTrigger className="h-7 w-56 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SCRIPT_OTHER_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="custom" id="sc-cus" className="mt-1 h-3.5 w-3.5" />
                    <label htmlFor="sc-cus" className="flex-1 space-y-1 text-xs">
                      <span>自定义话术</span>
                      <Textarea
                        value={draft.scriptCustom}
                        onChange={(e) => update("scriptCustom", e.target.value)}
                        disabled={draft.scriptMode !== "custom"}
                        placeholder="输入自定义话术内容…"
                        className="min-h-[60px] text-xs"
                      />
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>关联素材（可选）</FieldLabel>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Select value={draft.attachMaterial || "__none"} onValueChange={(v) => update("attachMaterial", v === "__none" ? "" : v)}>
                    <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue placeholder="选择已有素材" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">未选择</SelectItem>
                      {MATERIAL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">或</span>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" type="button">
                    <Upload className="h-3.5 w-3.5" />上传新素材
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  已选：{draft.attachMaterial ? <span className="text-foreground">{draft.attachMaterial}</span> : "（无）"}
                </p>
              </div>
            </section>

            {/* 步骤5 通知 */}
            <section className="space-y-3">
              <SectionTitle index="5/5" title="通知与确认" />
              <div className="space-y-2 rounded-lg border p-3">
                <FieldLabel>通知设置</FieldLabel>
                <div className="space-y-1.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox checked={draft.notifyDone} onCheckedChange={(c) => update("notifyDone", Boolean(c))} />
                    任务完成后通知我
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox checked={draft.notifyFail} onCheckedChange={(c) => update("notifyFail", Boolean(c))} />
                    任务失败时通知我
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox checked={draft.notifyMilestone} onCheckedChange={(c) => update("notifyMilestone", Boolean(c))} />
                    关键里程碑通知（完成 50% / 90% 时）
                  </label>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-3 border-t bg-muted/20 px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-3.5 w-3.5" />预计涉及：
              <span className="font-semibold tabular-nums text-foreground">{estimatedAccounts}</span> 个账号 ×
              <span className="font-semibold tabular-nums text-foreground">{draft.perAccount}</span> 次 ≈
              <span className="font-semibold tabular-nums text-primary">{totalOps}</span> 次操作
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />预估耗时：
              <span className="font-semibold tabular-nums text-foreground">约 {estimatedHours} 小时</span>
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
            <Button variant="outline" size="sm" onClick={() => handleSubmit(false)}>保存为草稿</Button>
            <Button size="sm" className="gap-1" onClick={() => handleSubmit(true)}>
              <Sparkles className="h-3.5 w-3.5" />确认创建并执行
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

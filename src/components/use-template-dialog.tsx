import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookmarkPlus, ExternalLink, Lock, Bot, MousePointerClick,
  Sparkles, Clock3, Target, Upload, Pencil, Search,
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
import { seedPosts, type PostItem } from "@/routes/_app.materials.posts";
import { seedManagedAccounts } from "@/lib/managed-account-mock";

type Priority = "low" | "normal" | "high" | "urgent";
const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; hint?: string }> = [
  { value: "low", label: "低" },
  { value: "normal", label: "中", hint: "默认" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

type ExecTime = "now" | "scheduled";
type ExecFreq = "once" | "recurring";
type TargetMode = "keyword" | "specified";


interface DraftState {
  name: string;
  priority: Priority;
  platforms: Platform[];
  targetMode: TargetMode;
  targetKeyword: string;
  targetUrl: string;
  reachTags: string[];
  reachTenants: string[];
  reachAccounts: string[];
  perAccount: number;
  execTime: ExecTime;
  execFreq: ExecFreq;
  scheduledDate: string;
  scheduledTime: string;
  recurFreq: "daily" | "weekly";
  recurStart: string;
  recurEnd: string;
  recurDuration: number;
  recurForever: boolean;
  scriptCustom: string;
  scriptFile: string;
  postTags: string[];
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

const TAG_OPTIONS = getUsableTags().map((t) => ({ id: t.id, name: t.name, color: t.color }));
const TENANT_OPTIONS = TENANTS_SEED.filter((t) => t.status === "active").map((t) => t.name);
const ALL_POSTS: PostItem[] = seedPosts();

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
  template?: TaskTemplate | null;
  /** 提供则进入「编辑任务」模式 */
  task?: TaskRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetail?: (tpl: TaskTemplate) => void;
}

const DEFAULT_DRAFT_PARTIAL = {
  priority: "normal" as Priority,
  targetMode: "keyword" as TargetMode,
  targetKeyword: "旅游、旅游达人的账号",
  targetUrl: "",
  reachTags: [] as string[],
  reachTenants: [] as string[],
  reachAccounts: [] as string[],
  scheduledDate: todayStr(),
  scheduledTime: nowTimeStr(),
  recurFreq: "daily" as "daily" | "weekly",
  recurStart: "09:00",
  recurEnd: "18:00",
  recurDuration: 30,
  recurForever: false,
  scriptCustom: "",
  scriptFile: "",
  postTags: [] as string[],
  notifyDone: true,
  notifyFail: true,
  notifyMilestone: false,
  execTime: "now" as ExecTime,
};

export function UseTemplateDialog({ template, task, open, onOpenChange, onViewDetail }: Props) {
  const isEdit = !!task;
  const [draft, setDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    if (!open) return;
    if (task) {
      // 编辑模式：优先使用任务保存的 draft 快照，否则根据任务字段回填
      const saved = task.draft as DraftState | undefined;
      if (saved) {
        setDraft({ ...saved });
      } else {
        setDraft({
          ...DEFAULT_DRAFT_PARTIAL,
          name: task.name,
          platforms: [...task.platforms],
          perAccount: Math.max(1, Math.round(task.total / Math.max(1, task.platforms.length || 1))),
          execFreq: task.subtype === "nurture" ? "recurring" : "once",
        });
      }
    } else if (template) {
      setDraft({
        ...DEFAULT_DRAFT_PARTIAL,
        name: autoName(template),
        platforms: [...template.platforms],
        perAccount: Math.max(1, template.total),
        execFreq: template.subtype === "nurture" ? "recurring" : "once",
      });
    }
  }, [open, template, task]);

  // 在编辑模式下用任务自身合成一个"伪模版"用于复用渲染逻辑（不会触发平台锁）
  const tpl: TaskTemplate | null = template ?? (task
    ? {
        id: task.id,
        name: task.name,
        subtype: task.subtype,
        platforms: [],
        total: task.total,
        description: task.description,
        createdAt: task.createdAt,
        uses: 0,
      }
    : null);

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

  const matchedPosts = draft.postTags.length
    ? ALL_POSTS.filter((p) => p.tags.some((t) => draft.postTags.includes(t)))
    : [];



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
      `目标账号：${draft.targetMode === "keyword"
        ? `匹配关键词「${draft.targetKeyword || "未填写"}」`
        : `指定目标「${draft.targetUrl || "未填写"}」`}`,
    );
    const reachParts: string[] = [];
    if (draft.reachTags.length) reachParts.push(`标签：${draft.reachTags.join("、")}`);
    if (draft.reachTenants.length) reachParts.push(`租户：${draft.reachTenants.join("、")}`);
    if (draft.reachAccounts.length) reachParts.push(`特定账号：${draft.reachAccounts.length} 个`);
    lines.push(`指定账号：${reachParts.length ? reachParts.join(" ｜ ") : "未指定"}`);
    lines.push(
      `执行时间：${draft.execTime === "now" ? "立即执行" : `定时执行 ${draft.scheduledDate} ${draft.scheduledTime}`}`,
    );
    if (draft.execFreq === "once") {
      lines.push("执行方式：单次执行");
    } else {
      lines.push(
        `执行方式：周期执行（${draft.recurFreq === "daily" ? "每日" : "每周"} ${draft.recurStart}-${draft.recurEnd}，${draft.recurForever ? "持续执行直到手动停止" : `持续 ${draft.recurDuration} 天`}）`,
      );
    }
    return lines.join("\n");
  };

  const buildTask = (): TaskRow => ({
    id: genTaskId(),
    name: draft.name.trim() || autoName(tpl),
    subtype: draft.execFreq === "recurring" ? "nurture" : "action",
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
    if (draft.reachTags.length === 0 && draft.reachTenants.length === 0 && draft.reachAccounts.length === 0)
      return toast.error("指定标签、指定租户、选择特定账号至少需要设置一项");

    if (isEdit && task) {
      tasksActions.update(task.id, {
        name: draft.name.trim(),
        platforms: draft.platforms,
        subtype: draft.execFreq === "recurring" ? "nurture" : "action",
        total: totalOps,
        description: composeDescription(),
        draft: { ...draft } as unknown as Record<string, unknown>,
      });
      toast.success(`任务「${draft.name.trim()}」已更新`);
      onOpenChange(false);
      return;
    }

    const newTask = buildTask();
    newTask.draft = { ...draft } as unknown as Record<string, unknown>;
    tasksActions.add(newTask);
    if (template) {
      templatesActions.update(template.id, {
        uses: template.uses + 1,
        monthlyUses: (template.monthlyUses ?? 0) + 1,
      });
    }
    const immediate = draft.execTime === "now" && draft.execFreq === "once";
    if (execute && immediate) {
      setTimeout(() => executeTask(newTask.id), 400);
      toast.success(`已根据模版「${tpl.name}」创建任务并开始执行`);
    } else {
      const note = draft.execFreq === "recurring"
        ? "已进入排程"
        : draft.execTime === "scheduled"
          ? "等待定时执行"
          : "已创建";
      toast.success(execute ? `任务已创建（${note}）` : "已保存为草稿");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="space-y-2 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              {isEdit ? (
                <><Pencil className="h-4 w-4 text-primary" />编辑任务 - {task?.name}</>
              ) : (
                <><BookmarkPlus className="h-4 w-4 text-violet-600" />从模版创建任务</>
              )}
            </DialogTitle>
            {!isEdit && onViewDetail && template && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-primary"
                onClick={() => onViewDetail(template)}
              >
                查看模版详情<ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {!isEdit && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                来源模版：<span className="font-medium text-foreground">{tpl.name}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {tpl.subtype === "nurture" ? <Bot className="h-3.5 w-3.5" /> : <MousePointerClick className="h-3.5 w-3.5" />}
              {SUBTYPE_LABEL[tpl.subtype]}
            </span>
          </div>
          {!isEdit && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              <span className="text-foreground/70">方法论：</span>{tpl.description}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-5 px-6 py-5">
            {/* 步骤1 任务基本信息 */}
            <section className="space-y-3">
              <SectionTitle index="1/3" title="任务基本信息" />
              <div className="space-y-1.5">
                <FieldLabel required>任务名称</FieldLabel>
                <Input
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="自动根据模版名_日期时间 生成"
                />
                <p className="text-[11px] text-muted-foreground">自动根据"模版名_日期时间"生成，可手动修改</p>
              </div>
            </section>

            {/* 步骤2 执行目标 */}
            <section className="space-y-3">
              <SectionTitle index="2/3" title="执行目标" />

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
            </section>

            {/* 步骤3 执行时间 */}
            <section className="space-y-3">
              <SectionTitle index="3/3" title="执行时间与方式" />

              <div className="space-y-1.5">
                <FieldLabel required>执行时间</FieldLabel>
                <RadioGroup
                  value={draft.execTime}
                  onValueChange={(v) => update("execTime", v as ExecTime)}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="now" id="et-now" className="h-3.5 w-3.5" />
                    <label htmlFor="et-now" className="text-xs">立即执行</label>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <RadioGroupItem value="scheduled" id="et-sch" className="h-3.5 w-3.5" />
                      <label htmlFor="et-sch" className="text-xs">定时执行</label>
                      <Input
                        type="date"
                        value={draft.scheduledDate}
                        onChange={(e) => update("scheduledDate", e.target.value)}
                        disabled={draft.execTime !== "scheduled"}
                        className="h-7 w-36 text-xs"
                      />
                      <Input
                        type="time"
                        value={draft.scheduledTime}
                        onChange={(e) => update("scheduledTime", e.target.value)}
                        disabled={draft.execTime !== "scheduled"}
                        className="h-7 w-24 text-xs"
                      />
                    </div>
                    {draft.execTime === "scheduled" && (
                      <p className="ml-6 text-[11px] text-muted-foreground">模版建议时段：09:00-18:00</p>
                    )}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>执行方式</FieldLabel>
                <RadioGroup
                  value={draft.execFreq}
                  onValueChange={(v) => update("execFreq", v as ExecFreq)}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="once" id="ef-once" className="h-3.5 w-3.5" />
                    <label htmlFor="ef-once" className="text-xs">单次执行</label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="recurring" id="ef-rec" className="h-3.5 w-3.5" />
                      <label htmlFor="ef-rec" className="text-xs">周期执行</label>
                    </div>
                    {draft.execFreq === "recurring" && (
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
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="border-t bg-muted/20 px-6 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
            {isEdit ? (
              <Button size="sm" className="gap-1" onClick={() => handleSubmit(true)}>
                <Pencil className="h-3.5 w-3.5" />保存修改
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => handleSubmit(false)}>保存为草稿</Button>
                <Button size="sm" className="gap-1" onClick={() => handleSubmit(true)}>
                  <Sparkles className="h-3.5 w-3.5" />确认创建并执行
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

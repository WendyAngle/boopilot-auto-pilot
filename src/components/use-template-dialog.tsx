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
import { TagMultiSelect } from "@/components/tag-multi-select";
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

type ExecMode = "now" | "scheduled" | "recurring";
type TargetMode = "keyword" | "specified" | "random";
const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];


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
  execMode: ExecMode;
  scheduledMode: "datetime" | "active";
  scheduledDate: string;
  scheduledTime: string;
  recurStartDate: string;
  recurStartTime: string;
  recurFreq: "daily" | "weekly";
  recurWeekdays: string[];
  recurTimeStart: string;
  recurTimeEnd: string;
  recurDuration: number;
  recurForever: boolean;
  sessionDuration: number;
  sessionDurationUnit: "min" | "hour";
  scriptCustom: string;
  scriptFile: string;
  postTags: string[];
  postUseAccountTags: boolean;
  postTenants: string[];
  postIds: string[];
  execFrequency: "once" | "recurring";
  dailyPostCount: number;
  recurActiveTime: boolean;
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
  scheduledMode: "active" as "datetime" | "active",
  scheduledDate: todayStr(),
  scheduledTime: nowTimeStr(),
  recurStartDate: todayStr(),
  recurStartTime: nowTimeStr(),
  recurFreq: "weekly" as "daily" | "weekly",
  recurWeekdays: ["周一", "周二", "周三", "周四", "周五"] as string[],
  recurTimeStart: "09:00",
  recurTimeEnd: "18:00",
  recurDuration: 30,
  sessionDuration: 30,
  sessionDurationUnit: "min" as "min" | "hour",
  recurForever: false,
  scriptCustom: "",
  scriptFile: "",
  postTags: [] as string[],
  postUseAccountTags: true,
  postTenants: [] as string[],
  postIds: [] as string[],
  execFrequency: "once" as "once" | "recurring",
  dailyPostCount: 1,
  recurActiveTime: true,
  notifyDone: true,
  notifyFail: true,
  notifyMilestone: false,
  execMode: "now" as ExecMode,
};

export function UseTemplateDialog({ template, task, open, onOpenChange, onViewDetail }: Props) {
  const isEdit = !!task;
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [accountSearch, setAccountSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setAccountSearch("");
      return;
    }
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
          execMode: task.subtype === "nurture" ? "recurring" : "now",
        });
      }
    } else if (template) {
      setDraft({
        ...DEFAULT_DRAFT_PARTIAL,
        name: autoName(template),
        platforms: [...template.platforms],
        perAccount: Math.max(1, template.total),
        execMode: template.subtype === "nurture" ? "recurring" : "now",
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

  const tplPlatforms = tpl?.platforms ?? [];
  const availableAccounts = useMemo(() => {
    const platformSet = new Set<Platform>(tplPlatforms);
    const kw = accountSearch.trim().toLowerCase();
    return seedManagedAccounts()
      .filter((a) => a.accountStatus === "normal")
      .filter((a) => (platformSet.size ? platformSet.has(a.platform) : true))
      .filter((a) => {
        if (!kw) return true;
        return (
          a.username.toLowerCase().includes(kw) ||
          a.platformId.toLowerCase().includes(kw) ||
          (a.remark ?? "").toLowerCase().includes(kw)
        );
      })
      .slice(0, 200);
  }, [tplPlatforms, accountSearch]);

  const availablePosts = useMemo(() => {
    const kw = accountSearch.trim().toLowerCase();
    const platformSet = new Set<Platform>(tplPlatforms);
    return ALL_POSTS.filter((p) => {
      const matchedPlatforms = platformSet.size
        ? p.platforms.filter((pl) => platformSet.has(pl))
        : p.platforms;
      if (matchedPlatforms.length === 0) return false;
      const hasUnpublished = matchedPlatforms.some(
        (pl) => (p.publishStatus?.[pl] ?? "unpublished") === "unpublished",
      );
      if (!hasUnpublished) return false;
      if (!kw) return true;
      return (
        p.title.toLowerCase().includes(kw) ||
        p.tenantName.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw))
      );
    }).slice(0, 200);
  }, [accountSearch, tplPlatforms]);


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

  const matchedPosts = (() => {
    const set = new Set<string>();
    ALL_POSTS.forEach((p) => {
      if (draft.postTags.length && p.tags.some((t) => draft.postTags.includes(t))) set.add(p.id);
      if (draft.postTenants.length && draft.postTenants.includes(p.tenantName)) set.add(p.id);
    });
    draft.postIds.forEach((id) => set.add(id));
    return ALL_POSTS.filter((p) => set.has(p.id));
  })();

  



  // 预估
  const estimatedAccounts = Math.max(
    draft.reachTags.length * 30 + draft.reachTenants.length * 25,
    draft.reachTags.length + draft.reachTenants.length > 0 ? 10 : 0,
  );
  const matchedAccountsCount = estimatedAccounts + draft.reachAccounts.length;
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
    if (draft.execMode === "now") {
      lines.push("执行方式：立即执行");
    } else if (draft.execMode === "scheduled") {
      lines.push(
        draft.scheduledMode === "active"
          ? "执行方式：指定时间开始执行（账号活跃时间）"
          : `执行方式：指定时间开始执行 ${draft.scheduledDate} ${draft.scheduledTime}`,
      );
    } else {
      const weekPart = draft.recurFreq === "weekly" ? `（${draft.recurWeekdays.join("、") || "未选"}）` : "";
      const durPart = draft.recurForever ? "持续执行直到手动停止" : `持续 ${draft.recurDuration} 天`;
      lines.push(
        `执行方式：周期执行，开始时间 ${draft.recurStartDate} ${draft.recurStartTime}，${draft.recurFreq === "daily" ? "每日" : "每周"}${weekPart}，时段 ${draft.recurTimeStart}—${draft.recurTimeEnd}，${durPart}`,
      );
    }
    return lines.join("\n");
  };

  const buildTask = (): TaskRow => ({
    id: genTaskId(),
    name: draft.name.trim() || autoName(tpl),
    subtype: draft.execMode === "recurring" ? "nurture" : "action",
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
    if (draft.reachTags.length === 0 && draft.reachAccounts.length === 0)
      return toast.error("指定标签、选择特定账号至少需要设置一项");
    if (tpl.subtype === "action" && !draft.postUseAccountTags && draft.postTags.length === 0 && draft.postIds.length === 0)
      return toast.error("贴文标签、选择特定贴文至少需要设置一项");

    if (draft.execMode === "recurring" && draft.recurFreq === "weekly" && draft.recurWeekdays.length === 0)
      return toast.error("请至少选择一个执行日");

    if (isEdit && task) {
      tasksActions.update(task.id, {
        name: draft.name.trim(),
        platforms: draft.platforms,
        subtype: draft.execMode === "recurring" ? "nurture" : "action",
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
    const immediate = draft.execMode === "now";
    if (execute && immediate) {
      setTimeout(() => executeTask(newTask.id), 400);
      toast.success(`已根据模版「${tpl.name}」创建任务并开始执行`);
    } else {
      const note = draft.execMode === "recurring"
        ? "已进入排程"
        : draft.execMode === "scheduled"
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
                <><BookmarkPlus className="h-4 w-4 text-violet-600" />创建{tpl.name}任务</>
              )}
            </DialogTitle>
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

              {tpl.subtype !== "action" && (
              <div className="space-y-1.5">
                <FieldLabel required>目标</FieldLabel>
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
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="random" id="tm-rand" className="h-3.5 w-3.5" />
                    <label htmlFor="tm-rand" className="text-xs whitespace-nowrap">系统随机选择目标</label>
                    <span className="text-[11px] text-muted-foreground">由系统根据账号画像自动匹配合适的互动目标</span>
                  </div>
                </RadioGroup>
                
              </div>
              )}

              <div className="space-y-1.5">
                <FieldLabel required>指定账号</FieldLabel>
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-muted-foreground">选择标签</div>
                    <TagMultiSelect
                      value={draft.reachTags}
                      onChange={(v) => update("reachTags", v)}
                      placeholder="选择或新增标签"
                    />
                  </div>


                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] text-muted-foreground">选择特定账号</div>
                        <button
                          type="button"
                          className="text-[11px] text-primary hover:underline"
                          onClick={() => {
                            const allIds = availableAccounts.map((a) => a.id);
                            const others = draft.reachAccounts.filter((id) => !allIds.includes(id));
                            const allSelected = allIds.length > 0 && allIds.every((id) => draft.reachAccounts.includes(id));
                            update("reachAccounts", allSelected ? others : [...others, ...allIds]);
                          }}
                        >
                          {availableAccounts.length > 0 && availableAccounts.every((a) => draft.reachAccounts.includes(a.id))
                            ? "取消全选"
                            : "全选"}
                        </button>


                      </div>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          placeholder="搜索账号 / 平台ID / 备注"
                          className="h-7 w-56 pl-6 text-xs"
                        />
                      </div>
                    </div>

                    <ScrollArea className="h-44 rounded-md border bg-background">
                      <div className="divide-y">
                        {availableAccounts.length === 0 ? (
                          <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                            无可选账号
                          </div>
                        ) : (
                          availableAccounts.map((a) => {
                            const checked = draft.reachAccounts.includes(a.id);
                            return (
                              <label
                                key={a.id}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs transition-colors hover:bg-accent/40",
                                  checked && "bg-primary/5",
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(c) =>
                                    update(
                                      "reachAccounts",
                                      c
                                        ? [...draft.reachAccounts, a.id]
                                        : draft.reachAccounts.filter((x) => x !== a.id),
                                    )
                                  }
                                />
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                  {a.username.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                  {a.username}
                                </span>
                                <span className="rounded border border-border/60 px-1.5 py-px text-[10px] text-muted-foreground">
                                  {a.platform}
                                </span>
                                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                                  {a.country}
                                </span>
                                <span className="hidden max-w-[120px] truncate text-[10px] text-muted-foreground md:inline">
                                  {a.tenantName}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        默认仅列出状态正常、平台匹配模版的账号；共 {availableAccounts.length} 个
                      </span>
                      {draft.reachAccounts.length > 0 && (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => update("reachAccounts", [])}
                        >
                          清空已选 ({draft.reachAccounts.length})
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">指定标签、选择特定账号至少需要设置一项</p>
                </div>
              </div>

              {tpl.subtype === "action" && (
              <div className="space-y-1.5">
                <FieldLabel required>指定贴文</FieldLabel>
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-muted-foreground">选择标签</div>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-colors",
                        draft.postUseAccountTags
                          ? "border-primary/60 bg-primary/5"
                          : "hover:border-primary/30",
                      )}
                    >
                      <Checkbox
                        checked={draft.postUseAccountTags}
                        onCheckedChange={(c) => {
                          const next = !!c;
                          update("postUseAccountTags", next);
                          if (next) update("postTags", []);
                        }}
                        className="mt-0.5 h-3.5 w-3.5"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium">同账号标签</div>
                        <p className="text-[11px] text-muted-foreground">系统将自动按账号已有标签匹配同标签的贴文</p>
                      </div>
                    </label>
                    <TagMultiSelect
                      value={draft.postUseAccountTags ? [] : draft.postTags}
                      onChange={(v) => {
                        if (v.length > 0 && draft.postUseAccountTags) {
                          update("postUseAccountTags", false);
                        }
                        update("postTags", v);
                      }}
                      placeholder={draft.postUseAccountTags ? "已使用账号标签匹配（如需自定义请取消上方勾选）" : "选择或新增标签"}
                      disabled={draft.postUseAccountTags}
                    />
                  </div>




                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] text-muted-foreground">选择特定贴文</div>
                        <button
                          type="button"
                          className="text-[11px] text-primary hover:underline"
                          onClick={() => {
                            const allIds = availablePosts.map((p) => p.id);
                            const others = draft.postIds.filter((id) => !allIds.includes(id));
                            const allSelected = allIds.length > 0 && allIds.every((id) => draft.postIds.includes(id));
                            update("postIds", allSelected ? others : [...others, ...allIds]);
                          }}
                        >
                          {availablePosts.length > 0 && availablePosts.every((p) => draft.postIds.includes(p.id))
                            ? "取消全选"
                            : "全选"}
                        </button>
                      </div>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          placeholder="搜索贴文标题 / 租户 / 标签"
                          className="h-7 w-56 pl-6 text-xs"
                        />
                      </div>
                    </div>

                    <ScrollArea className="h-44 rounded-md border bg-background">
                      <div className="divide-y">
                        {availablePosts.length === 0 ? (
                          <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                            无可选贴文
                          </div>
                        ) : (
                          availablePosts.map((p) => {
                            const checked = draft.postIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs transition-colors hover:bg-accent/40",
                                  checked && "bg-primary/5",
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(c) =>
                                    update(
                                      "postIds",
                                      c
                                        ? [...draft.postIds, p.id]
                                        : draft.postIds.filter((x) => x !== p.id),
                                    )
                                  }
                                />
                                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                  {p.title}
                                </span>
                                <span className="hidden max-w-[120px] truncate text-[10px] text-muted-foreground md:inline">
                                  {p.tenantName}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>共匹配到 {matchedPosts.length} 篇贴文</span>
                      {draft.postIds.length > 0 && (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => update("postIds", [])}
                        >
                          清空已选 ({draft.postIds.length})
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">贴文标签、贴文租户、选择特定贴文至少需要设置一项</p>
                  {matchedPosts.length > 0 && matchedAccountsCount > 0 && matchedAccountsCount !== matchedPosts.length && (
                    <p className="text-[11px] text-destructive">
                      {matchedAccountsCount > matchedPosts.length
                        ? `所选账号数（${matchedAccountsCount}）大于贴文数（${matchedPosts.length}），将随机抽取等量账号执行发帖`
                        : `所选账号数（${matchedAccountsCount}）小于贴文数（${matchedPosts.length}），贴文将依次分配，部分账号会发多篇`}
                    </p>
                  )}
                </div>
              </div>
              )}
            </section>


            {/* 步骤3 执行方式 */}
            <section className="space-y-3">
              <SectionTitle index="3/3" title="执行方式" />

              {/* 周期养号任务：执行方式（仅 nurture） */}
              {tpl.subtype !== "action" && (
              <div className="space-y-1.5">
                <FieldLabel required>执行方式</FieldLabel>
                <RadioGroup
                  value={draft.execMode}
                  onValueChange={(v) => update("execMode", v as ExecMode)}
                  className="space-y-2"
                >
                  {/* 周期执行 */}
                  <label
                    htmlFor="em-rec"
                    className={cn(
                      "block cursor-pointer rounded-lg border p-3 transition-colors",
                      draft.execMode === "recurring" ? "border-primary/60 bg-primary/5" : "hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="recurring" id="em-rec" className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">周期执行</span>
                    </div>
                    {draft.execMode === "recurring" && (
                      <div className="ml-6 mt-2 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-16 text-muted-foreground">开始时间</span>
                          <Input
                            type="date"
                            value={draft.recurStartDate}
                            onChange={(e) => update("recurStartDate", e.target.value)}
                            className="h-7 w-36 text-xs"
                          />
                          <Input
                            type="time"
                            value={draft.recurStartTime}
                            onChange={(e) => update("recurStartTime", e.target.value)}
                            className="h-7 w-24 text-xs"
                          />
                          <span className="text-[11px] text-muted-foreground">任务开始执行时间</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-16 text-muted-foreground">执行周期</span>
                          <Select value="daily" disabled>
                            <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">每日</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-16 text-muted-foreground">时段</span>
                          <Input
                            type="time"
                            value={draft.recurTimeStart}
                            onChange={(e) => update("recurTimeStart", e.target.value)}
                            className="h-7 w-24 text-xs"
                          />
                          <span className="text-muted-foreground">—</span>
                          <Input
                            type="time"
                            value={draft.recurTimeEnd}
                            onChange={(e) => update("recurTimeEnd", e.target.value)}
                            className="h-7 w-24 text-xs"
                          />
                          <span className="text-[11px] text-muted-foreground">系统会根据账号国家地区自动转化为当地相应时段</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-16 text-muted-foreground">时长</span>
                          <Input
                            type="number"
                            min={1}
                            value={draft.sessionDuration}
                            onChange={(e) => update("sessionDuration", Math.max(1, parseInt(e.target.value || "1", 10)))}
                            className="h-7 w-20 text-xs"
                          />
                          <Select value={draft.sessionDurationUnit} onValueChange={(v) => update("sessionDurationUnit", v as "min" | "hour")}>
                            <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="min">分钟</SelectItem>
                              <SelectItem value="hour">小时</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-[11px] text-muted-foreground">每次养号时长</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-16 text-muted-foreground">持续</span>
                          <Input
                            type="number"
                            min={1}
                            value={draft.recurDuration}
                            onChange={(e) => update("recurDuration", Math.max(1, parseInt(e.target.value || "1", 10)))}
                            disabled={draft.recurForever}
                            className="h-7 w-20 text-xs"
                          />
                          <span className="text-muted-foreground">天 /</span>
                          <label className="inline-flex cursor-pointer items-center gap-1.5">
                            <Checkbox
                              checked={draft.recurForever}
                              onCheckedChange={(c) => update("recurForever", Boolean(c))}
                            />
                            <span>持续执行直到手动停止</span>
                          </label>
                        </div>
                        <p className="text-[11px] text-muted-foreground">任务将从开始时间起，按照设置周期、时长在指定的时段内重复执行</p>
                      </div>
                    )}
                  </label>
                </RadioGroup>
              </div>
              )}

              {/* 发帖任务：执行方式（合并 仅执行一次/周期执行 + 嵌套子项） */}
              {tpl.subtype === "action" && (
                <div className="space-y-1.5">
                  <FieldLabel required>执行方式</FieldLabel>
                  <RadioGroup
                    value={draft.execFrequency}
                    onValueChange={(v) => {
                      const next = v as "once" | "recurring";
                      update("execFrequency", next);
                      if (next === "once") {
                        if (draft.execMode === "recurring") update("execMode", "now");
                      } else {
                        update("execMode", "recurring");
                      }
                    }}
                    className="space-y-2"
                  >
                    {/* 仅执行一次 */}
                    <label
                      htmlFor="ef-once"
                      className={cn(
                        "block cursor-pointer rounded-lg border p-3 transition-colors",
                        draft.execFrequency === "once" ? "border-primary/60 bg-primary/5" : "hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="once" id="ef-once" className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">仅执行一次</span>
                        <span className="text-[11px] text-muted-foreground">每个匹配账号仅发布一次贴文</span>
                      </div>

                      {draft.execFrequency === "once" && (
                        <div className="ml-6 mt-2 space-y-2">
                          <RadioGroup
                            value={draft.execMode === "scheduled" ? "scheduled" : "now"}
                            onValueChange={(v) => update("execMode", v as ExecMode)}
                            className="space-y-1.5"
                          >
                            {/* 立即执行 */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="now" id="ef-once-now" className="h-3.5 w-3.5" />
                                <Label htmlFor="ef-once-now" className="cursor-pointer text-xs">立即执行</Label>
                                <span className="text-[11px] text-muted-foreground">提交后立即开始执行任务</span>
                              </div>
                            </div>
                            {/* 指定时间开始执行 */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="scheduled" id="ef-once-sch" className="h-3.5 w-3.5" />
                                <Label htmlFor="ef-once-sch" className="cursor-pointer text-xs">指定时间开始执行</Label>
                              </div>
                              {draft.execMode === "scheduled" && (
                                <div className="ml-6 space-y-2">
                                  <RadioGroup
                                    value={draft.scheduledMode}
                                    onValueChange={(v) => update("scheduledMode", v as "datetime" | "active")}
                                    className="space-y-1.5"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <RadioGroupItem value="active" id="sch-active" className="h-3.5 w-3.5" />
                                        <Label htmlFor="sch-active" className="cursor-pointer text-xs">账号活跃时间</Label>
                                      </div>
                                      {draft.scheduledMode === "active" && (
                                        <p className="ml-6 text-[11px] text-muted-foreground">
                                          系统将在每个账号下一个活跃时间窗口开始执行
                                        </p>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <RadioGroupItem value="datetime" id="sch-dt" className="h-3.5 w-3.5" />
                                        <Label htmlFor="sch-dt" className="cursor-pointer text-xs">指定日期和时间点</Label>
                                        <span className="text-[11px] text-muted-foreground">任务将在指定时间开始执行</span>
                                      </div>
                                      {draft.scheduledMode === "datetime" && (
                                        <div className="ml-6 space-y-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                              type="date"
                                              value={draft.scheduledDate}
                                              onChange={(e) => update("scheduledDate", e.target.value)}
                                              className="h-7 w-36 text-xs"
                                            />
                                            <Input
                                              type="time"
                                              value={draft.scheduledTime}
                                              onChange={(e) => update("scheduledTime", e.target.value)}
                                              className="h-7 w-24 text-xs"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </RadioGroup>
                                </div>
                              )}
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </label>

                    {/* 周期执行 */}
                    <label
                      htmlFor="ef-rec"
                      className={cn(
                        "block cursor-pointer rounded-lg border p-3 transition-colors",
                        draft.execFrequency === "recurring" ? "border-primary/60 bg-primary/5" : "hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="recurring" id="ef-rec" className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">周期执行</span>
                      </div>
                      {draft.execFrequency === "recurring" && (
                        <div className="ml-6 mt-2 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-16 text-muted-foreground">开始时间</span>
                            <Input
                              type="date"
                              value={draft.recurStartDate}
                              onChange={(e) => update("recurStartDate", e.target.value)}
                              className="h-7 w-36 text-xs"
                            />
                            <Input
                              type="time"
                              value={draft.recurStartTime}
                              onChange={(e) => update("recurStartTime", e.target.value)}
                              className="h-7 w-24 text-xs"
                            />
                            <span className="text-[11px] text-muted-foreground">任务开始执行时间</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-16 text-muted-foreground">发布频次</span>
                            <span className="text-muted-foreground">每个账号每天发布</span>
                            <Input
                              type="number"
                              min={1}
                              value={draft.dailyPostCount}
                              onChange={(e) => update("dailyPostCount", Math.max(1, parseInt(e.target.value || "1", 10)))}
                              className="h-7 w-20 text-xs"
                            />
                            <span className="text-muted-foreground">条贴文</span>
                          </div>
                          <div className="flex flex-wrap items-start gap-2">
                            <span className="mt-1 w-16 text-muted-foreground">发布时间</span>
                            <label className="inline-flex cursor-pointer items-center gap-1.5">
                              <Checkbox
                                checked={draft.recurActiveTime}
                                onCheckedChange={(c) => update("recurActiveTime", Boolean(c))}
                              />
                              <span>账号活跃时间</span>
                            </label>
                            <span className="text-[11px] text-muted-foreground">系统将在每个账号的活跃时间窗口内发布</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-16 text-muted-foreground">持续</span>
                            <Input
                              type="number"
                              min={1}
                              value={draft.recurDuration}
                              onChange={(e) => update("recurDuration", Math.max(1, parseInt(e.target.value || "1", 10)))}
                              disabled={draft.recurForever}
                              className="h-7 w-20 text-xs"
                            />
                            <span className="text-muted-foreground">天 /</span>
                            <label className="inline-flex cursor-pointer items-center gap-1.5">
                              <Checkbox
                                checked={draft.recurForever}
                                onCheckedChange={(c) => update("recurForever", Boolean(c))}
                              />
                              <span>持续执行直到手动停止</span>
                            </label>
                          </div>
                          <p className="text-[11px] text-muted-foreground">系统将从开始时间起，按设定频次为每个账号循环发布贴文</p>
                        </div>
                      )}
                    </label>
                  </RadioGroup>
                </div>
              )}
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
              <Button size="sm" className="gap-1" onClick={() => handleSubmit(true)}>
                <Sparkles className="h-3.5 w-3.5" />确认创建
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

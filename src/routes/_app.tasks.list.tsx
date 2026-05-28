import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Bot, Sparkles, ListChecks, CheckCircle2, XCircle, Clock3,
  PlayCircle, MousePointerClick, PauseCircle, Trash2, BookmarkPlus, FileText,
  Search, RotateCcw, Filter, Eye, ScrollText, BarChart3, type LucideIcon,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  PLATFORMS, PLATFORM_CHIP, SUBTYPE_LABEL, SUBTYPE_CLS, STATUS_LABEL, STATUS_CLS,
  type Platform, type TaskSubType, type TaskStatus, type TaskRow, type TaskTemplate,
  useTasks, tasksActions, templatesActions,
  executeTask, fmtNow, uid,
} from "@/lib/operations-store";

export const Route = createFileRoute("/_app/tasks/list")({
  component: TaskListPage,
  head: () => ({ meta: [{ title: "任务列表 — BooPilot" }] }),
});

const SUBTYPE_ICON: Record<TaskSubType, LucideIcon> = { nurture: Bot, action: MousePointerClick };
const STATUS_ICON: Record<TaskStatus, LucideIcon> = {
  pending: Clock3, running: PlayCircle, success: CheckCircle2, failed: XCircle, partial: PauseCircle,
};

function TaskListPage() {
  const tasks = useTasks();

  const [previewTask, setPreviewTask] = useState<TaskRow | null>(null);
  const [logTask, setLogTask] = useState<TaskRow | null>(null);
  const [statsTask, setStatsTask] = useState<TaskRow | null>(null);
  const [saveTplFor, setSaveTplFor] = useState<TaskRow | null>(null);
  const [saveTplName, setSaveTplName] = useState("");


  const stats = useMemo(() => ({
    total: tasks.length,
    running: tasks.filter((t) => t.status === "running").length,
    success: tasks.filter((t) => t.status === "success").length,
    failed: tasks.filter((t) => t.status === "failed" || t.status === "partial").length,
  }), [tasks]);

  const [tKeyword, setTKeyword] = useState("");
  const [tSubtype, setTSubtype] = useState<"all" | TaskSubType>("all");
  const [tPlatform, setTPlatform] = useState<"all" | Platform>("all");
  const [tStatus, setTStatus] = useState<"all" | TaskStatus>("all");

  const filteredTasks = useMemo(() => {
    const kw = tKeyword.trim().toLowerCase();
    return tasks.filter((t) => {
      if (kw && !t.name.toLowerCase().includes(kw) && !t.id.toLowerCase().includes(kw)) return false;
      if (tSubtype !== "all" && t.subtype !== tSubtype) return false;
      if (tPlatform !== "all" && !t.platforms.includes(tPlatform)) return false;
      if (tStatus !== "all" && t.status !== tStatus) return false;
      return true;
    });
  }, [tasks, tKeyword, tSubtype, tPlatform, tStatus]);

  const pageSize = 10;
  const [taskPage, setTaskPage] = useState(1);
  const taskTotalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pagedFilteredTasks = useMemo(() => {
    const start = (taskPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, taskPage]);

  const tasksFiltersActive = tKeyword.trim() !== "" || tSubtype !== "all" || tPlatform !== "all" || tStatus !== "all";

  const resetTaskFilters = () => {
    setTKeyword(""); setTSubtype("all"); setTPlatform("all"); setTStatus("all"); setTaskPage(1);
  };

  const handleManualSaveTemplate = () => {
    if (!saveTplFor) return;
    if (!saveTplName.trim()) { toast.error("请输入模版名称"); return; }
    const tpl: TaskTemplate = {
      id: uid("tpl"), name: saveTplName.trim(), subtype: saveTplFor.subtype, platforms: saveTplFor.platforms,
      total: saveTplFor.total, description: saveTplFor.description, createdAt: fmtNow(), uses: 0,
    };
    templatesActions.add(tpl);
    toast.success(`已保存模版「${tpl.name}」`);
    setSaveTplFor(null); setSaveTplName("");
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">任务列表</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              <Sparkles className="h-3 w-3" />智能体驱动
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            查看与管理所有运营任务的执行状态。前往「任务模版」可通过「账号运营助手」对话创建并执行任务。
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="任务总数" value={stats.total} icon={ListChecks} tone="muted" />
          <StatCard title="执行中" value={stats.running} icon={PlayCircle} tone="primary" />
          <StatCard title="成功" value={stats.success} icon={CheckCircle2} tone="success" />
          <StatCard title="失败/部分" value={stats.failed} icon={XCircle} tone="destructive" />
        </div>

        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={tKeyword} onChange={(e) => setTKeyword(e.target.value)} placeholder="搜索任务名称 / ID" className="h-8 pl-8 text-xs" />
            </div>
            <Select value={tSubtype} onValueChange={(v) => setTSubtype(v as typeof tSubtype)}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="nurture">周期性</SelectItem>
                <SelectItem value="action">单次触达</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tPlatform} onValueChange={(v) => setTPlatform(v as typeof tPlatform)}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tStatus} onValueChange={(v) => setTStatus(v as typeof tStatus)}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tasksFiltersActive && (
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground" onClick={resetTaskFilters}>
                <RotateCcw className="h-3.5 w-3.5" />重置
              </Button>
            )}
            <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Filter className="h-3 w-3" />共 <span className="font-semibold text-foreground tabular-nums">{filteredTasks.length}</span> 条
              {tasksFiltersActive && <span>/ {tasks.length}</span>}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table className="[&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="min-w-[260px]">任务名称</TableHead>
                  <TableHead className="w-[110px]">类型</TableHead>
                  <TableHead className="min-w-[180px]">平台</TableHead>
                  
                  <TableHead className="w-[110px]">状态</TableHead>
                  <TableHead className="w-[160px]">创建时间</TableHead>
                  <TableHead className="w-[380px] text-center pr-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-sm text-muted-foreground">
                      {tasks.length === 0
                        ? "还没有运营任务，前往「任务模版」通过智能体对话即可创建。"
                        : (
                          <span className="inline-flex items-center gap-2">
                            没有符合筛选条件的任务
                            <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={resetTaskFilters}>清除筛选</Button>
                          </span>
                        )}
                    </TableCell>
                  </TableRow>
                ) : pagedFilteredTasks.map((t) => {
                  const SIcon = STATUS_ICON[t.status];
                  const TIcon = SUBTYPE_ICON[t.subtype];
                  const pct = t.total === 0 ? 0 : Math.round(((t.done + t.failed) / t.total) * 100);
                  return (
                    <TableRow key={t.id} className="border-b-border/40">
                      <TableCell>
                        <button onClick={() => setPreviewTask(t)} className="group block text-left">
                          <div className="font-medium text-sm text-foreground group-hover:text-primary">{t.name}</div>
                          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{t.id}</div>
                          {t.fromTemplate && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-violet-600">
                              <BookmarkPlus className="h-3 w-3" />来源模版：{t.fromTemplate}
                            </div>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1 text-xs font-normal", SUBTYPE_CLS[t.subtype])}>
                          <TIcon className="h-3 w-3" />{SUBTYPE_LABEL[t.subtype]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {t.platforms.map((p) => (
                            <Badge key={p} variant="outline" className={cn("text-[10px] font-normal", PLATFORM_CHIP[p])}>{p}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full", t.status === "failed" ? "bg-destructive" : t.status === "partial" ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-[11px] tabular-nums text-muted-foreground">
                            <span className="text-success">{t.done}</span> / <span className="text-destructive">{t.failed}</span> / {t.total}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1 text-xs font-normal", STATUS_CLS[t.status])}>
                          <SIcon className="h-3 w-3" />{STATUS_LABEL[t.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] tabular-nums text-muted-foreground">{t.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs"
                                disabled={t.status === "running"}
                                onClick={() => executeTask(t.id)}>
                                <PlayCircle className="h-3.5 w-3.5" />{t.status === "pending" ? "执行" : "重跑"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t.status === "pending" ? "开始执行" : "重新执行"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs"
                                onClick={() => setPreviewTask(t)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>查看任务详情</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs"
                                onClick={() => setLogTask(t)}>
                                <ScrollText className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>查看日志</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs"
                                onClick={() => setStatsTask(t)}>
                                <BarChart3 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>查看统计数据</TooltipContent>
                          </Tooltip>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => { tasksActions.remove(t.id); toast.success("任务已删除"); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationBar page={taskPage} totalPages={taskTotalPages} total={filteredTasks.length} setPage={setTaskPage} />
        </div>
      </div>

      {/* 任务详情弹窗 */}
      <Dialog open={!!previewTask} onOpenChange={(o) => !o && setPreviewTask(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />任务详情
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{previewTask?.id}</DialogDescription>
          </DialogHeader>
          {previewTask && (
            <div className="space-y-3 text-sm">
              <Field label="任务名称" value={previewTask.name} />
              <Field label="类型" value={SUBTYPE_LABEL[previewTask.subtype]} />
              <Field label="平台" value={previewTask.platforms.join(" / ")} />
              <Field label="数量 / 进度" value={`成功 ${previewTask.done} / 失败 ${previewTask.failed} / 总计 ${previewTask.total}`} />
              <Field label="状态" value={STATUS_LABEL[previewTask.status]} />
              <Field label="创建人" value={previewTask.createdBy} />
              <Field label="创建时间" value={previewTask.createdAt} />
              {previewTask.endTime && <Field label="结束时间" value={previewTask.endTime} />}
              {previewTask.fromTemplate && <Field label="来源模版" value={previewTask.fromTemplate} />}
              <div>
                <div className="mb-1 text-xs text-muted-foreground">任务描述</div>
                <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">{previewTask.description}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTask(null)}>关闭</Button>
            {previewTask && (
              <Button onClick={() => { setSaveTplFor(previewTask); setSaveTplName(previewTask.name); setPreviewTask(null); }} variant="secondary" className="gap-1.5">
                <BookmarkPlus className="h-4 w-4" />存为模版
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 存为模版弹窗 */}
      <Dialog open={!!saveTplFor} onOpenChange={(o) => { if (!o) { setSaveTplFor(null); setSaveTplName(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5 text-violet-600" />保存为任务模版
            </DialogTitle>
            <DialogDescription>
              基于任务「{saveTplFor?.name}」创建模版，后续可在「任务模版」中复用。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">模版名称 <span className="text-destructive">*</span></Label>
              <Input id="tpl-name" value={saveTplName} onChange={(e) => setSaveTplName(e.target.value)} placeholder="例如：节日营销触达" />
            </div>
            {saveTplFor && (
              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="text-muted-foreground">将保留以下配置：</div>
                <div>类型：{SUBTYPE_LABEL[saveTplFor.subtype]}</div>
                <div>平台：{saveTplFor.platforms.join(" / ")}</div>
                <div>数量：{saveTplFor.total}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaveTplFor(null); setSaveTplName(""); }}>取消</Button>
            <Button onClick={handleManualSaveTemplate}>保存模版</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看日志弹窗 */}
      <Dialog open={!!logTask} onOpenChange={(o) => !o && setLogTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />任务日志
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{logTask?.id}</DialogDescription>
          </DialogHeader>
          {logTask && (
            <div className="max-h-[420px] overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
              {buildMockLogs(logTask).map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0 text-muted-foreground">{line.ts}</span>
                  <span className={cn(
                    "shrink-0 w-12",
                    line.level === "ERROR" ? "text-destructive" :
                    line.level === "WARN" ? "text-amber-600" : "text-emerald-600",
                  )}>[{line.level}]</span>
                  <span className="text-foreground">{line.msg}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogTask(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看统计数据弹窗 */}
      <Dialog open={!!statsTask} onOpenChange={(o) => !o && setStatsTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />统计数据
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{statsTask?.id}</DialogDescription>
          </DialogHeader>
          {statsTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <StatBox label="总计" value={statsTask.total} />
                <StatBox label="成功" value={statsTask.done} tone="success" />
                <StatBox label="失败" value={statsTask.failed} tone="danger" />
                <StatBox label="成功率" value={`${statsTask.total ? Math.round((statsTask.done / statsTask.total) * 100) : 0}%`} />
              </div>
              <Tabs defaultValue="platform" className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">分布维度</div>
                  <TabsList className="h-8">
                    <TabsTrigger value="platform" className="text-xs">按平台分布</TabsTrigger>
                    <TabsTrigger value="target" className="text-xs">按目标账号分布</TabsTrigger>
                    <TabsTrigger value="reach" className="text-xs">按触达账号分布</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="platform" className="mt-0">
                  <DistList rows={buildDist(statsTask, "platform")} />
                </TabsContent>
                <TabsContent value="target" className="mt-0">
                  <DistList rows={buildDist(statsTask, "target")} />
                </TabsContent>
                <TabsContent value="reach" className="mt-0">
                  <DistList rows={buildDist(statsTask, "reach")} />
                </TabsContent>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />成功</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-destructive" />失败</span>
                </div>
              </Tabs>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="平均耗时" value="2.4s / 账号" />
                <Field label="峰值并发" value="12" />
                <Field label="创建时间" value={statsTask.createdAt} />
                <Field label="结束时间" value={statsTask.endTime ?? "—"} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsTask(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>

  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "danger" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-1 text-xl font-semibold tabular-nums",
        tone === "success" ? "text-emerald-600" : tone === "danger" ? "text-destructive" : "text-foreground",
      )}>{value}</div>
    </div>
  );
}

type DistRow = { label: string; success: number; failed: number };

function buildDist(t: TaskRow, dim: "platform" | "target" | "reach"): DistRow[] {
  // Deterministic pseudo-random based on task id + dim to avoid SSR hydration drift
  const seed = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const rng = (key: string) => {
    const h = seed(`${t.id}|${dim}|${key}`);
    return (h % 1000) / 1000;
  };

  let labels: string[] = [];
  if (dim === "platform") labels = [...t.platforms];
  else if (dim === "target") labels = ["新客户", "老客户", "高意向", "潜在客户", "流失召回"];
  else labels = ["主账号", "矩阵号", "合作号", "外联号"];

  const n = labels.length || 1;
  // Distribute totals across buckets with slight variation while preserving sums.
  const weights = labels.map((l) => 0.6 + rng(l) * 0.8);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const rows: DistRow[] = labels.map((l, i) => {
    const share = weights[i] / wSum;
    const success = Math.round(t.done * share);
    const failed = Math.round(t.failed * share);
    return { label: l, success, failed };
  });
  // Reconcile rounding drift to match totals exactly
  const adjust = (key: "success" | "failed", target: number) => {
    const cur = rows.reduce((a, r) => a + r[key], 0);
    let diff = target - cur;
    let i = 0;
    while (diff !== 0 && rows.length > 0) {
      const r = rows[i % rows.length];
      if (diff > 0) { r[key] += 1; diff -= 1; }
      else if (r[key] > 0) { r[key] -= 1; diff += 1; }
      i += 1;
      if (i > n * 10) break;
    }
  };
  adjust("success", t.done);
  adjust("failed", t.failed);
  return rows;
}

function DistList({ rows }: { rows: DistRow[] }) {
  if (rows.length === 0) {
    return <div className="py-6 text-center text-xs text-muted-foreground">暂无数据</div>;
  }
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const total = r.success + r.failed;
        const sPct = total ? (r.success / total) * 100 : 0;
        const fPct = total ? (r.failed / total) * 100 : 0;
        return (
          <div key={r.label} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate" title={r.label}>{r.label}</span>
            <div className="flex h-2 flex-1 overflow-hidden rounded bg-muted">
              <div className="h-full bg-emerald-500" style={{ width: `${sPct}%` }} />
              <div className="h-full bg-destructive" style={{ width: `${fPct}%` }} />
            </div>
            <span className="w-44 shrink-0 text-right tabular-nums text-muted-foreground">
              <span className="text-emerald-600">{r.success}</span>
              <span className="mx-0.5">/</span>
              <span className="text-destructive">{r.failed}</span>
              <span className="mx-0.5">/</span>
              <span>{total}</span>
              <span className="ml-1 text-[10px]">
                ({total ? Math.round(sPct) : 0}% · {total ? Math.round(fPct) : 0}%)
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

type LogLine = { ts: string; level: "INFO" | "WARN" | "ERROR"; msg: string };

function buildMockLogs(t: TaskRow): LogLine[] {
  const base = t.createdAt.slice(11) || "10:00:00";
  const [hh, mm, ss] = base.split(":").map(Number);
  const at = (offset: number) => {
    const total = (hh * 3600 + mm * 60 + ss + offset) % 86400;
    const H = String(Math.floor(total / 3600)).padStart(2, "0");
    const M = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const S = String(total % 60).padStart(2, "0");
    return `${H}:${M}:${S}`;
  };
  const lines: LogLine[] = [
    { ts: at(0), level: "INFO", msg: `任务「${t.name}」已创建，计划执行 ${t.total} 个账号` },
    { ts: at(1), level: "INFO", msg: `平台范围：${t.platforms.join(", ")}` },
    { ts: at(2), level: "INFO", msg: "调度器已分配执行节点 boo-node-shenzhen-01" },
    { ts: at(4), level: "INFO", msg: "镜像实例预热完成，开始批次 #1" },
  ];
  for (let i = 0; i < Math.min(6, t.done); i++) {
    lines.push({ ts: at(6 + i * 2), level: "INFO", msg: `账号 acc-${1000 + i} 执行成功` });
  }
  for (let i = 0; i < Math.min(3, t.failed); i++) {
    lines.push({ ts: at(20 + i * 3), level: "ERROR", msg: `账号 acc-${2000 + i} 执行失败：登录态过期` });
  }
  if (t.status === "running") {
    lines.push({ ts: at(40), level: "INFO", msg: "任务执行中…" });
  } else if (t.status === "success") {
    lines.push({ ts: at(45), level: "INFO", msg: "任务执行完成" });
  } else if (t.status === "failed") {
    lines.push({ ts: at(45), level: "ERROR", msg: "任务执行失败，已停止" });
  }
  return lines;
}


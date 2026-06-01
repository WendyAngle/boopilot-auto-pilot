import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Search, RotateCcw, Filter, ScrollText,
  ListChecks, CheckCircle2, PlayCircle, Clock3, FileText, XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  PLATFORM_CHIP, SUBTYPE_LABEL, SUBTYPE_CLS,
  type Platform, useTasks, type TaskRow,
} from "@/lib/operations-store";
import { USERNAMES } from "@/lib/managed-account-mock";

export const Route = createFileRoute("/_app/tasks/$taskId")({
  component: TaskDetailPage,
  head: () => ({ meta: [{ title: "任务详情 — BooPilot" }] }),
});

/* ============================================================ */
/* 子任务类型与生成                                              */
/* ============================================================ */

type SubStatus = "success" | "partial" | "failed" | "pending" | "running";

const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  pending: "待执行",
  running: "执行中",
  success: "执行成功",
  partial: "部分成功",
  failed: "执行失败",
};
const SUB_STATUS_CLS: Record<SubStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  running: "bg-primary/10 text-primary border-primary/30",
  success: "bg-success/10 text-success border-success/30",
  partial: "bg-warning/10 text-warning border-warning/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
};

const ACTIONS = ["点赞", "评论", "关注", "发帖", "加好友", "发私信", "转发分享", "浏览"] as const;
const TARGETS = ["新客户", "老客户", "高意向", "潜在客户", "流失召回"] as const;


type SubTask = {
  id: string;
  reachAccount: string;
  action: string;
  target: string;
  platform: Platform;
  status: SubStatus;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildSubTasks(t: TaskRow): SubTask[] {
  const list: SubTask[] = [];
  const total = t.total;
  const done = t.done;
  const failed = t.failed;
  const running = t.status === "running" ? Math.min(2, total - done - failed) : 0;
  const finished = done + failed;
  for (let i = 0; i < total; i++) {
    const h = hash(`${t.id}|${i}`);
    const platform = t.platforms[h % t.platforms.length];
    const action = ACTIONS[(h >> 3) % ACTIONS.length];
    const target = TARGETS[(h >> 6) % TARGETS.length];
    const base = USERNAMES[i % USERNAMES.length];
    const round = Math.floor(i / USERNAMES.length);
    const reachAccount = round === 0 ? base : `${base}-${round + 1}`;
    let status: SubStatus;
    if (i < done) status = "success";
    else if (i < done + failed) status = "failed";
    else if (i < finished + running) status = "running";
    else status = "pending";
    list.push({
      id: `${t.id}-${String(i + 1).padStart(3, "0")}`,
      reachAccount,
      action,
      target,
      platform,
      status,
    });
  }
  return list;
}

function buildSubLogs(sub: SubTask): { ts: string; level: "INFO" | "WARN" | "ERROR"; msg: string }[] {
  const base = ["10:12:08", "10:12:09", "10:12:11", "10:12:14"];
  if (sub.status === "pending") {
    return [{ ts: base[0], level: "INFO", msg: `子任务 ${sub.id} 已排队等待调度` }];
  }
  if (sub.status === "running") {
    return [
      { ts: base[0], level: "INFO", msg: `子任务 ${sub.id} 已分配执行节点` },
      { ts: base[1], level: "INFO", msg: `${sub.platform} · ${sub.reachAccount} 正在执行「${sub.action}」` },
    ];
  }
  if (sub.status === "failed") {
    return [
      { ts: base[0], level: "INFO", msg: `子任务 ${sub.id} 已分配执行节点` },
      { ts: base[1], level: "INFO", msg: `${sub.platform} · ${sub.reachAccount} 开始执行「${sub.action}」（目标：${sub.target}）` },
      { ts: base[2], level: "WARN", msg: `登录态校验失败` },
      { ts: base[3], level: "ERROR", msg: `执行失败：账号风控/登录态过期` },
    ];
  }
  return [
    { ts: base[0], level: "INFO", msg: `子任务 ${sub.id} 已分配执行节点` },
    { ts: base[1], level: "INFO", msg: `${sub.platform} · ${sub.reachAccount} 开始执行「${sub.action}」（目标：${sub.target}）` },
    { ts: base[2], level: "INFO", msg: `登录态校验通过` },
    { ts: base[3], level: "INFO", msg: `执行成功` },
  ];
}

/* ============================================================ */
/* 页面                                                          */
/* ============================================================ */

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

  const subtasks = useMemo(() => (task ? buildSubTasks(task) : []), [task]);

  const [kw, setKw] = useState("");
  const [fPlatform, setFPlatform] = useState<"all" | Platform>("all");
  const [fAction, setFAction] = useState<"all" | string>("all");
  const [fStatus, setFStatus] = useState<"all" | SubStatus>("all");

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return subtasks.filter((s) => {
      if (k && !s.id.toLowerCase().includes(k) && !s.reachAccount.toLowerCase().includes(k)
        && !s.action.toLowerCase().includes(k) && !s.platform.toLowerCase().includes(k)) return false;
      if (fPlatform !== "all" && s.platform !== fPlatform) return false;
      if (fAction !== "all" && s.action !== fAction) return false;
      if (fStatus !== "all" && s.status !== fStatus) return false;
      return true;
    });
  }, [subtasks, kw, fPlatform, fAction, fStatus]);

  const filtersActive = kw.trim() !== "" || fPlatform !== "all" || fAction !== "all" || fStatus !== "all";
  const resetFilters = () => { setKw(""); setFPlatform("all"); setFAction("all"); setFStatus("all"); setPage(1); };

  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize), [filtered, page]);

  const stats = useMemo(() => ({
    total: subtasks.length,
    done: subtasks.filter((s) => s.status === "success").length,
    failed: subtasks.filter((s) => s.status === "failed").length,
    running: subtasks.filter((s) => s.status === "running").length,
    pending: subtasks.filter((s) => s.status === "pending").length,
  }), [subtasks]);

  if (!task) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate({ to: "/tasks/list" })}>
          <ArrowLeft className="h-4 w-4" />返回任务列表
        </Button>
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          未找到任务 <span className="font-mono">{taskId}</span>
        </div>
      </div>
    );
  }

  const platformOptions = task.platforms;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* 顶部返回 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => navigate({ to: "/tasks/list" })}>
            <ArrowLeft className="h-4 w-4" />返回任务列表
          </Button>
        </div>

        {/* 任务概要 */}
        <header className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold tracking-tight">{task.name}</h1>
                <Badge variant="outline" className={cn("gap-1 text-xs font-normal", SUBTYPE_CLS[task.subtype])}>
                  {SUBTYPE_LABEL[task.subtype]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{task.id}</span>
                <span>·</span>
                <span>创建人：{task.createdBy}</span>
                <span>·</span>
                <span>创建时间：{task.createdAt}</span>
                {task.endTime && (<><span>·</span><span>结束时间：{task.endTime}</span></>)}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {task.platforms.map((p) => (
                  <Badge key={p} variant="outline" className={cn("text-[10px] font-normal", PLATFORM_CHIP[p])}>{p}</Badge>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* 统计卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="任务总数" value={stats.total} icon={ListChecks} tone="muted" />
          <StatCard title="执行成功" value={stats.done} icon={CheckCircle2} tone="success" />
          <StatCard title="执行失败" value={stats.failed} icon={XCircle} tone="destructive" />
          <StatCard title="执行中" value={stats.running} icon={PlayCircle} tone="primary" />
          <StatCard title="待执行" value={stats.pending} icon={Clock3} tone="warning" />
        </div>

        {/* 子任务列表 */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={kw} onChange={(e) => { setKw(e.target.value); setPage(1); }}
                placeholder="搜索任务ID / 账号 / 动作 / 平台" className="h-8 pl-8 text-xs" />
            </div>
            <Select value={fPlatform} onValueChange={(v) => { setFPlatform(v as typeof fPlatform); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fAction} onValueChange={(v) => { setFAction(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="动作" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部动作</SelectItem>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={(v) => { setFStatus(v as typeof fStatus); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {(Object.keys(SUB_STATUS_LABEL) as SubStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{SUB_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" />重置
              </Button>
            )}
            <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Filter className="h-3 w-3" />共 <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span> 条
              {filtersActive && <span>/ {subtasks.length}</span>}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table className="[&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="min-w-[200px]">任务ID</TableHead>
                  <TableHead className="min-w-[160px]">账号</TableHead>
                  <TableHead className="w-[110px]">操作/动作</TableHead>
                  <TableHead className="w-[120px]">目标</TableHead>
                  <TableHead className="w-[130px]">平台</TableHead>
                  <TableHead className="w-[110px]">任务状态</TableHead>
                  <TableHead className="w-[120px] text-center pr-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      {subtasks.length === 0 ? "暂无子任务" : (
                        <span className="inline-flex items-center gap-2">
                          没有符合筛选条件的子任务
                          <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={resetFilters}>清除筛选</Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ) : paged.map((s) => (
                  <TableRow key={s.id} className="border-b-border/40">
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{s.id}</TableCell>
                    <TableCell className="text-sm">{s.reachAccount}</TableCell>
                    <TableCell className="text-sm">{s.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.target}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-normal", PLATFORM_CHIP[s.platform])}>{s.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-normal", SUB_STATUS_CLS[s.status])}>
                        {SUB_STATUS_LABEL[s.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() => navigate({
                                to: "/tasks/$taskId/logs/sub/$subId",
                                params: { taskId: task.id, subId: s.id },
                              })}
                            >
                              <ScrollText className="h-3.5 w-3.5" />查看日志
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>查看子任务日志</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar page={page} totalPages={totalPages} total={filtered.length} setPage={setPage} />
        </div>
      </div>

    </TooltipProvider>
  );
}

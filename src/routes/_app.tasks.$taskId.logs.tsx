import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Search, RotateCcw, Filter, ScrollText, Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  PLATFORM_CHIP, SUBTYPE_LABEL, SUBTYPE_CLS, useTasks,
} from "@/lib/operations-store";
import {
  buildLogs, EVENT_TYPES, STATUS_CLS, STATUS_LABEL, type LogStatus,
} from "@/lib/task-logs";

export const Route = createFileRoute("/_app/tasks/$taskId/logs")({
  component: TaskLogsPage,
  head: () => ({ meta: [{ title: "任务日志 — BooPilot" }] }),
});

function TaskLogsPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const logs = useMemo(() => (task ? buildLogs(task) : []), [task]);

  const [kw, setKw] = useState("");
  const [fPlatform, setFPlatform] = useState<"all" | string>("all");
  const [fEvent, setFEvent] = useState<"all" | string>("all");
  const [fCode, setFCode] = useState<"all" | string>("all");
  const [fStatus, setFStatus] = useState<"all" | LogStatus>("all");
  const [fDate, setFDate] = useState<string>("");
  const [page, setPage] = useState(1);

  const codeOptions = useMemo(() => Array.from(new Set(logs.map((l) => l.statusCode))).sort(), [logs]);
  const platformOptions = useMemo(() => Array.from(new Set(logs.map((l) => l.platform))), [logs]);

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return logs.filter((l) => {
      if (k) {
        const hay = [
          l.id, l.subTaskId, l.account, l.actionType, l.eventType, l.platform,
          l.statusCode, l.statusCodeDesc, l.content, l.ts,
        ].join(" ").toLowerCase();
        if (!hay.includes(k)) return false;
      }
      if (fPlatform !== "all" && l.platform !== fPlatform) return false;
      if (fEvent !== "all" && l.eventType !== fEvent) return false;
      if (fCode !== "all" && l.statusCode !== fCode) return false;
      if (fStatus !== "all" && l.status !== fStatus) return false;
      if (fDate && !l.ts.startsWith(fDate)) return false;
      return true;
    });
  }, [logs, kw, fPlatform, fEvent, fCode, fStatus, fDate]);

  const filtersActive = kw.trim() !== "" || fPlatform !== "all" || fEvent !== "all"
    || fCode !== "all" || fStatus !== "all" || fDate !== "";
  const resetFilters = () => {
    setKw(""); setFPlatform("all"); setFEvent("all"); setFCode("all"); setFStatus("all"); setFDate(""); setPage(1);
  };

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize), [filtered, page]);

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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => navigate({ to: "/tasks/list" })}>
            <ArrowLeft className="h-4 w-4" />返回任务列表
          </Button>
        </div>

        <header className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">任务日志 · {task.name}</h1>
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
            </div>
          </div>
        </header>

        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={kw} onChange={(e) => { setKw(e.target.value); setPage(1); }}
                placeholder="搜索 子任务ID / 触达账号 / 事件类型 / 状态码描述 / 日志内容" className="h-8 pl-8 text-xs" />
            </div>
            <Select value={fPlatform} onValueChange={(v) => { setFPlatform(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fEvent} onValueChange={(v) => { setFEvent(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[210px] text-xs"><SelectValue placeholder="事件类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部事件</SelectItem>
                {EVENT_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fCode} onValueChange={(v) => { setFCode(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="状态码" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态码</SelectItem>
                {codeOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={(v) => { setFStatus(v as typeof fStatus); setPage(1); }}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {(Object.keys(STATUS_LABEL) as LogStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={fDate} onChange={(e) => { setFDate(e.target.value); setPage(1); }}
              className="h-8 w-[150px] text-xs" />
            {filtersActive && (
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" />重置
              </Button>
            )}
            <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Filter className="h-3 w-3" />共 <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span> 条
              {filtersActive && <span>/ {logs.length}</span>}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table className="[&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="w-[110px]">子任务ID</TableHead>
                  <TableHead className="w-[150px]">触达账号</TableHead>
                  <TableHead className="w-[220px]">事件类型</TableHead>
                  <TableHead className="min-w-[200px]">目标</TableHead>
                  <TableHead className="w-[100px]">平台</TableHead>
                  <TableHead className="w-[90px]">状态码</TableHead>
                  <TableHead className="w-[140px]">状态码描述</TableHead>
                  <TableHead className="min-w-[240px]">日志内容</TableHead>
                  <TableHead className="w-[160px]">时间</TableHead>
                  <TableHead className="w-[100px]">状态</TableHead>
                  <TableHead className="w-[80px] text-center pr-4">详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-sm text-muted-foreground">
                      {logs.length === 0 ? "暂无日志" : (
                        <span className="inline-flex items-center gap-2">
                          没有符合筛选条件的日志
                          <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={resetFilters}>清除筛选</Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ) : paged.map((l) => (
                  <TableRow key={l.id} className="border-b-border/40">
                    <TableCell className="font-mono text-xs">{l.subTaskId}</TableCell>
                    <TableCell className="font-mono text-xs">{l.account}</TableCell>
                    <TableCell className="font-mono text-xs">{l.eventType}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[280px] truncate" title={l.target}>
                      {l.target}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-normal lowercase", PLATFORM_CHIP[l.platformBadge])}>
                        {l.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs", l.status === "failed" && "text-destructive")}>
                      {l.statusCode}
                    </TableCell>
                    <TableCell className={cn("text-xs text-muted-foreground", l.status === "failed" && "text-destructive/80")}>
                      {l.statusCodeDesc}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/90 max-w-[360px] truncate" title={l.content}>{l.content}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{l.ts}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-normal", STATUS_CLS[l.status])}>
                        {STATUS_LABEL[l.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => navigate({
                                to: "/tasks/$taskId/logs/$logId",
                                params: { taskId: task.id, logId: l.id },
                              })}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>查看日志详情</TooltipContent>
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

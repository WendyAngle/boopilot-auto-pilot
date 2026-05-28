import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Search, RotateCcw, Filter, ScrollText, FileText, Eye,
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
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  PLATFORM_CHIP, SUBTYPE_LABEL, SUBTYPE_CLS,
  type Platform, useTasks, type TaskRow,
} from "@/lib/operations-store";

export const Route = createFileRoute("/_app/tasks/$taskId/logs")({
  component: TaskLogsPage,
  head: () => ({ meta: [{ title: "任务日志 — BooPilot" }] }),
});

/* ============================================================ */
/* 业务数据                                                      */
/* ============================================================ */

type LogStatus = "success" | "failed" | "running" | "pending";

const STATUS_LABEL: Record<LogStatus, string> = {
  success: "执行成功", failed: "执行失败", running: "执行中", pending: "待执行",
};
const STATUS_CLS: Record<LogStatus, string> = {
  success: "bg-success/10 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  running: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
};

const ACTION_TYPES = [
  "gather_friend_list", "gather_unread_message", "visit_no_target",
  "send_message", "register_account", "like_post", "comment_post",
  "follow_user", "share_post", "browse_feed",
] as const;

type CodeDef = { code: string; desc: string };
const SUCCESS_CODE: CodeDef = { code: "0", desc: "成功" };
const FAIL_CODES: CodeDef[] = [
  { code: "999900", desc: "不支持的操作类型" },
  { code: "100401", desc: "登录态过期" },
  { code: "100503", desc: "请求被平台限流" },
  { code: "100404", desc: "目标内容不存在" },
  { code: "100500", desc: "执行节点超时" },
];

type LogRow = {
  id: string;                // 子任务ID（短数字）
  account: string;           // 触达账号（长数字）
  eventType: string;         // 事件类型 snake_case
  target: string;            // 目标资源 JSON 或 --
  platform: string;          // 平台 lowercase
  statusCode: string;        // 状态码
  statusCodeDesc: string;    // 状态码描述
  content: string;           // 日志内容
  ts: string;                // 时间
  status: LogStatus;
  platformBadge: Platform;   // 用于 PLATFORM_CHIP 颜色
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function platformText(p: string) {
  const map: Record<string, string> = {
    "Facebook": "facebook", "TikTok": "tiktok", "Instagram": "instagram",
    "X": "x", "Twitter": "x", "微信": "wechat", "抖音": "douyin",
    "小红书": "xiaohongshu", "快手": "kuaishou", "微博": "weibo",
    "B站": "bilibili", "哔哩哔哩": "bilibili",
  };
  return map[p] ?? p.toLowerCase();
}

function buildLogs(t: TaskRow): LogRow[] {
  const rows: LogRow[] = [];
  const total = t.total;
  const done = t.done;
  const failed = t.failed;
  const running = t.status === "running" ? Math.min(2, total - done - failed) : 0;
  const baseDate = (t.createdAt.split(" ")[0] || "2026-04-22");
  const [bh, bm, bs] = (t.createdAt.split(" ")[1] || "14:12:00").split(":").map(Number);
  const baseSeq = Number(t.id.slice(-6)) || 111000;

  for (let i = 0; i < total; i++) {
    const h = hash(`${t.id}|${i}`);
    const platform = t.platforms[h % t.platforms.length];
    const eventType = ACTION_TYPES[(h >> 3) % ACTION_TYPES.length];
    const accountNo = `6${String(1500000000000 + ((h >> 6) % 99999999999))}`.slice(0, 14);
    const subId = String(baseSeq + i * 7);
    let status: LogStatus;
    if (i < done) status = "success";
    else if (i < done + failed) status = "failed";
    else if (i < done + failed + running) status = "running";
    else status = "pending";

    const codeDef = status === "failed" ? FAIL_CODES[(h >> 9) % FAIL_CODES.length]
      : status === "success" ? SUCCESS_CODE
      : { code: "--", desc: "--" };

    const hasTargetJson = (h >> 12) % 4 !== 0;
    const target = hasTargetJson
      ? `{"account": "6${String(1500000000000 + ((h >> 15) % 99999999999)).slice(0, 13)}"}`
      : "--";

    const offset = i * 11;
    const total2 = (bh * 3600 + bm * 60 + bs + offset) % 86400;
    const H = pad(Math.floor(total2 / 3600));
    const M = pad(Math.floor((total2 % 3600) / 60));
    const S = pad(total2 % 60);

    const content = status === "success"
      ? `${eventType} executed successfully`
      : status === "failed"
        ? `${eventType} failed: ${codeDef.desc}`
        : status === "running"
          ? `${eventType} in progress`
          : `${eventType} queued, waiting for dispatch`;

    rows.push({
      id: subId,
      account: accountNo,
      eventType,
      target,
      platform: platformText(platform),
      statusCode: codeDef.code,
      statusCodeDesc: codeDef.desc,
      content,
      ts: `${baseDate} ${H}:${M}:${S}`,
      status,
      platformBadge: platform,
    });
  }
  return rows;
}

/* ============================================================ */
/* 详情事件时间线                                                */
/* ============================================================ */

type EventStatus = "done" | "pending" | "running";
const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  done: "已完成", pending: "待执行", running: "执行中",
};
const EVENT_STATUS_CLS: Record<EventStatus, string> = {
  done: "bg-success/10 text-success border-success/30",
  pending: "bg-muted text-muted-foreground border-border",
  running: "bg-primary/10 text-primary border-primary/30",
};

type EventRow = {
  id: string;
  eventType: string;
  status: EventStatus;
  content: string;
  ts: string;
  errorCode?: string;
  errorMsg?: string;
};

function buildEventTimeline(log: LogRow): EventRow[] {
  const baseDate = log.ts.split(" ")[0];
  const [bh, bm, bs] = log.ts.split(" ")[1].split(":").map(Number);
  const at = (offset: number) => {
    const total = (bh * 3600 + bm * 60 + bs + offset) % 86400;
    return `${baseDate} ${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  };

  const events: EventRow[] = [
    { id: "e1", eventType: "WORK_DISPATCH_SUCCEEDED", status: "done", content: "Work dispatched successfully", ts: at(0) },
    { id: "e2", eventType: `${log.eventType.toUpperCase()}_CREATED`, status: "done", content: `自动调度创建 ${log.eventType} Work，时长 7 分钟`, ts: at(0) },
    { id: "e3", eventType: "WORK_ACK", status: log.status === "pending" ? "pending" : "done", content: "work received", ts: at(0) },
  ];

  if (log.status === "running") {
    events.push({ id: "e4", eventType: "ACTION_EXECUTION", status: "running", content: "收到 ACTION_EXECUTION 回调", ts: at(468) });
  } else if (log.status === "success") {
    events.push({ id: "e4", eventType: "ACTION_EXECUTION", status: "done", content: "收到 ACTION_EXECUTION 回调", ts: at(468) });
    events.push({ id: "e5", eventType: "ACTION_EXECUTION", status: "done", content: "收到 ACTION_EXECUTION 回调", ts: at(468) });
    events.push({ id: "e6", eventType: "WORK_COMPLETED", status: "done", content: "Work completed successfully", ts: at(530) });
  } else if (log.status === "failed") {
    events.push({ id: "e4", eventType: "ACTION_EXECUTION", status: "done", content: "收到 ACTION_EXECUTION 回调", ts: at(468) });
    events.push({
      id: "e5", eventType: "ACTION_EXECUTION", status: "done",
      content: "收到 ACTION_EXECUTION 回调（含错误）", ts: at(468),
      errorCode: log.statusCode, errorMsg: log.statusCodeDesc,
    });
    events.push({
      id: "e6", eventType: "WORK_FAILED", status: "done",
      content: `Work failed: ${log.statusCodeDesc}`, ts: at(530),
      errorCode: log.statusCode, errorMsg: log.statusCodeDesc,
    });
  }
  return events;
}

/* ============================================================ */
/* 页面                                                          */
/* ============================================================ */

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

  const codeOptions = useMemo(() => Array.from(new Set(logs.map((l) => l.statusCode))).sort(), [logs]);
  const platformOptions = useMemo(() => Array.from(new Set(logs.map((l) => l.platform))), [logs]);

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return logs.filter((l) => {
      if (k) {
        const hay = [
          l.id, l.account, l.eventType, l.platform,
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
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize), [filtered, page]);

  const [detailLog, setDetailLog] = useState<LogRow | null>(null);

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
              <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="事件类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部事件</SelectItem>
                {ACTION_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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
                  <TableHead className="w-[180px]">事件类型</TableHead>
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
                    <TableCell className="font-mono text-xs">{l.id}</TableCell>
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
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailLog(l)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>查看执行日志</TooltipContent>
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

      {/* 执行日志详情弹窗 */}
      <ExecutionLogDialog log={detailLog} onClose={() => setDetailLog(null)} />
    </TooltipProvider>
  );
}

/* ============================================================ */
/* 执行日志详情弹窗                                              */
/* ============================================================ */

function ExecutionLogDialog({ log, onClose }: { log: LogRow | null; onClose: () => void }) {
  const events = useMemo(() => (log ? buildEventTimeline(log) : []), [log]);
  const [kw, setKw] = useState("");
  const [fStatus, setFStatus] = useState<"all" | EventStatus>("all");

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return events.filter((e) => {
      if (k) {
        const hay = [e.eventType, e.content, e.errorCode ?? "", e.errorMsg ?? ""].join(" ").toLowerCase();
        if (!hay.includes(k)) return false;
      }
      if (fStatus !== "all" && e.status !== fStatus) return false;
      return true;
    });
  }, [events, kw, fStatus]);

  const traceId = log ? `work_${log.id}_${log.account.slice(-8)}` : "";

  return (
    <Dialog open={!!log} onOpenChange={(o) => { if (!o) { setKw(""); setFStatus("all"); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />执行日志
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>子任务ID：<span className="font-mono text-foreground">{log?.id}</span></span>
              <span>Trace ID：<span className="font-mono text-foreground">{traceId}</span></span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-y bg-muted/30 px-1 py-2">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={kw} onChange={(e) => setKw(e.target.value)}
              placeholder="请输入事件类型/日志内容/详情等关键词搜索" className="h-8 pl-8 text-xs" />
          </div>
          <Select value={fStatus} onValueChange={(v) => setFStatus(v as typeof fStatus)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {(Object.keys(EVENT_STATUS_LABEL) as EventStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{EVENT_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-[11px] text-muted-foreground">
            共 <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span> 条
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table className="[&_th]:whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-transparent">
                <TableHead className="w-[260px]">事件类型</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="min-w-[260px]">日志内容</TableHead>
                <TableHead className="w-[160px]">时间</TableHead>
                <TableHead className="w-[260px]">详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    没有符合条件的事件
                  </TableCell>
                </TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id} className="align-top border-b-border/40">
                  <TableCell className="font-mono text-xs break-all">{e.eventType}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-normal", EVENT_STATUS_CLS[e.status])}>
                      {EVENT_STATUS_LABEL[e.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-foreground/90">{e.content}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-pre-line">
                    {e.ts.replace(" ", "\n")}
                  </TableCell>
                  <TableCell>
                    {(e.errorCode || e.errorMsg) ? (
                      <div className="space-y-1.5">
                        <div className="rounded-md border border-amber-200/60 bg-amber-50/60 px-2 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                          <div className="text-[10px] uppercase text-muted-foreground">错误码</div>
                          <div className="font-mono text-xs text-foreground">{e.errorCode ?? "-"}</div>
                        </div>
                        <div className="rounded-md border border-amber-200/60 bg-amber-50/60 px-2 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                          <div className="text-[10px] uppercase text-muted-foreground">错误信息</div>
                          <div className="text-xs text-foreground">{e.errorMsg ?? "-"}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

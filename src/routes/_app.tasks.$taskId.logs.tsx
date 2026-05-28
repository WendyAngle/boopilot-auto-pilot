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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
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
/* 日志数据生成                                                  */
/* ============================================================ */

type LogStatus = "success" | "failed" | "running" | "pending";

const STATUS_LABEL: Record<LogStatus, string> = {
  success: "成功", failed: "失败", running: "执行中", pending: "待执行",
};
const STATUS_CLS: Record<LogStatus, string> = {
  success: "bg-success/10 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  running: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
};

const EVENT_TYPES = ["登录校验", "执行点赞", "执行评论", "执行关注", "发帖", "加好友", "发私信", "转发分享", "浏览", "登出"] as const;
const TARGETS = ["新客户", "老客户", "高意向", "潜在客户", "流失召回"] as const;
const REACH_PREFIX = ["主账号", "矩阵号", "合作号", "外联号"];

type CodeDef = { code: string; desc: string; status: LogStatus };
const CODE_MAP: CodeDef[] = [
  { code: "BP-2000", desc: "执行成功", status: "success" },
  { code: "BP-2001", desc: "已下发执行节点", status: "running" },
  { code: "BP-2002", desc: "登录态校验通过", status: "success" },
  { code: "BP-3001", desc: "等待调度中", status: "pending" },
  { code: "BP-4001", desc: "登录态过期", status: "failed" },
  { code: "BP-4002", desc: "请求被限流", status: "failed" },
  { code: "BP-4003", desc: "目标内容不存在", status: "failed" },
  { code: "BP-5001", desc: "节点超时", status: "failed" },
];

type LogRow = {
  id: string;
  subTaskId: string;
  reachAccount: string;
  eventType: string;
  target: string;
  platform: Platform;
  statusCode: string;
  statusCodeDesc: string;
  content: string;
  ts: string;
  status: LogStatus;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function buildLogs(t: TaskRow): LogRow[] {
  const rows: LogRow[] = [];
  const total = t.total;
  const done = t.done;
  const failed = t.failed;
  const running = t.status === "running" ? Math.min(2, total - done - failed) : 0;
  const baseDate = (t.createdAt.split(" ")[0] || "2026-05-28");
  const [bh, bm, bs] = (t.createdAt.split(" ")[1] || "10:00:00").split(":").map(Number);

  for (let i = 0; i < total; i++) {
    const h = hash(`${t.id}|${i}`);
    const platform = t.platforms[h % t.platforms.length];
    const eventType = EVENT_TYPES[(h >> 3) % EVENT_TYPES.length];
    const target = TARGETS[(h >> 6) % TARGETS.length];
    const reachIdx = (h >> 9) % REACH_PREFIX.length;
    const reachAccount = `${REACH_PREFIX[reachIdx]}_${String(1000 + ((h >> 12) % 9000))}`;
    const subTaskId = `${t.id}-${String(i + 1).padStart(3, "0")}`;
    let status: LogStatus;
    if (i < done) status = "success";
    else if (i < done + failed) status = "failed";
    else if (i < done + failed + running) status = "running";
    else status = "pending";

    const codeCandidates = CODE_MAP.filter((c) => c.status === status);
    const codeDef = codeCandidates[(h >> 15) % codeCandidates.length];

    // 每个子任务生成 1-2 条日志
    const stepCount = status === "success" ? 2 : 1;
    for (let s = 0; s < stepCount; s++) {
      const offset = i * 4 + s;
      const total2 = (bh * 3600 + bm * 60 + bs + offset) % 86400;
      const H = pad(Math.floor(total2 / 3600));
      const M = pad(Math.floor((total2 % 3600) / 60));
      const S = pad(total2 % 60);
      const stepCode = s === 0 && stepCount === 2
        ? CODE_MAP.find((c) => c.code === "BP-2002")!
        : codeDef;
      const content = s === 0 && stepCount === 2
        ? `${platform} · ${reachAccount} 登录态校验通过，准备执行「${eventType}」`
        : status === "success"
          ? `${platform} · ${reachAccount} 完成「${eventType}」（目标：${target}）`
          : status === "failed"
            ? `${platform} · ${reachAccount} 执行「${eventType}」失败：${codeDef.desc}`
            : status === "running"
              ? `${platform} · ${reachAccount} 正在执行「${eventType}」`
              : `${platform} · ${reachAccount} 已排队，等待调度`;
      rows.push({
        id: `${subTaskId}-L${s + 1}`,
        subTaskId,
        reachAccount,
        eventType,
        target,
        platform,
        statusCode: stepCode.code,
        statusCodeDesc: stepCode.desc,
        content,
        ts: `${baseDate} ${H}:${M}:${S}`,
        status: s === 0 && stepCount === 2 ? "success" : status,
      });
    }
  }
  return rows;
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
  const [fPlatform, setFPlatform] = useState<"all" | Platform>("all");
  const [fEvent, setFEvent] = useState<"all" | string>("all");
  const [fCode, setFCode] = useState<"all" | string>("all");
  const [fStatus, setFStatus] = useState<"all" | LogStatus>("all");
  const [fDate, setFDate] = useState<string>("");

  const codeOptions = useMemo(() => Array.from(new Set(logs.map((l) => l.statusCode))).sort(), [logs]);

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return logs.filter((l) => {
      if (k) {
        const hay = [
          l.subTaskId, l.reachAccount, l.eventType, l.platform,
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

  const platformOptions = task.platforms;

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
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={kw} onChange={(e) => { setKw(e.target.value); setPage(1); }}
                placeholder="搜索 子任务ID / 触达账号 / 事件类型 / 状态码描述 / 日志内容" className="h-8 pl-8 text-xs" />
            </div>
            <Select value={fPlatform} onValueChange={(v) => { setFPlatform(v as typeof fPlatform); setPage(1); }}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fEvent} onValueChange={(v) => { setFEvent(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="事件类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部事件</SelectItem>
                {EVENT_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fCode} onValueChange={(v) => { setFCode(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="状态码" /></SelectTrigger>
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
                  <TableHead className="min-w-[200px]">子任务ID</TableHead>
                  <TableHead className="min-w-[140px]">触达账号</TableHead>
                  <TableHead className="w-[110px]">事件类型</TableHead>
                  <TableHead className="w-[110px]">目标</TableHead>
                  <TableHead className="w-[110px]">平台</TableHead>
                  <TableHead className="w-[100px]">状态码</TableHead>
                  <TableHead className="w-[130px]">状态码描述</TableHead>
                  <TableHead className="min-w-[260px]">日志内容</TableHead>
                  <TableHead className="w-[160px]">时间</TableHead>
                  <TableHead className="w-[90px]">状态</TableHead>
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
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{l.subTaskId}</TableCell>
                    <TableCell className="text-sm">{l.reachAccount}</TableCell>
                    <TableCell className="text-sm">{l.eventType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.target}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-normal", PLATFORM_CHIP[l.platform])}>{l.platform}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.statusCode}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.statusCodeDesc}</TableCell>
                    <TableCell className="text-xs text-foreground/90 max-w-[420px] truncate" title={l.content}>{l.content}</TableCell>
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
                          <TooltipContent>查看详情</TooltipContent>
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

      <Dialog open={!!detailLog} onOpenChange={(o) => !o && setDetailLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />日志详情
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span>{detailLog?.id}</span>
              {detailLog && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{detailLog.ts}</span>
                  <Badge variant="outline" className={cn("text-[10px] font-normal", STATUS_CLS[detailLog.status])}>
                    {STATUS_LABEL[detailLog.status]}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">{detailLog.statusCode}</Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailLog && (() => {
            const ext = buildExtended(detailLog);
            const timeline = logs.filter((x) => x.subTaskId === detailLog.subTaskId);
            return (
              <div className="flex-1 overflow-auto space-y-4 pr-1">
                {/* 摘要 */}
                <section className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">执行摘要</div>
                  <div className="text-sm text-foreground leading-relaxed">{detailLog.content}</div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                    <Kv k="子任务" v={detailLog.subTaskId} mono />
                    <Kv k="触达账号" v={detailLog.reachAccount} />
                    <Kv k="平台" v={detailLog.platform} />
                    <Kv k="事件类型" v={detailLog.eventType} />
                    <Kv k="目标" v={detailLog.target} />
                    <Kv k="耗时" v={`${ext.durationMs} ms`} mono />
                    <Kv k="重试次数" v={`${ext.retryCount}`} mono />
                    <Kv k="追踪 ID" v={ext.traceId} mono />
                  </div>
                </section>

                {/* 执行环境 */}
                <section className="rounded-lg border p-3">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">执行环境</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                    <Kv k="执行节点" v={ext.node} mono />
                    <Kv k="镜像实例" v={ext.image} mono />
                    <Kv k="设备指纹" v={ext.device} mono />
                    <Kv k="出口 IP" v={ext.ip} mono />
                    <Kv k="地区" v={ext.region} />
                    <Kv k="User-Agent" v={ext.ua} mono />
                  </div>
                </section>

                {/* 请求 / 响应 */}
                <section className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-[11px] font-medium text-muted-foreground mb-2">请求载荷</div>
                    <pre className="overflow-auto rounded bg-background/60 p-2 font-mono text-[11px] leading-relaxed text-foreground/90">
{JSON.stringify(ext.request, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-[11px] font-medium text-muted-foreground mb-2">响应载荷</div>
                    <pre className={cn(
                      "overflow-auto rounded bg-background/60 p-2 font-mono text-[11px] leading-relaxed",
                      detailLog.status === "failed" ? "text-destructive" : "text-foreground/90",
                    )}>
{JSON.stringify(ext.response, null, 2)}
                    </pre>
                  </div>
                </section>

                {/* 错误堆栈 */}
                {detailLog.status === "failed" && (
                  <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div className="text-[11px] font-medium text-destructive mb-2">错误堆栈</div>
                    <pre className="overflow-auto rounded bg-background/60 p-2 font-mono text-[11px] leading-relaxed text-destructive">
{ext.stack}
                    </pre>
                  </section>
                )}

                {/* 调用链时间轴 */}
                <section className="rounded-lg border p-3">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">
                    子任务调用链 <span className="text-foreground tabular-nums">({timeline.length})</span>
                  </div>
                  <ol className="space-y-2">
                    {timeline.map((row) => {
                      const isCurrent = row.id === detailLog.id;
                      return (
                        <li key={row.id} className={cn(
                          "flex gap-3 rounded-md border p-2 text-xs",
                          isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-background",
                        )}>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{row.ts.slice(11)}</span>
                          <Badge variant="outline" className={cn("shrink-0 font-mono text-[10px]", STATUS_CLS[row.status])}>
                            {row.statusCode}
                          </Badge>
                          <span className="flex-1 text-foreground/90">{row.content}</span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              </div>
            );
          })()}
          <DialogFooter className="border-t pt-3">
            <Button variant="outline" onClick={() => setDetailLog(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}

/* ============================================================ */
/* 详情辅助                                                      */
/* ============================================================ */

function Kv({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={cn("truncate text-foreground", mono && "font-mono text-[11px]")} title={v}>{v}</div>
    </div>
  );
}

const NODES = ["boo-node-shenzhen-01", "boo-node-shanghai-02", "boo-node-beijing-03", "boo-node-hangzhou-04"];
const REGIONS = ["华南-深圳", "华东-上海", "华北-北京", "华东-杭州"];
const UAS = [
  "Mozilla/5.0 (iPhone; iOS 17.4) AppleWebKit/605.1.15 Mobile/15E148",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
];

function buildExtended(l: LogRow) {
  const h = hash(l.id);
  const node = NODES[h % NODES.length];
  const region = REGIONS[h % REGIONS.length];
  const ua = UAS[(h >> 3) % UAS.length];
  const image = `img-${l.platform.toLowerCase()}-${1000 + ((h >> 6) % 200)}`;
  const device = `D-${(h >> 9).toString(16).padStart(8, "0").slice(0, 8)}`;
  const ip = `${10 + (h % 240)}.${(h >> 8) % 256}.${(h >> 12) % 256}.${(h >> 16) % 256}`;
  const duration = l.status === "pending" ? 0 : 200 + ((h >> 18) % 1800);
  const retry = l.status === "failed" ? 1 + ((h >> 4) % 3) : 0;
  const traceId = `tr-${(h >> 1).toString(16).padStart(12, "0").slice(0, 16)}`;

  const request = {
    method: "POST",
    endpoint: `/api/exec/${l.eventType}`,
    headers: {
      "x-trace-id": traceId,
      "x-subtask-id": l.subTaskId,
      "user-agent": ua,
    },
    body: {
      platform: l.platform,
      account: l.reachAccount,
      action: l.eventType,
      target: l.target,
      timeout_ms: 30000,
    },
  };

  const response = l.status === "success"
    ? { code: l.statusCode, message: l.statusCodeDesc, data: { trace_id: traceId, took_ms: duration, affected: 1 } }
    : l.status === "failed"
      ? { code: l.statusCode, message: l.statusCodeDesc, error: { reason: l.statusCodeDesc, retryable: true, retried: retry } }
      : l.status === "running"
        ? { code: l.statusCode, message: l.statusCodeDesc, data: { trace_id: traceId, progress: 0.5 } }
        : { code: l.statusCode, message: l.statusCodeDesc, data: { queued: true } };

  const stack = [
    `BizError: ${l.statusCodeDesc} (${l.statusCode})`,
    `    at Executor.run (executor.ts:128:14)`,
    `    at PlatformAdapter[${l.platform}].invoke (${l.platform.toLowerCase()}.ts:64:9)`,
    `    at SubTaskWorker.process (worker.ts:42:11)`,
    `    at async Scheduler.dispatch (scheduler.ts:96:5)`,
  ].join("\n");

  return { node, region, ua, image, device, ip, durationMs: duration, retryCount: retry, traceId, request, response, stack };
}


import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLATFORM_CHIP, useTasks } from "@/lib/operations-store";
import {
  buildLogs, hash, STATUS_CLS, STATUS_LABEL,
} from "@/lib/task-logs";

export const Route = createFileRoute("/_app/tasks/$taskId/logs/$logId")({
  component: LogDetailPage,
  head: () => ({ meta: [{ title: "日志详情 — BooPilot" }] }),
});

function LogDetailPage() {
  const { taskId, logId } = Route.useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const logs = useMemo(() => (task ? buildLogs(task) : []), [task]);
  const log = useMemo(() => logs.find((l) => l.id === logId), [logs, logId]);

  const backToLogs = () => navigate({ to: "/tasks/$taskId/logs", params: { taskId } });

  if (!task || !log) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={backToLogs}>
          <ArrowLeft className="h-4 w-4" />返回任务日志
        </Button>
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          未找到日志条目 <span className="font-mono">{logId}</span>
        </div>
      </div>
    );
  }

  const h = hash(log.id);
  const traceId = `tr_${(h >>> 0).toString(16).padStart(8, "0")}${log.subTaskId}`;
  const nodes = ["node-sg-01", "node-hk-02", "node-sf-03", "node-tk-04"];
  const node = nodes[h % nodes.length];
  const ip = `10.${(h >> 4) % 256}.${(h >> 8) % 256}.${(h >> 12) % 256}`;
  const durationMs = log.status === "pending" ? 0 : 80 + ((h >> 5) % 1500);
  const retried = log.status === "failed" ? 1 + ((h >> 2) % 3) : 0;
  const requestId = `req_${(h >>> 0).toString(16).padStart(8, "0")}`;
  const userAgent = "BooPilot-Worker/2.4.1 (linux; x64)";

  const request = {
    trace_id: traceId,
    request_id: requestId,
    sub_task_id: log.subTaskId,
    event: log.eventType,
    action: log.actionType,
    platform: log.platform,
    account: log.account,
    target: log.target === "--" ? null : safeParse(log.target),
    dispatched_at: log.ts,
  };

  const response = log.status === "success"
    ? { code: log.statusCode, message: log.statusCodeDesc, data: { took_ms: durationMs, affected: 1 } }
    : log.status === "failed"
      ? { code: log.statusCode, message: log.statusCodeDesc, error: { reason: log.statusCodeDesc, retried, retryable: true } }
      : log.status === "running"
        ? { code: "--", message: "executing", data: { progress: 0.5 } }
        : { code: "--", message: "queued", data: { queued: true } };

  // 同一子任务下的所有事件，构成执行轨迹时间线
  const timeline = logs.filter((l) => l.subTaskId === log.subTaskId);
  const currentIdx = timeline.findIndex((l) => l.id === log.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={backToLogs}>
          <ArrowLeft className="h-4 w-4" />返回任务日志
        </Button>
      </div>

      <header className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">日志详情</h1>
              <Badge variant="outline" className={cn("font-mono text-xs", STATUS_CLS[log.status])}>
                {log.eventType}
              </Badge>
              <Badge variant="outline" className={cn("text-xs font-normal", STATUS_CLS[log.status])}>
                {STATUS_LABEL[log.status]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>日志 ID：<span className="font-mono text-foreground">{log.id}</span></span>
              <span>·</span>
              <span>任务：<span className="font-mono text-foreground">{task.id}</span> {task.name}</span>
              <span>·</span>
              <span>子任务：<span className="font-mono text-foreground">{log.subTaskId}</span></span>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>时间</div>
            <div className="font-mono text-sm text-foreground">{log.ts}</div>
          </div>
        </div>
      </header>

      {/* 元数据 */}
      <section className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3 text-sm font-medium">基本信息</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3 lg:grid-cols-4">
          <Kv k="子任务 ID" v={log.subTaskId} mono />
          <Kv k="触达账号" v={log.account} mono />
          <Kv k="平台">
            <Badge variant="outline" className={cn("text-[10px] font-normal lowercase", PLATFORM_CHIP[log.platformBadge])}>
              {log.platform}
            </Badge>
          </Kv>
          <Kv k="业务动作" v={log.actionType} mono />
          <Kv k="目标" v={log.target} mono />
          <Kv k="Trace ID" v={traceId} mono />
          <Kv k="Request ID" v={requestId} mono />
          <Kv k="执行节点" v={node} mono />
          <Kv k="出口 IP" v={ip} mono />
          <Kv k="耗时" v={`${durationMs} ms`} mono />
          <Kv k="重试次数" v={String(retried)} mono />
          <Kv k="User-Agent" v={userAgent} mono />
        </div>
      </section>

      {/* 状态码 / 错误 */}
      <section className="grid gap-4 md:grid-cols-2">
        {log.status === "failed" ? (
          <>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">错误码</div>
              <div className="mt-1 font-mono text-xl text-destructive">{log.statusCode}</div>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">错误信息</div>
              <div className="mt-1 text-sm text-destructive">{log.statusCodeDesc}</div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">状态码</div>
              <div className="mt-1 font-mono text-xl text-foreground">{log.statusCode}</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">状态码描述</div>
              <div className="mt-1 text-sm text-foreground">{log.statusCodeDesc}</div>
            </div>
          </>
        )}
      </section>

      {/* 日志正文 */}
      <section className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-2 text-sm font-medium">日志内容</div>
        <p className="text-sm leading-relaxed text-foreground">{log.content}</p>
      </section>

      {/* 请求 / 响应载荷 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 text-xs font-medium text-muted-foreground">请求载荷</div>
          <pre className="overflow-auto rounded-md bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
{JSON.stringify(request, null, 2)}
          </pre>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 text-xs font-medium text-muted-foreground">响应载荷</div>
          <pre className={cn(
            "overflow-auto rounded-md bg-muted/40 p-3 font-mono text-[11px] leading-relaxed",
            log.status === "failed" ? "text-destructive" : "text-foreground/90",
          )}>
{JSON.stringify(response, null, 2)}
          </pre>
        </div>
      </section>

      {/* 子任务执行轨迹 */}
      <section className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">同一子任务执行轨迹</div>
          <div className="text-[11px] text-muted-foreground">子任务 <span className="font-mono">{log.subTaskId}</span> 共 {timeline.length} 个事件</div>
        </div>
        <ol className="relative space-y-3 border-l border-border/60 pl-5">
          {timeline.map((ev, i) => {
            const active = i === currentIdx;
            return (
              <li key={ev.id} className="relative">
                <span className={cn(
                  "absolute -left-[26px] top-1.5 inline-block h-2.5 w-2.5 rounded-full border-2 border-card",
                  ev.status === "success" && "bg-success",
                  ev.status === "failed" && "bg-destructive",
                  ev.status === "running" && "bg-primary",
                  ev.status === "pending" && "bg-muted-foreground",
                )} />
                <button
                  onClick={() => navigate({
                    to: "/tasks/$taskId/logs/$logId",
                    params: { taskId, logId: ev.id },
                  })}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition hover:bg-muted/40",
                    active && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{ev.eventType}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-normal", STATUS_CLS[ev.status])}>
                      {STATUS_LABEL[ev.status]}
                    </Badge>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{ev.ts}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{ev.content}</div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Kv({ k, v, mono = false, children }: { k: string; v?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={cn("truncate text-foreground", mono && "font-mono text-[11px]")} title={v}>
        {children ?? v}
      </div>
    </div>
  );
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}

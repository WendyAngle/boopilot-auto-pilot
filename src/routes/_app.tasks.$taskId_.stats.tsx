import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft, BarChart3, CheckCircle2, XCircle, Clock3, Activity,
  ScrollText, Eye, Download, RefreshCw,
  Heart, MessageCircle, Send, UserPlus, Repeat2, Mail, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { PaginationBar } from "@/components/pagination-bar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useTasks, STATUS_LABEL, STATUS_CLS, PLATFORM_CHIP,
  type TaskRow, type Platform,
} from "@/lib/operations-store";

export const Route = createFileRoute("/_app/tasks/$taskId_/stats")({
  component: TaskStatsPage,
  head: () => ({ meta: [{ title: "任务统计详情 — BooPilot" }] }),
});

// ---------- 共用：分布生成（与 tasks.list 保持一致逻辑） ----------
type DistRow = { label: string; success: number; failed: number };

function buildDist(t: TaskRow, dim: "platform" | "reach" | "action"): DistRow[] {
  const seed = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const rng = (key: string) => (seed(`${t.id}|${dim}|${key}`) % 1000) / 1000;
  let labels: string[] = [];
  if (dim === "platform") labels = [...t.platforms];
  else if (dim === "action") labels = ["点赞", "评论", "发帖", "关注", "转发", "私信"];
  else labels = ["主账号", "矩阵号", "合作号", "外联号"];
  const weights = labels.map((l) => 0.6 + rng(l) * 0.8);
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const rows: DistRow[] = labels.map((l, i) => {
    const share = weights[i] / wSum;
    return { label: l, success: Math.round(t.done * share), failed: Math.round(t.failed * share) };
  });
  const adjust = (key: "success" | "failed", target: number) => {
    let diff = target - rows.reduce((a, r) => a + r[key], 0);
    let i = 0;
    while (diff !== 0 && rows.length > 0) {
      const r = rows[i % rows.length];
      if (diff > 0) { r[key] += 1; diff -= 1; }
      else if (r[key] > 0) { r[key] -= 1; diff += 1; }
      i += 1;
      if (i > rows.length * 10) break;
    }
  };
  adjust("success", t.done);
  adjust("failed", t.failed);
  return rows;
}

// ---------- 子任务（构成明细）模拟数据 ----------
type SubResult = "success" | "failed" | "running" | "pending";
type SubRow = {
  id: string;
  account: string;
  platform: Platform;
  action: string;
  result: SubResult;
  duration: string;
  startedAt: string;
  message: string;
};

const ACTIONS = ["点赞", "评论", "发帖", "关注", "转发", "私信"];

function buildSubRows(t: TaskRow): SubRow[] {
  const platforms = t.platforms.length ? t.platforms : (["Facebook"] as Platform[]);
  const rows: SubRow[] = [];
  const baseTime = t.createdAt.slice(11) || "10:00:00";
  const [hh, mm, ss] = baseTime.split(":").map(Number);
  const fmt = (offset: number) => {
    const total = (hh * 3600 + mm * 60 + ss + offset) % 86400;
    const H = String(Math.floor(total / 3600)).padStart(2, "0");
    const M = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const S = String(total % 60).padStart(2, "0");
    return `${t.createdAt.slice(0, 10)} ${H}:${M}:${S}`;
  };
  const total = Math.max(t.total, t.done + t.failed);
  for (let i = 0; i < total; i++) {
    const isFailed = i < t.failed;
    const isSuccess = i >= t.failed && i < t.failed + t.done;
    const result: SubResult = isFailed ? "failed" : isSuccess ? "success" : t.status === "running" ? "running" : "pending";
    rows.push({
      id: `sub-${t.id}-${String(i + 1).padStart(3, "0")}`,
      account: `acc-${1000 + i}`,
      platform: platforms[i % platforms.length],
      action: ACTIONS[i % ACTIONS.length],
      result,
      duration: `${(1.2 + (i % 5) * 0.4).toFixed(1)}s`,
      startedAt: fmt(i * 3),
      message: isFailed
        ? "登录态过期"
        : isSuccess
          ? "执行成功"
          : result === "running"
            ? "执行中…"
            : "排队中",
    });
  }
  return rows;
}
const ACTION_ICON: Record<string, typeof Heart> = {
  点赞: Heart, 评论: MessageCircle, 发帖: FileText, 关注: UserPlus, 转发: Repeat2, 私信: Mail,
};
const ACTION_TONE: Record<string, string> = {
  点赞: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  评论: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  发帖: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  关注: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  转发: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  私信: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
};

// ---------- 贴文（对象）维度模拟数据 ----------
type PostActionStat = { action: string; success: number; failed: number };
type PostRow = {
  id: string;
  title: string;
  platform: Platform;
  author: string;
  publishedAt: string;
  metrics: { views: number; likes: number; comments: number; shares: number };
  actions: PostActionStat[];
};

const POST_TITLES = [
  "新品发布｜夏季限定上新预告",
  "用户故事 · 来自纽约的Lily",
  "幕后花絮：拍摄日的一天",
  "限时活动：转发抽奖即将开始",
  "深度长文｜如何挑选最适合你的款式",
  "客户好评合集 · 五星反馈",
  "团队招募：我们在找你",
  "节日特辑：感恩季福利清单",
  "教程 | 三步搞定爆款短视频",
  "对比评测：A 款 vs B 款",
  "用户问答 · 本周精选",
  "门店探访：上海旗舰店开业",
  "联名预告：与 XX 品牌的故事",
  "复盘报告：618 战绩公开",
  "粉丝彩蛋｜免费壁纸下载",
  "热点追踪：行业最新趋势",
];

function buildPosts(t: TaskRow): PostRow[] {
  const platforms = t.platforms.length ? t.platforms : (["Facebook"] as Platform[]);
  const seed = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const count = Math.max(8, Math.min(40, Math.ceil(t.total / 6)));
  const allActions = ["点赞", "评论", "发帖", "关注", "转发", "私信"];
  const rows: PostRow[] = [];
  for (let i = 0; i < count; i++) {
    const r = (k: string) => (seed(`${t.id}|p${i}|${k}`) % 1000) / 1000;
    const actionCount = 2 + Math.floor(r("ac") * 4);
    const picked = allActions.slice(0, actionCount);
    const wSum = picked.reduce((a, _, idx) => a + (0.5 + r(`w${idx}`)), 0) || 1;
    const actions = picked.map((a, idx) => {
      const share = (0.5 + r(`w${idx}`)) / wSum;
      const s = Math.max(0, Math.round(t.done * share / count));
      const f = Math.max(0, Math.round(t.failed * share / count));
      return { action: a, success: s, failed: f };
    });
    rows.push({
      id: `post-${t.id}-${String(i + 1).padStart(2, "0")}`,
      title: POST_TITLES[i % POST_TITLES.length] + (i >= POST_TITLES.length ? ` #${Math.floor(i / POST_TITLES.length) + 1}` : ""),
      platform: platforms[i % platforms.length],
      author: `@brand_${1 + (i % 3)}`,
      publishedAt: `${t.createdAt.slice(0, 10)} ${String(8 + i).padStart(2, "0")}:0${i % 6}`,
      metrics: {
        views: Math.round(1000 + r("v") * 12000),
        likes: Math.round(50 + r("l") * 800),
        comments: Math.round(10 + r("c") * 200),
        shares: Math.round(5 + r("sh") * 120),
      },
      actions,
    });
  }
  return rows;
}


const RESULT_LABEL: Record<SubResult, string> = {
  success: "成功", failed: "失败", running: "进行中", pending: "等待中",
};
const RESULT_CLS: Record<SubResult, string> = {
  success: "bg-success/10 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  running: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
};

// ---------- 分布列表 ----------
function DistList({ rows }: { rows: DistRow[] }) {
  if (rows.length === 0) {
    return <div className="py-6 text-center text-xs text-muted-foreground">暂无数据</div>;
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const total = r.success + r.failed;
        const sPct = total ? (r.success / total) * 100 : 0;
        const fPct = total ? (r.failed / total) * 100 : 0;
        return (
          <div key={r.label} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 truncate" title={r.label}>{r.label}</span>
            <div className="flex h-2.5 flex-1 overflow-hidden rounded bg-muted">
              <div className="h-full bg-success" style={{ width: `${sPct}%` }} />
              <div className="h-full bg-destructive" style={{ width: `${fPct}%` }} />
            </div>
            <span className="w-52 shrink-0 text-right tabular-nums text-muted-foreground">
              <span className="text-success">{r.success}</span>
              <span className="mx-0.5">/</span>
              <span className="text-destructive">{r.failed}</span>
              <span className="mx-0.5">/</span>
              <span className="text-foreground">{total}</span>
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

// ---------- 贴文表格行 ----------
function PostTableRow({ post }: { post: PostRow }) {
  const totalHit = post.actions.reduce((a, b) => a + b.success + b.failed, 0);
  const totalOk = post.actions.reduce((a, b) => a + b.success, 0);
  const rate = totalHit ? Math.round((totalOk / totalHit) * 100) : 0;
  return (
    <TableRow>
      <TableCell className="max-w-[280px]">
        <p className="truncate text-xs font-medium text-foreground" title={post.title}>{post.title}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{post.id} · {post.author}</p>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("h-5 px-1.5", PLATFORM_CHIP[post.platform])}>{post.platform}</Badge>
      </TableCell>
      <TableCell className="text-[11px] tabular-nums text-muted-foreground">{post.publishedAt}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {post.actions.map((a) => {
            const Icon = ACTION_ICON[a.action] ?? Activity;
            return (
              <span key={a.action} className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums", ACTION_TONE[a.action])}>
                <Icon className="h-3 w-3" />{a.action}
                <span className="text-success">{a.success}</span>
                {a.failed > 0 && <><span className="opacity-50">/</span><span className="text-destructive">{a.failed}</span></>}
              </span>
            );
          })}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span className={cn("text-xs font-semibold", rate >= 90 ? "text-success" : rate >= 70 ? "text-warning" : "text-destructive")}>{rate}%</span>
      </TableCell>
      <TableCell className="text-right text-[11px] tabular-nums text-muted-foreground">
        <div>浏览 <b className="text-foreground">{post.metrics.views.toLocaleString()}</b></div>
        <div>赞 {post.metrics.likes} · 评 {post.metrics.comments} · 转 {post.metrics.shares}</div>
      </TableCell>
      <TableCell className="text-center">
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => toast.message(`贴文 ${post.id} 详情开发中`)}>
          <Eye className="h-3.5 w-3.5" />详情
        </Button>
      </TableCell>
    </TableRow>
  );
}


// ---------- 主页面 ----------
const PAGE_SIZE = 10;

function TaskStatsPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

  const [filterResult, setFilterResult] = useState<"all" | SubResult>("all");
  const [filterPlatform, setFilterPlatform] = useState<"all" | Platform>("all");
  const [page, setPage] = useState(1);

  const subRows = useMemo(() => (task ? buildSubRows(task) : []), [task]);
  const filtered = useMemo(() => subRows.filter((r) =>
    (filterResult === "all" || r.result === filterResult) &&
    (filterPlatform === "all" || r.platform === filterPlatform)
  ), [subRows, filterResult, filterPlatform]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!task) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/tasks/list" })}>
          <ArrowLeft className="h-4 w-4" />返回任务列表
        </Button>
        <div className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
          未找到任务 <span className="font-mono">{taskId}</span>
        </div>
      </div>
    );
  }

  const successRate = task.total ? Math.round((task.done / task.total) * 100) : 0;
  const platformRows = buildDist(task, "platform");
  const reachRows = buildDist(task, "reach");
  const actionRows = buildDist(task, "action");
  const posts = buildPosts(task);

  return (
    <div className="space-y-4 p-6">
      {/* 顶部：返回 + 标题 + 操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/tasks/list" })}>
            <ArrowLeft className="h-4 w-4" />返回
          </Button>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-lg font-semibold text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              统计详情 · {task.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{task.id}</span>
              <Badge variant="outline" className={cn("h-5 px-1.5", STATUS_CLS[task.status])}>
                {STATUS_LABEL[task.status]}
              </Badge>
              {task.platforms.map((p) => (
                <Badge key={p} variant="outline" className={cn("h-5 px-1.5", PLATFORM_CHIP[p])}>{p}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("已刷新")}>
            <RefreshCw className="h-4 w-4" />刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.message("导出功能开发中")}>
            <Download className="h-4 w-4" />导出
          </Button>
          <Link to="/tasks/$taskId/logs" params={{ taskId: task.id }}>
            <Button variant="default" size="sm">
              <ScrollText className="h-4 w-4" />查看执行日志
            </Button>
          </Link>
        </div>
      </div>

      {/* A. KPI Hero */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="总计" value={task.total} icon={Activity} tone="primary" />
        <StatCard title="执行成功" value={task.done} icon={CheckCircle2} tone="success" />
        <StatCard title="执行失败" value={task.failed} icon={XCircle} tone="destructive" />
        <StatCard title="成功率" value={`${successRate}%`} icon={BarChart3} tone={successRate >= 90 ? "success" : successRate >= 70 ? "warning" : "destructive"} />
        <StatCard title="平均耗时" value="2.4s" icon={Clock3} tone="muted" />
        <StatCard title="峰值并发" value={12} icon={Activity} tone="violet" />
      </div>

      {/* B. 维度拆解 */}
      <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">维度拆解</h2>
            <p className="text-xs text-muted-foreground">按不同维度查看成功 / 失败构成</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-success" />成功</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-destructive" />失败</span>
          </div>
        </div>
        <Tabs defaultValue="platform">
          <TabsList className="h-8">
            <TabsTrigger value="platform" className="text-xs">按平台分布</TabsTrigger>
            <TabsTrigger value="reach" className="text-xs">按账号分布</TabsTrigger>
            <TabsTrigger value="action" className="text-xs">按操作分布</TabsTrigger>
          </TabsList>
          <TabsContent value="platform" className="mt-3"><DistList rows={platformRows} /></TabsContent>
          <TabsContent value="reach" className="mt-3"><DistList rows={reachRows} /></TabsContent>
          <TabsContent value="action" className="mt-3"><DistList rows={actionRows} /></TabsContent>
        </Tabs>
      </div>

      {/* C. 贴文维度 */}
      <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">贴文维度</h2>
            <p className="text-xs text-muted-foreground">按贴文/对象聚合，展示每条贴文命中的动作与互动数据</p>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">共 {posts.length} 条</span>
        </div>
        {posts.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">暂无贴文数据</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </div>

      {/* D. 构成明细 */}
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">子任务明细</h2>
            <p className="text-xs text-muted-foreground">每个子任务的执行结果，点击「日志」可查看 Trace</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={filterResult} onValueChange={(v) => { setFilterResult(v as "all" | SubResult); setPage(1); }}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
                <TabsTrigger value="success" className="text-xs">成功</TabsTrigger>
                <TabsTrigger value="failed" className="text-xs">失败</TabsTrigger>
                <TabsTrigger value="running" className="text-xs">进行中</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">等待中</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={filterPlatform} onValueChange={(v) => { setFilterPlatform(v as "all" | Platform); setPage(1); }}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">全平台</TabsTrigger>
                {task.platforms.map((p) => (
                  <TabsTrigger key={p} value={p} className="text-xs">{p}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">子任务 ID</TableHead>
                <TableHead className="text-xs">账号</TableHead>
                <TableHead className="text-xs">平台</TableHead>
                <TableHead className="text-xs">操作</TableHead>
                <TableHead className="text-xs">结果</TableHead>
                <TableHead className="text-xs">耗时</TableHead>
                <TableHead className="text-xs">开始时间</TableHead>
                <TableHead className="text-xs">说明</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-xs text-muted-foreground">
                    暂无匹配数据
                  </TableCell>
                </TableRow>
              ) : pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{r.id}</TableCell>
                  <TableCell className="text-xs">{r.account}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("h-5 px-1.5", PLATFORM_CHIP[r.platform])}>{r.platform}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.action}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("h-5 px-1.5", RESULT_CLS[r.result])}>{RESULT_LABEL[r.result]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{r.duration}</TableCell>
                  <TableCell className="text-[11px] tabular-nums text-muted-foreground">{r.startedAt}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" title={r.message}>{r.message}</TableCell>
                  <TableCell className="text-center">
                    <Link to="/tasks/$taskId/logs/sub/$subId" params={{ taskId: task.id, subId: r.id }}>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
                        <Eye className="h-3.5 w-3.5" />日志
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} total={filtered.length} setPage={setPage} />
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, BarChart3, CheckCircle2, XCircle, Clock3, Activity,
  Eye,
  Heart, MessageCircle, UserPlus, Repeat2, Mail, FileText,
  Sparkles, BookOpen, ExternalLink, Undo2,
  Image as ImageIcon, Video, MapPin, Hash, Bookmark, Share2, Link2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/stat-card";
import { PaginationBar } from "@/components/pagination-bar";
import { cn } from "@/lib/utils";

import {
  useTasks, STATUS_LABEL, STATUS_CLS, PLATFORM_CHIP,
  type TaskRow, type Platform,
} from "@/lib/operations-store";
import { buildPosts, type PostRow, type PostMedia } from "@/lib/post-stats";

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
  兴趣分析: Sparkles, 浏览阅读: BookOpen, 打开贴文: ExternalLink, 返回流程主页面: Undo2,
};
const ACTION_TONE: Record<string, string> = {
  点赞: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  评论: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  发帖: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  关注: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  转发: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  私信: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  兴趣分析: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30",
  浏览阅读: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  打开贴文: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  返回流程主页面: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

// ---------- 贴文（对象）维度模拟数据 ----------
// ---------- 贴文（对象）维度类型与数据生成已抽出到 src/lib/post-stats.ts ----------



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
function PostTableRow({ post, onView }: { post: PostRow; onView: (p: PostRow) => void }) {
  return (
    <TableRow>
      <TableCell className="max-w-[280px]">
        <p className="truncate text-xs font-medium text-foreground" title={post.title}>{post.title}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{post.id} · {post.authorHandle}</p>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("h-5 px-1.5", PLATFORM_CHIP[post.platform])}>{post.platform}</Badge>
      </TableCell>
      <TableCell className="text-[11px] tabular-nums text-muted-foreground">{post.publishedAt}</TableCell>
      <TableCell className="text-[11px] tabular-nums text-muted-foreground">{post.ingestedAt}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {post.actions.map((a, idx) => {
            const Icon = ACTION_ICON[a.action] ?? Activity;
            const tone = a.ok
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-600 border-amber-500/30";
            return (
              <span key={`${a.action}-${idx}`} className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]", tone)}>
                <Icon className="h-3 w-3" />{a.action}
              </span>
            );
          })}
        </div>
      </TableCell>
      <TableCell className="text-right text-[11px] tabular-nums text-muted-foreground">
        <div>浏览 <b className="text-foreground">{post.metrics.views.toLocaleString()}</b></div>
        <div>赞 {post.metrics.likes} · 评 {post.metrics.comments} · 转 {post.metrics.shares}</div>
      </TableCell>
      <TableCell className="text-center">
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(post)}>
          <Eye className="h-3.5 w-3.5" />详情
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ---------- 贴文详情弹窗 ----------
const RATIO_CLS: Record<PostMedia["ratio"], string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
};

function PostDetailDialog({ post, onOpenChange }: { post: PostRow | null; onOpenChange: (open: boolean) => void }) {
  if (!post) return null;
  const totalOk = post.actions.filter((a) => a.ok).length;
  const totalFail = post.actions.length - totalOk;
  return (
    <Dialog open={!!post} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("h-5 px-1.5", PLATFORM_CHIP[post.platform])}>{post.platform}</Badge>
            <span className="font-mono text-[10px] text-muted-foreground">{post.id}</span>
          </div>
          <DialogTitle className="mt-1 text-base">{post.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-foreground">{post.author} <span className="text-muted-foreground">{post.authorHandle}</span></span>
            <span className="text-muted-foreground">粉丝 {post.authorFollowers.toLocaleString()}</span>
            <span className="text-muted-foreground">· 发布 {post.publishedAt}</span>
            <span className="text-muted-foreground">· 入库 {post.ingestedAt}</span>
            {post.location && (
              <span className="inline-flex items-center gap-0.5 text-muted-foreground"><MapPin className="h-3 w-3" />{post.location}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 px-6 pb-4">
            <div className={cn("grid gap-2", post.media.length === 1 ? "grid-cols-1" : post.media.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {post.media.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative overflow-hidden rounded-lg border bg-muted",
                    post.media.length === 1 ? RATIO_CLS[m.ratio] : "aspect-square",
                  )}
                  style={{ background: `linear-gradient(135deg, hsl(${m.hue} 70% 65%), hsl(${(m.hue + 60) % 360} 70% 55%))` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white/85">
                    {m.type === "video" ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
                  </div>
                  {m.type === "video" && m.duration && (
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
                      {m.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="whitespace-pre-line text-xs leading-relaxed text-foreground">{post.content}</div>

            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((h) => (
                  <span key={h} className="inline-flex items-center gap-0.5 rounded-md border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <Hash className="h-3 w-3" />{h}
                  </span>
                ))}
              </div>
            )}

            <a
              href={post.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <Link2 className="h-3 w-3" />原帖链接
            </a>

            <Separator />

            <div>
              <h4 className="mb-2 text-xs font-semibold text-foreground">互动数据</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { label: "浏览", value: post.metrics.views, icon: Eye, tone: "text-foreground" },
                  { label: "点赞", value: post.metrics.likes, icon: Heart, tone: "text-rose-600" },
                  { label: "评论", value: post.metrics.comments, icon: MessageCircle, tone: "text-sky-600" },
                  { label: "转发", value: post.metrics.shares, icon: Share2, tone: "text-amber-600" },
                  { label: "收藏", value: post.metrics.saves, icon: Bookmark, tone: "text-violet-600" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <m.icon className={cn("h-3 w-3", m.tone)} />{m.label}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {m.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">本系统执行操作</h4>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  <span className="text-success">成功 {totalOk}</span>
                  <span className="mx-1">·</span>
                  <span className="text-destructive">失败 {totalFail}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {post.actions.map((a, idx) => {
                  const Icon = ACTION_ICON[a.action] ?? Activity;
                  const tone = a.ok
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/30";
                  return (
                    <span key={`${a.action}-${idx}`} className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]", tone)}>
                      <Icon className="h-3 w-3" />
                      <span>{a.action}</span>
                      <span className="ml-0.5 opacity-80">· {a.ok ? "成功" : "失败"}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>关闭</Button>
          <Button size="sm" asChild>
            <a href={post.url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />前往原帖
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  // 贴文区域 state
  const [postQuery, setPostQuery] = useState("");
  const [postPlatform, setPostPlatform] = useState<"all" | Platform>("all");
  const [postSort, setPostSort] = useState<"recent" | "rate-desc" | "rate-asc" | "hits-desc">("recent");
  const [postPage, setPostPage] = useState(1);
  const [openedPost, setOpenedPost] = useState<PostRow | null>(null);

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

  // 贴文聚合 KPI + 过滤排序
  const postSummary = posts.reduce(
    (a, p) => {
      const ok = p.actions.filter((x) => x.ok).length;
      const fail = p.actions.length - ok;
      a.ok += ok; a.fail += fail; a.hit += p.actions.length;
      return a;
    },
    { ok: 0, fail: 0, hit: 0 },
  );
  const postAvgRate = postSummary.hit ? Math.round((postSummary.ok / postSummary.hit) * 100) : 0;

  const filteredPosts = posts
    .filter((p) =>
      (postPlatform === "all" || p.platform === postPlatform) &&
      (postQuery.trim() === "" ||
        p.title.toLowerCase().includes(postQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(postQuery.toLowerCase()) ||
        p.authorHandle.toLowerCase().includes(postQuery.toLowerCase())),
    )
    .sort((a, b) => {
      const hits = (x: PostRow) => x.actions.length;
      const rate = (x: PostRow) => {
        const h = hits(x);
        const ok = x.actions.filter((y) => y.ok).length;
        return h ? ok / h : 0;
      };
      if (postSort === "rate-desc") return rate(b) - rate(a);
      if (postSort === "rate-asc") return rate(a) - rate(b);
      if (postSort === "hits-desc") return hits(b) - hits(a);
      return b.publishedAt.localeCompare(a.publishedAt);
    });
  const postTotalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const postPageRows = filteredPosts.slice((postPage - 1) * PAGE_SIZE, postPage * PAGE_SIZE);

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
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">贴文维度</h2>
            <p className="text-xs text-muted-foreground">按贴文聚合，展示每条贴文命中的动作与互动数据</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground tabular-nums">
            <span>贴文 <b className="text-foreground">{posts.length}</b></span>
            <span>命中 <b className="text-foreground">{postSummary.hit}</b></span>
            <span>成功 <b className="text-success">{postSummary.ok}</b></span>
            <span>失败 <b className="text-destructive">{postSummary.fail}</b></span>
            <span>平均命中率 <b className={cn(postAvgRate >= 90 ? "text-success" : postAvgRate >= 70 ? "text-warning" : "text-destructive")}>{postAvgRate}%</b></span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
          <Input
            value={postQuery}
            onChange={(e) => { setPostQuery(e.target.value); setPostPage(1); }}
            placeholder="搜索贴文标题 / ID / 作者"
            className="h-8 w-64 text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={postPlatform} onValueChange={(v) => { setPostPlatform(v as "all" | Platform); setPostPage(1); }}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">全平台</TabsTrigger>
                {task.platforms.map((p) => (
                  <TabsTrigger key={p} value={p} className="text-xs">{p}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Tabs value={postSort} onValueChange={(v) => setPostSort(v as typeof postSort)}>
              <TabsList className="h-8">
                <TabsTrigger value="recent" className="text-xs">最新</TabsTrigger>
                <TabsTrigger value="rate-desc" className="text-xs">命中率↓</TabsTrigger>
                <TabsTrigger value="rate-asc" className="text-xs">命中率↑</TabsTrigger>
                <TabsTrigger value="hits-desc" className="text-xs">命中数↓</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">贴文</TableHead>
                <TableHead className="text-xs">平台</TableHead>
                <TableHead className="text-xs">发布时间</TableHead>
                <TableHead className="text-xs">入库时间</TableHead>
                <TableHead className="text-xs">执行操作</TableHead>
                <TableHead className="text-right text-xs">互动</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postPageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                    暂无匹配贴文
                  </TableCell>
                </TableRow>
              ) : postPageRows.map((p) => <PostTableRow key={p.id} post={p} onView={setOpenedPost} />)}
            </TableBody>
          </Table>
        </div>
        <PaginationBar page={postPage} totalPages={postTotalPages} total={filteredPosts.length} setPage={setPostPage} />
      </div>

      <PostDetailDialog post={openedPost} onOpenChange={(o) => { if (!o) setOpenedPost(null); }} />
    </div>
  );
}

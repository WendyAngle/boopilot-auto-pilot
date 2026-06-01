import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  FileEdit,
  MessageSquare,
  Send,
  Eye,
  Repeat2,
  ThumbsUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "工作台 — BooPilot" },
      { name: "description", content: "BooPilot 业务运营自动驾驶工作台" },
    ],
  }),
});

const stats = [
  {
    label: "活跃账号",
    value: "1,284",
    sub: "近 7 日有任务执行记录的账号",
    delta: "+8.2%",
    up: true,
    icon: Users,
    color: "oklch(0.68 0.20 290)",
  },
  {
    label: "风控告警",
    value: "2",
    sub: "账号状态=风控 / 封号 的账号数",
    delta: "+2",
    up: false,
    icon: ShieldAlert,
    color: "oklch(0.72 0.18 50)",
  },
];

const actionStats = [
  {
    label: "发帖",
    value: "326",
    sub: "今日执行 / 累计 12,480",
    delta: "+12.4%",
    up: true,
    icon: FileEdit,
    color: "oklch(0.68 0.16 220)",
  },
  {
    label: "评论",
    value: "1,058",
    sub: "今日执行 / 累计 42,310",
    delta: "+8.7%",
    up: true,
    icon: MessageSquare,
    color: "oklch(0.70 0.15 160)",
  },
  {
    label: "私信",
    value: "412",
    sub: "今日执行 / 累计 18,902",
    delta: "+3.2%",
    up: true,
    icon: Send,
    color: "oklch(0.68 0.18 260)",
  },
  {
    label: "浏览",
    value: "8,920",
    sub: "今日执行 / 累计 268,401",
    delta: "+15.6%",
    up: true,
    icon: Eye,
    color: "oklch(0.72 0.14 200)",
  },
  {
    label: "转载",
    value: "234",
    sub: "今日执行 / 累计 9,672",
    delta: "-2.1%",
    up: false,
    icon: Repeat2,
    color: "oklch(0.70 0.16 30)",
  },
  {
    label: "点赞",
    value: "3,287",
    sub: "今日执行 / 累计 124,580",
    delta: "+9.8%",
    up: true,
    icon: ThumbsUp,
    color: "oklch(0.72 0.18 350)",
  },
];

const chartData = [
  { date: "5/20", 注册: 22, 周期: 30, 单次: 38 },
  { date: "5/21", 注册: 24, 周期: 28, 单次: 32 },
  { date: "5/22", 注册: 26, 周期: 27, 单次: 30 },
  { date: "5/23", 注册: 23, 周期: 32, 单次: 24 },
  { date: "5/24", 注册: 25, 周期: 35, 单次: 22 },
  { date: "5/25", 注册: 24, 周期: 36, 单次: 26 },
  { date: "5/26", 注册: 23, 周期: 33, 单次: 32 },
];

const todos = [
  { tag: "风控", tone: "destructive", title: "账号 #1001 风控异常", sub: "Facebook · 张三 · 状态：风控" },
  { tag: "失败", tone: "warning", title: "任务 #204683 执行失败", sub: "运营任务 · 连续失败 3 次" },
  { tag: "同步", tone: "info", title: "智能体 A-1003 待同步", sub: "同步状态：异常" },
];

const recent = [
  { who: "运营A", what: "创建了任务", target: "春节营销活动", time: "2 分钟前" },
  { who: "运营B", what: "上传了素材", target: "图文 ×12", time: "10 分钟前" },
  { who: "系统", what: "同步完成", target: "目标账号 ×48", time: "32 分钟前" },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card
        className="relative overflow-hidden border-0 p-8 shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            你好，欢迎回到{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              BooPilot
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            把自动驾驶的体验带给业务运营 —— 这里是你的业务工作台，快速掌握触达、任务、账号与风控的实时动态。
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="group relative overflow-hidden p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: s.color }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <Badge
                variant="outline"
                className={
                  s.up
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }
              >
                {s.up ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {s.delta}
              </Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 text-sm font-medium">{s.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Action Stats */}
      <Card className="p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">动作执行统计</h2>
          <span className="text-xs text-muted-foreground">今日数据 · 含累计趋势</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {actionStats.map((s) => (
            <div
              key={s.label}
              className="group rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ background: s.color }}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    s.up
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }
                >
                  {s.up ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {s.delta}
                </Badge>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                {s.value}
              </div>
              <div className="mt-0.5 text-sm font-medium">{s.label}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </Card>


      {/* Chart + Todos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">核心趋势</h2>
            </div>
            <div className="flex gap-1 rounded-md bg-muted p-1 text-xs">
              {["近一天", "近一周", "近两周", "近一月"].map((t, i) => (
                <button
                  key={t}
                  className={`rounded px-3 py-1 transition-colors ${
                    i === 1
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {["注册", "周期", "单次"].map((k, i) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={`var(--chart-${i + 1})`}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--chart-${i + 1})`}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="注册" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g-注册)" />
                <Area type="monotone" dataKey="周期" stroke="var(--chart-2)" strokeWidth={2} fill="url(#g-周期)" />
                <Area type="monotone" dataKey="单次" stroke="var(--chart-3)" strokeWidth={2} fill="url(#g-单次)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">待处理事项</h2>
            <Badge variant="secondary">{todos.length}</Badge>
          </div>
          <div className="space-y-3">
            {todos.map((t) => (
              <div
                key={t.title}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <Badge
                  className={
                    t.tone === "destructive"
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
                      : t.tone === "warning"
                        ? "bg-warning/15 text-warning-foreground hover:bg-warning/20"
                        : "bg-info/10 text-info hover:bg-info/15"
                  }
                  variant="secondary"
                >
                  {t.tag}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent */}
      <Card className="p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-base font-semibold">最近动态</h2>
        <div className="space-y-3">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                {r.who[2] ?? r.who[0]}
              </div>
              <div className="flex-1">
                <span className="font-medium">{r.who}</span>
                <span className="text-muted-foreground"> {r.what} </span>
                <span className="font-medium text-primary">「{r.target}」</span>
              </div>
              <span className="text-xs text-muted-foreground">{r.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

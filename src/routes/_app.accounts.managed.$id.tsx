import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  Phone,
  Video,
  Search as SearchIcon,
  Bell,
  Image as ImageIcon,
  Lock,
  Clock,
  Ban,
  ThumbsDown,
  Play,
  MessageSquare,
  Repeat2,
  Heart,
  BarChart3,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  findManagedAccountById,
  type ManagedAccount,
  type Platform,
  ACCOUNT_STATUS_META,
} from "@/lib/managed-account-mock";

export const Route = createFileRoute("/_app/accounts/managed/$id")({
  component: ManagedAccountDetailPage,
  head: () => ({ meta: [{ title: "托管账号详情 — BooPilot" }] }),
});

function ManagedAccountDetailPage() {
  const { id } = useParams({ from: "/_app/accounts/managed/$id" });
  const account = findManagedAccountById(id);

  if (!account) {
    return (
      <div className="space-y-4">
        <BackBar />
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          未找到对应的托管账号
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackBar />
      <DetailHeader account={account} />
      <PlatformPreview account={account} />
    </div>
  );
}

function BackBar() {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" asChild>
        <Link to="/accounts/managed">
          <ArrowLeft className="h-4 w-4" />
          返回托管账号列表
        </Link>
      </Button>
    </div>
  );
}

function DetailHeader({ account }: { account: ManagedAccount }) {
  const sm = ACCOUNT_STATUS_META[account.accountStatus];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <PlatformIcon platform={account.platform} />
        <span className="font-semibold">{account.platform}</span>
        <span className="text-muted-foreground">个人主页预览</span>
        <Badge
          variant="outline"
          className="bg-violet-500/10 text-violet-600 border-violet-300/40 text-[10px]"
        >
          托管账号
        </Badge>
        <Badge variant="outline" className={cn("rounded-full text-[10px]", sm.cls)}>
          {sm.label}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          平台ID：<span className="font-mono text-foreground">{account.platformId}</span>
        </span>
        <span>
          添加时间：<span className="text-foreground">{account.createdAt.slice(0, 10)}</span>
        </span>
        <span>
          最后同步：<span className="text-foreground">{account.createdAt}</span>
        </span>
      </div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: Platform }) {
  const meta: Record<
    Platform,
    { bg: string; text: string; letter: string }
  > = {
    Facebook: { bg: "bg-blue-600", text: "text-white", letter: "f" },
    Tiktok: { bg: "bg-foreground", text: "text-background", letter: "♪" },
    Instagram: {
      bg: "bg-gradient-to-br from-pink-500 to-yellow-400",
      text: "text-white",
      letter: "◉",
    },
    "Twitter/X": { bg: "bg-foreground", text: "text-background", letter: "𝕏" },
    WhatsApp: { bg: "bg-emerald-500", text: "text-white", letter: "✆" },
  };
  const m = meta[platform];
  return (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        m.bg,
        m.text,
      )}
    >
      {m.letter}
    </span>
  );
}

/* =================== 平台差异化预览 =================== */

function PlatformPreview({ account }: { account: ManagedAccount }) {
  switch (account.platform) {
    case "Facebook":
      return <FacebookPreview account={account} />;
    case "Tiktok":
      return <TiktokPreview account={account} />;
    case "Instagram":
      return <InstagramPreview account={account} />;
    case "Twitter/X":
      return <TwitterPreview account={account} />;
    case "WhatsApp":
      return <WhatsAppPreview account={account} />;
  }
}

/* ---------------- Facebook ---------------- */
function FacebookPreview({ account }: { account: ManagedAccount }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-700" />
      <div className="relative px-6 pb-4">
        <div className="-mt-16 flex items-end gap-4">
          <Avatar className="h-32 w-32 ring-4 ring-card">
            <AvatarImage src={account.avatar} />
            <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-2">
            <h2 className="text-2xl font-bold">{account.username}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {account.followers.toLocaleString()} 好友 · {account.likes.toLocaleString()} 关注者
            </p>
            <div className="mt-2 flex -space-x-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full bg-muted ring-2 ring-card"
                />
              ))}
            </div>
          </div>


        </div>
        <div className="mt-4 flex gap-6 border-b text-sm font-medium">
          {["动态", "关于", "好友", "照片", "视频", "更多"].map((t, i) => (
            <button
              key={t}
              className={cn(
                "px-1 py-3",
                i === 0 ? "border-b-2 border-primary text-primary" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 px-6 pb-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <h3 className="text-base font-semibold">简介</h3>
            <p className="mt-2 text-sm">{account.remark === "--" ? "暂无简介" : account.remark}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> 居住于 {account.country}
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> 加入于 {account.createdAt.slice(0, 10)}
              </li>
              <li className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> facebook.com/{account.platformId}
              </li>
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">照片</h3>
              <a className="text-xs text-primary">查看全部</a>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account.avatar} />
                  <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{account.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {i === 0 ? "2 小时前" : "昨天"} · 🌐
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm">
                {i === 0 ? "今天天气真好，分享几张照片 ☀️" : "最近忙到飞起，希望大家都好。"}
              </p>
              <div className="mt-3 h-48 rounded-md bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/40 dark:to-blue-900/40" />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>👍 ❤️ 1.{i + 3}K</span>
                <span>{27 + i * 7} 评论 · {6 + i} 转发</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tiktok ---------------- */
function TiktokPreview({ account }: { account: ManagedAccount }) {
  return (
    <div className="rounded-xl border bg-card p-8 shadow-[var(--shadow-card)]">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-8">
        <Avatar className="h-32 w-32 ring-4 ring-background">
          <AvatarImage src={account.avatar} />
          <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h2 className="text-2xl font-bold">{account.username}</h2>
            <Button className="bg-[#fe2c55] hover:bg-[#e0254a] text-white">关注</Button>
            <Button variant="outline">私信</Button>
          </div>
          <p className="text-sm text-muted-foreground">{account.username.replace("@", "@")}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm sm:justify-start">
            <span>
              <b>{(account.following / 1000).toFixed(1)}K</b>{" "}
              <span className="text-muted-foreground">正在关注</span>
            </span>
            <span>
              <b>{(account.followers / 1000).toFixed(1)}K</b>{" "}
              <span className="text-muted-foreground">粉丝</span>
            </span>
            <span>
              <b>{(account.likes / 1000).toFixed(1)}K</b>{" "}
              <span className="text-muted-foreground">获赞</span>
            </span>
          </div>
          <p className="text-sm">{account.remark === "--" ? "记录生活的美好时刻 ✨" : account.remark}</p>
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-12 border-b text-sm font-medium">
        {["视频", "收藏", "喜欢"].map((t, i) => (
          <button
            key={t}
            className={cn(
              "px-3 py-3",
              i === 0 ? "border-b-2 border-foreground" : "text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "relative aspect-[3/4] overflow-hidden rounded-md",
              i % 3 === 0
                ? "bg-gradient-to-br from-rose-400 to-rose-700"
                : i % 3 === 1
                  ? "bg-gradient-to-br from-cyan-400 to-cyan-700"
                  : "bg-gradient-to-br from-amber-400 to-amber-700",
            )}
          >
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white">
              <Play className="h-3 w-3 fill-current" /> {(283 + i * 12)}K
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Instagram ---------------- */
function InstagramPreview({ account }: { account: ManagedAccount }) {
  const handle = account.username.startsWith("@")
    ? account.username
    : `@${account.username.toLowerCase().replace(/\s+/g, ".")}`;
  return (
    <div className="rounded-xl border bg-card p-8 shadow-[var(--shadow-card)]">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-12">
        <div className="rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400 p-1">
          <Avatar className="h-32 w-32 ring-2 ring-background">
            <AvatarImage src={account.avatar} />
            <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-light">{handle}</h2>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
              关注
            </Button>
            <Button size="sm" variant="outline">
              发消息
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <span>
              <b>{(account.likes / 1000).toFixed(0)}</b> 帖子
            </span>
            <span>
              <b>{(account.followers / 1000).toFixed(1)}K</b> 粉丝
            </span>
            <span>
              <b>{(account.following / 1000).toFixed(1)}K</b> 正在关注
            </span>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{account.username}</p>
            <p>{account.remark === "--" ? "记录每一帧美好 📸" : account.remark}</p>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" /> {account.country}
            </p>
          </div>
          <div className="flex gap-4">
            {["新品", "旅行", "日常", "美食", "工作"].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-200 to-orange-300" />
                <span className="text-xs">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-12 border-b text-xs font-medium">
        {["⊞ 帖子", "▷ 视频", "✦ 已标记"].map((t, i) => (
          <button
            key={t}
            className={cn(
              "px-3 py-3",
              i === 0 ? "border-b-2 border-foreground" : "text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square",
              i % 3 === 0
                ? "bg-pink-400"
                : i % 3 === 1
                  ? "bg-amber-400"
                  : "bg-indigo-400",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Twitter/X ---------------- */
function TwitterPreview({ account }: { account: ManagedAccount }) {
  const handle = account.username.startsWith("@")
    ? account.username
    : `@${account.username.toLowerCase().replace(/\s+/g, "_")}`;
  return (
    <div className="overflow-hidden rounded-xl border bg-black text-white shadow-[var(--shadow-card)]">
      <div className="h-44 bg-gradient-to-r from-zinc-700 to-zinc-900" />
      <div className="relative px-6 pb-4">
        <div className="-mt-14 flex items-end justify-between gap-4">
          <Avatar className="h-28 w-28 ring-4 ring-black">
            <AvatarImage src={account.avatar} />
            <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <Button className="bg-white text-black hover:bg-white/90">关注</Button>
        </div>
        <div className="mt-3">
          <h2 className="text-xl font-bold">{handle}</h2>
          <p className="text-sm text-zinc-400">{handle}</p>
          <p className="mt-2 text-sm">{account.remark === "--" ? "Just here for the vibes." : account.remark}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {account.country}
            </span>
            <span className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              <span className="text-sky-400">x.com/{account.platformId}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> 加入于 {account.createdAt.slice(0, 10)}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <span>
              <b>{(account.following / 1000).toFixed(1)}K</b>{" "}
              <span className="text-zinc-400">正在关注</span>
            </span>
            <span>
              <b>{(account.followers / 1000).toFixed(1)}K</b>{" "}
              <span className="text-zinc-400">关注者</span>
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-around border-b border-zinc-800 text-sm font-medium">
          {["帖子", "回复", "亮点", "媒体", "喜欢"].map((t, i) => (
            <button
              key={t}
              className={cn(
                "px-3 py-3",
                i === 0 ? "border-b-2 border-sky-500" : "text-zinc-400",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="divide-y divide-zinc-800">
          {[
            { time: "1h", text: "刚刚发布了新版本 🚀 期待大家的反馈！", c: 12, r: 30, l: 120, v: "2K" },
            { time: "2h", text: "今天阳光不错，出门走走 ☀️", c: 16, r: 41, l: 170, v: "2.8K" },
            { time: "3h", text: "推荐一本最近在读的书：《思考，快与慢》", c: 20, r: 52, l: 220, v: "3.6K" },
          ].map((t, i) => (
            <div key={i} className="flex gap-3 py-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={account.avatar} />
                <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm">
                  <b>{handle}</b>{" "}
                  <span className="text-zinc-400">{handle} · {t.time}</span>
                </div>
                <p className="mt-1 text-sm">{t.text}</p>
                <div className="mt-3 flex justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {t.c}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="h-3.5 w-3.5" /> {t.r}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {t.l}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" /> {t.v}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- WhatsApp ---------------- */
function WhatsAppPreview({ account }: { account: ManagedAccount }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#0b1419] text-zinc-100 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <ArrowLeft className="h-5 w-5 text-emerald-400" />
        <span className="text-emerald-400">联系人信息</span>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
        <Avatar className="h-32 w-32 ring-4 ring-zinc-800">
          <AvatarImage src={account.avatar} />
          <AvatarFallback>{account.username.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-semibold">{account.username}</h2>
        <p className="text-sm text-zinc-400">+{account.platformId}</p>
        <p className="text-xs text-zinc-500">最后上线时间：今天 14:23</p>
        <div className="mt-4 grid grid-cols-4 gap-6">
          {[
            { icon: MessageCircle, label: "消息" },
            { icon: Phone, label: "语音" },
            { icon: Video, label: "视频" },
            { icon: SearchIcon, label: "搜索" },
          ].map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1.5 text-emerald-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-xs">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-px bg-zinc-900/40">
        <div className="px-6 py-3">
          <div className="text-xs text-emerald-400">关于</div>
          <div className="mt-1 text-sm">
            {account.remark === "--" ? `${account.username}线上` : account.remark}
          </div>
        </div>
        <div className="px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <span>媒体、链接和文件</span>
            <span className="text-xs text-zinc-500">478 ›</span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-zinc-800" />
            ))}
          </div>
        </div>
        {[
          { icon: Bell, label: "消息通知" },
          { icon: ImageIcon, label: "媒体可见性" },
          { icon: Lock, label: "加密" },
          { icon: Clock, label: "消息保留时间", right: "关闭" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between px-6 py-3 text-sm">
            <div className="flex items-center gap-3">
              <row.icon className="h-4 w-4 text-emerald-400" />
              <span>{row.label}</span>
            </div>
            {row.right && <span className="text-xs text-zinc-500">{row.right}</span>}
          </div>
        ))}
        <div className="flex items-center gap-3 px-6 py-3 text-sm text-rose-400">
          <Ban className="h-4 w-4" /> 屏蔽 {account.username}
        </div>
        <div className="flex items-center gap-3 px-6 py-3 text-sm text-rose-400">
          <ThumbsDown className="h-4 w-4" /> 举报 {account.username}
        </div>
      </div>
    </div>
  );
}

void Globe;

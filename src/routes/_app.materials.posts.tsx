import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Plus,
  Search,
  RotateCcw,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Tag as TagIcon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Layers,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaginationBar } from "@/components/pagination-bar";
import { cn } from "@/lib/utils";
import { getUsableTags } from "@/lib/systemTags";
import { ACTIVE_TENANTS } from "@/lib/managed-account-mock";
import {
  CURRENT_USER_TENANT_ID,
  CURRENT_USER_TENANT_NAME,
  useTenantScope,
} from "@/lib/tenant-scope";

export const Route = createFileRoute("/_app/materials/posts")({
  component: PostsPage,
  head: () => ({
    meta: [
      { title: "贴文素材 — BooPilot" },
      { name: "description", content: "集中管理图文与视频贴文素材。" },
    ],
  }),
});

/* ============================================================ */
/* 类型 & Mock                                                  */
/* ============================================================ */

type PostType = "image" | "video";
type Platform = "Facebook" | "Tiktok" | "Instagram" | "Twitter/X" | "WhatsApp";

const PLATFORMS: Platform[] = [
  "Facebook",
  "Tiktok",
  "Instagram",
  "Twitter/X",
  "WhatsApp",
];

const PLATFORM_META: Record<Platform, { cls: string; letter: string }> = {
  Facebook: { cls: "bg-blue-600 text-white", letter: "F" },
  Tiktok: { cls: "bg-foreground text-background", letter: "T" },
  Instagram: {
    cls: "bg-gradient-to-br from-pink-500 to-yellow-400 text-white",
    letter: "I",
  },
  "Twitter/X": { cls: "bg-sky-500 text-white", letter: "X" },
  WhatsApp: { cls: "bg-emerald-500 text-white", letter: "W" },
};

export interface PostItem {
  id: string;
  type: PostType;
  title: string;
  content: string;
  images: string[]; // URLs (or object URLs)
  videoUrl?: string;
  videoCover?: string;
  platforms: Platform[];
  tags: string[];
  enabled: boolean;
  createdAt: string;
  tenantId: string;
  tenantName: string;
}

const SAMPLE_IMG = (seed: number) =>
  `https://picsum.photos/seed/post-${seed}/640/640`;

const SAMPLE_TITLES = [
  "新品上市:夏季清凉系列开箱",
  "618 大促预告 | 限时折扣抢先看",
  "用户好评合集 | 真实分享",
  "幕后花絮:拍摄日的一天",
  "节日问候 | 中秋祝福海报",
  "教程:三步搞定出片技巧",
  "品牌故事 | 从 0 到 1",
  "热门 BGM 跟拍挑战",
  "客户案例:出海品牌增长 200%",
  "周末好物推荐",
  "上新预热 | 神秘新品倒计时",
  "海外团队 vlog",
];

export function seedPosts(): PostItem[] {
  const tagPool = getUsableTags().map((t) => t.name);
  const rows: PostItem[] = [];
  for (let i = 1; i <= 14; i++) {
    const isVideo = i % 3 === 0;
    const imgCount = (i % 4) + 1;
    const tenant = ACTIVE_TENANTS[i % Math.max(1, ACTIVE_TENANTS.length)];
    rows.push({
      id: `post-${i}`,
      type: isVideo ? "video" : "image",
      title: SAMPLE_TITLES[i % SAMPLE_TITLES.length],
      content: `这是第 ${i} 条贴文文案,用于展示贴文素材的内容预览。可以包含活动信息、产品亮点、互动话术等。#出海 #品牌 #种草`,
      images: isVideo
        ? []
        : Array.from({ length: imgCount }, (_, k) => SAMPLE_IMG(i * 10 + k)),
      videoUrl: isVideo
        ? "https://www.w3schools.com/html/mov_bbb.mp4"
        : undefined,
      videoCover: isVideo ? SAMPLE_IMG(i * 10) : undefined,
      platforms: PLATFORMS.filter((_, idx) => (i + idx) % 2 === 0).slice(0, 3),
      tags:
        tagPool.length > 0
          ? Array.from(
              { length: (i % 2) + 1 },
              (_, k) => tagPool[(i + k * 3) % tagPool.length],
            )
          : [],
      enabled: i % 5 !== 0,
      createdAt: `2026-05-${String((i % 27) + 1).padStart(2, "0")} ${String(
        20 - (i % 12),
      ).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      tenantId: tenant?.id ?? "",
      tenantName: tenant?.name ?? "",
    });
  }
  return rows;
}

/* ============================================================ */
/* 主页面                                                        */
/* ============================================================ */

function PostsPage() {
  const [rows, setRows] = useState<PostItem[]>(() => seedPosts());
  const [tenantScope] = useTenantScope();

  // 筛选
  const [keyword, setKeyword] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | PostType>("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | Platform>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const usableTags = useMemo(() => getUsableTags(), []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (platformFilter !== "all" && !r.platforms.includes(platformFilter))
        return false;
      if (tagFilter !== "all" && !r.tags.includes(tagFilter)) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !r.title.toLowerCase().includes(k) &&
          !r.content.toLowerCase().includes(k)
        )
          return false;
      }
      if (dateFrom || dateTo) {
        const d = new Date(r.createdAt.replace(" ", "T"));
        if (dateFrom && d < new Date(dateFrom.setHours(0, 0, 0, 0)))
          return false;
        if (dateTo && d > new Date(new Date(dateTo).setHours(23, 59, 59, 999)))
          return false;
      }
      return true;
    });
  }, [rows, keyword, tagFilter, typeFilter, platformFilter, dateFrom, dateTo]);

  // 分页
  const [pageSize] = useState(8);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // 统计
  const stats = useMemo(
    () => ({
      total: rows.length,
      image: rows.filter((r) => r.type === "image").length,
      video: rows.filter((r) => r.type === "video").length,
    }),
    [rows],
  );

  // 选择
  const [selected, setSelected] = useState<string[]>([]);
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allPageChecked =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const togglePageAll = () => {
    if (allPageChecked)
      setSelected((s) => s.filter((id) => !pageRows.some((r) => r.id === id)));
    else
      setSelected((s) => [
        ...new Set([...s, ...pageRows.map((r) => r.id)]),
      ]);
  };

  // 弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PostItem | null>(null);
  const [viewing, setViewing] = useState<PostItem | null>(null);
  const [previewing, setPreviewing] = useState<{
    post: PostItem;
    index: number;
  } | null>(null);
  const [deleting, setDeleting] = useState<PostItem | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  const handleReset = () => {
    setKeyword("");
    setTagFilter("all");
    setTypeFilter("all");
    setPlatformFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: PostItem) => {
    setEditing(r);
    setFormOpen(true);
  };

  const handleSave = (
    data: Omit<PostItem, "id" | "createdAt" | "tenantId" | "tenantName">,
  ) => {
    if (editing) {
      setRows((prev) =>
        prev.map((x) => (x.id === editing.id ? { ...x, ...data } : x)),
      );
      toast.success("已保存", { description: data.title });
    } else {
      const item: PostItem = {
        ...data,
        id: `post-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        tenantId: CURRENT_USER_TENANT_ID,
        tenantName: CURRENT_USER_TENANT_NAME,
      };
      setRows((prev) => [item, ...prev]);
      toast.success("新增成功", { description: item.title });
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setRows((prev) => prev.filter((x) => x.id !== deleting.id));
    toast.success("已删除", { description: deleting.title });
    setDeleting(null);
  };
  const handleBatchDelete = () => {
    setRows((prev) => prev.filter((x) => !selected.includes(x.id)));
    toast.success("批量删除完成", { description: `共 ${selected.length} 条` });
    setSelected([]);
    setBatchDeleteOpen(false);
  };

  const handleBatchUpdateTags = (tags: string[]) => {
    setRows((prev) =>
      prev.map((x) =>
        selected.includes(x.id)
          ? { ...x, tags: Array.from(new Set([...x.tags, ...tags])) }
          : x,
      ),
    );
    toast.success("标签已更新", {
      description: `共 ${selected.length} 条贴文`,
    });
    setTagsOpen(false);
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* 标题 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            贴文素材
          </h2>
          <Badge
            variant="outline"
            className="rounded-full bg-primary/10 text-primary border-primary/30"
          >
            <FileText className="mr-1 h-3 w-3" />
            素材库
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          集中管理图文与视频贴文素材,支持多平台发布配置、标签管理与批量操作。
        </p>
      </div>

      {/* 统计 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="贴文总数" value={stats.total} icon={FileText} tone="primary" />
        <StatCard title="图文贴数" value={stats.image} icon={ImageIcon} tone="success" />
        <StatCard title="视频贴数" value={stats.video} icon={VideoIcon} tone="violet" />
      </div>

      {/* 筛选区 */}
      <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormItem label="贴文描述关键词">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="标题 / 文案内容"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </FormItem>
          <FormItem label="贴文标签">
            <Select
              value={tagFilter}
              onValueChange={(v) => {
                setTagFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {usableTags.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem label="贴文类型">
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as "all" | PostType);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="image">图文</SelectItem>
                <SelectItem value="video">视频</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem label="使用平台">
            <Select
              value={platformFilter}
              onValueChange={(v) => {
                setPlatformFilter(v as "all" | Platform);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem label="上传日期" className="md:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-2">
              <DatePickerField value={dateFrom} onChange={setDateFrom} placeholder="开始日期" />
              <span className="text-muted-foreground">~</span>
              <DatePickerField value={dateTo} onChange={setDateTo} placeholder="结束日期" />
            </div>
          </FormItem>
          <div className="flex items-end justify-end gap-2 md:col-span-2 xl:col-span-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>
            <Button onClick={() => setPage(1)}>
              <Search className="h-4 w-4" />
              搜索
            </Button>
          </div>
        </div>
      </div>

      {/* 数据卡片 */}
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        {/* 功能操作区 */}
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            新增贴文
          </Button>
          <Button
            variant="outline"
            disabled={selected.length === 0}
            onClick={() => setTagsOpen(true)}
          >
            <TagIcon className="h-4 w-4" />
            修改标签{selected.length > 0 && ` (${selected.length})`}
          </Button>
          {selected.length > 0 && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setBatchDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              批量删除 ({selected.length})
            </Button>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast.success("已刷新")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 列表 - 卡片网格 */}
        <div className="p-4">
          {pageRows.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <Checkbox
                checked={allPageChecked}
                onCheckedChange={togglePageAll}
                aria-label="全选本页"
              />
              <span className="text-sm text-muted-foreground">
                本页全选{selected.length > 0 && ` · 已选 ${selected.length} 条`}
              </span>
            </div>
          )}
          {pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                暂无贴文素材,点击"新增贴文"开始创建
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageRows.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  selected={selected.includes(post.id)}
                  onToggle={() => toggleOne(post.id)}
                  onPreview={(idx) => setPreviewing({ post, index: idx })}
                  onView={() => setViewing(post)}
                  onEdit={() => openEdit(post)}
                  onDelete={() => setDeleting(post)}
                />
              ))}
            </div>
          )}
        </div>
        {pageRows.length > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            setPage={setPage}
          />
        )}
      </div>

      {/* 新增/编辑 */}
      <PostFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSubmit={handleSave}
      />

      {/* 查看详情 */}
      <ViewDialog post={viewing} onClose={() => setViewing(null)} />

      {/* 预览图片/视频 */}
      <PreviewDialog
        data={previewing}
        onChange={setPreviewing}
        onClose={() => setPreviewing(null)}
      />

      {/* 修改标签 */}
      <BatchTagsDialog
        open={tagsOpen}
        onOpenChange={setTagsOpen}
        count={selected.length}
        onSubmit={handleBatchUpdateTags}
      />

      {/* 单删 */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该贴文?</AlertDialogTitle>
            <AlertDialogDescription>
              将删除「{deleting?.title}」,该操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除 */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除?</AlertDialogTitle>
            <AlertDialogDescription>
              将删除 {selected.length} 条贴文,该操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBatchDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ============================================================ */
/* 子组件                                                        */
/* ============================================================ */

function FormItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex-1 justify-start font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(value, "yyyy-MM-dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}


function PlatformBadge({ p }: { p: Platform }) {
  const meta = PLATFORM_META[p];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold cursor-default",
            meta.cls,
          )}
        >
          {meta.letter}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{p}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function PostCard({
  post,
  selected,
  onToggle,
  onPreview,
  onView,
  onEdit,
  onDelete,
}: {
  post: PostItem;
  selected: boolean;
  onToggle: () => void;
  onPreview: (idx: number) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cover =
    post.type === "image"
      ? post.images[0]
      : post.videoCover ?? post.images[0];

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md",
        selected && "ring-2 ring-primary/60",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
            onClick={() => onPreview(0)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {/* 类型角标 */}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md border-0 backdrop-blur-sm",
              post.type === "video"
                ? "bg-violet-500/80 text-white"
                : "bg-primary/80 text-primary-foreground",
            )}
          >
            {post.type === "video" ? (
              <>
                <VideoIcon className="mr-1 h-3 w-3" />
                视频
              </>
            ) : (
              <>
                <ImageIcon className="mr-1 h-3 w-3" />
                图文 · {post.images.length}
              </>
            )}
          </Badge>
        </div>
        {/* 选择框 */}
        <div className="absolute right-2 top-2 rounded-md bg-background/80 p-1 backdrop-blur-sm">
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </div>
        {/* 视频播放按钮 */}
        {post.type === "video" && (
          <button
            onClick={() => onPreview(0)}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="播放视频"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
        {/* 启用状态 */}
        {!post.enabled && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="border-0 bg-muted/90 text-muted-foreground">
              已停用
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3
          className="line-clamp-1 cursor-pointer text-sm font-semibold text-foreground hover:text-primary"
          title={post.title}
          onClick={onView}
        >
          {post.title}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {post.content}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <TooltipProvider delayDuration={200}>
            {post.platforms.map((p) => (
              <PlatformBadge key={p} p={p} />
            ))}
          </TooltipProvider>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {post.tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="rounded-md bg-muted/50 text-[11px] font-normal"
              >
                {t}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <span>{post.createdAt}</span>
          <div className="flex items-center gap-0.5">
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onView}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 预览弹窗 ---------- */
function PreviewDialog({
  data,
  onChange,
  onClose,
}: {
  data: { post: PostItem; index: number } | null;
  onChange: (d: { post: PostItem; index: number } | null) => void;
  onClose: () => void;
}) {
  if (!data) return null;
  const { post, index } = data;
  const isVideo = post.type === "video";
  const total = isVideo ? 1 : post.images.length;
  const prev = () =>
    onChange({ post, index: (index - 1 + total) % total });
  const next = () => onChange({ post, index: (index + 1) % total });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl border-0 bg-background/95 p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>{post.title}</DialogTitle>
        </DialogHeader>
        <div className="relative flex items-center justify-center">
          {isVideo ? (
            <video
              src={post.videoUrl}
              poster={post.videoCover}
              controls
              autoPlay
              className="max-h-[78vh] w-full rounded-md bg-black"
            />
          ) : (
            <img
              src={post.images[index]}
              alt={`${post.title}-${index + 1}`}
              className="max-h-[78vh] w-auto rounded-md object-contain"
            />
          )}
          {!isVideo && total > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="上一张"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="下一张"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                {index + 1} / {total}
              </span>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- 详情弹窗 ---------- */
function ViewDialog({
  post,
  onClose,
}: {
  post: PostItem | null;
  onClose: () => void;
}) {
  if (!post) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {post.title}
            <Badge
              variant="outline"
              className={cn(
                post.type === "video"
                  ? "bg-violet-500/10 text-violet-600 border-violet-300/40"
                  : "bg-primary/10 text-primary border-primary/30",
              )}
            >
              {post.type === "video" ? "视频" : "图文"}
            </Badge>
            {!post.enabled && (
              <Badge variant="outline" className="bg-muted">
                已停用
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>上传时间:{post.createdAt}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {post.type === "video" && post.videoUrl ? (
            <video
              src={post.videoUrl}
              poster={post.videoCover}
              controls
              className="w-full rounded-md bg-black"
            />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {post.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">文案内容</Label>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
              {post.content}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">使用平台</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {post.platforms.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs"
                  >
                    <PlatformBadge p={p} />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">标签</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {post.tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">--</span>
                ) : (
                  post.tags.map((t) => (
                    <Badge key={t} variant="outline" className="bg-muted/50">
                      {t}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- 表单弹窗 ---------- */
function PostFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PostItem | null;
  onSubmit: (data: Omit<PostItem, "id" | "createdAt" | "tenantId" | "tenantName">) => void;
}) {
  const usableTags = useMemo(() => getUsableTags(), []);
  const [type, setType] = useState<PostType>(editing?.type ?? "image");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [content, setContent] = useState(editing?.content ?? "");
  const [images, setImages] = useState<string[]>(editing?.images ?? []);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(editing?.videoUrl);
  const [videoCover, setVideoCover] = useState<string | undefined>(
    editing?.videoCover,
  );
  const [platforms, setPlatforms] = useState<Platform[]>(
    editing?.platforms ?? [],
  );
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 重置表单
  useMemo(() => {
    if (open) {
      setType(editing?.type ?? "image");
      setTitle(editing?.title ?? "");
      setContent(editing?.content ?? "");
      setImages(editing?.images ?? []);
      setVideoUrl(editing?.videoUrl);
      setVideoCover(editing?.videoCover);
      setPlatforms(editing?.platforms ?? []);
      setEnabled(editing?.enabled ?? true);
      setTags(editing?.tags ?? []);
    }
  }, [open, editing]);

  const handleImagePick = (files: FileList | null) => {
    if (!files) return;
    const accepted = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const arr = Array.from(files).filter((f) => accepted.includes(f.type));
    if (arr.length === 0) {
      toast.error("仅支持 jpg / png / webp / gif 格式");
      return;
    }
    const urls = arr.map((f) => URL.createObjectURL(f));
    setImages((prev) => {
      const merged = [...prev, ...urls].slice(0, 9);
      if (prev.length + urls.length > 9)
        toast.warning("最多上传 9 张图片");
      return merged;
    });
  };

  const handleVideoPick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const accepted = [
      "video/mp4",
      "video/x-msvideo",
      "video/quicktime",
      "video/x-matroska",
    ];
    if (!accepted.includes(f.type) && !/\.(mp4|avi|mov|mkv)$/i.test(f.name)) {
      toast.error("仅支持 MP4 / AVI / MOV / MKV 格式");
      return;
    }
    setVideoUrl(URL.createObjectURL(f));
  };

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const toggleTag = (t: string) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("请输入贴文标题");
      return;
    }
    if (title.length > 100) {
      toast.error("标题最长 100 字");
      return;
    }
    if (content.length > 1000) {
      toast.error("文案内容最长 1000 字");
      return;
    }
    if (type === "image" && images.length === 0) {
      toast.error("请上传至少一张图片");
      return;
    }
    if (type === "video" && !videoUrl) {
      toast.error("请上传视频文件");
      return;
    }
    if (platforms.length === 0) {
      toast.error("请选择至少一个使用平台");
      return;
    }
    onSubmit({
      type,
      title: title.trim(),
      content,
      images: type === "image" ? images : [],
      videoUrl: type === "video" ? videoUrl : undefined,
      videoCover: type === "video" ? videoCover : undefined,
      platforms,
      tags,
      enabled,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑贴文" : "新增贴文"}</DialogTitle>
          <DialogDescription>
            填写贴文基本信息并上传素材文件。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormItem label="贴文类型 *">
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as PostType);
                  // 切换类型时清空对应素材
                  if (v === "image") setVideoUrl(undefined);
                  else setImages([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">图文</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            <FormItem label={`贴文标题 * (${title.length}/100)`}>
              <Input
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入贴文标题"
              />
            </FormItem>
          </div>

          <FormItem label={`文案内容 (${content.length}/1000)`}>
            <Textarea
              value={content}
              maxLength={1000}
              rows={5}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入贴文文案内容"
            />
          </FormItem>

          {type === "image" ? (
            <FormItem label={`上传图片 * (${images.length}/9)`}>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(e) => {
                  handleImagePick(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 9 && (
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">添加图片</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                支持 jpg / png / webp / gif,最多 9 张
              </p>
            </FormItem>
          ) : (
            <FormItem label="上传视频 *">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,.mp4,.avi,.mov,.mkv"
                hidden
                onChange={(e) => {
                  handleVideoPick(e.target.files);
                  e.target.value = "";
                }}
              />
              {videoUrl ? (
                <div className="relative">
                  <video
                    src={videoUrl}
                    controls
                    className="max-h-80 w-full rounded-md bg-black"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setVideoUrl(undefined)}
                  >
                    <Trash2 className="h-4 w-4" />
                    移除视频
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/30 py-10 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">点击上传视频</span>
                  <span className="text-xs">仅支持 MP4 / AVI / MOV / MKV,单个文件</span>
                </button>
              )}
            </FormItem>
          )}

          <FormItem label="使用平台 *">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <PlatformBadge p={p} />
                    {p}
                  </button>
                );
              })}
            </div>
          </FormItem>

          <FormItem label="标签">
            <div className="flex flex-wrap gap-2">
              {usableTags.map((t) => {
                const active = tags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.name)}
                    className={cn(
                      "rounded-md border px-3 py-1 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </FormItem>

          <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">启用状态</p>
              <p className="text-xs text-muted-foreground">
                关闭后该贴文将不会出现在可选素材中
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- 批量改标签 ---------- */
function BatchTagsDialog({
  open,
  onOpenChange,
  count,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  count: number;
  onSubmit: (tags: string[]) => void;
}) {
  const usableTags = useMemo(() => getUsableTags(), []);
  const [picked, setPicked] = useState<string[]>([]);

  useMemo(() => {
    if (open) setPicked([]);
  }, [open]);

  const toggle = (n: string) =>
    setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改标签</DialogTitle>
          <DialogDescription>
            将为已选 {count} 条贴文追加以下标签。
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
          {usableTags.map((t) => {
            const active = picked.includes(t.name);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.name)}
                className={cn(
                  "rounded-md border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50",
                )}
              >
                {t.name}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => onSubmit(picked)}
            disabled={picked.length === 0}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

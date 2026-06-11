import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Search,
  RotateCcw,
  Upload,
  Sparkles,
  Tag as TagIcon,
  Pencil,
  Trash2,
  Eye,
  Image as ImageIcon,
  Video as VideoIcon,
  Music2,
  FileStack,
  CheckCircle2,
  X,
  Play,
  Pause,
  Volume2,
  Layers,
  ScanSearch,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TagMultiSelect } from "@/components/tag-multi-select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai/materials")({
  component: MyMaterialsPage,
  head: () => ({ meta: [{ title: "我的原料 — BooPilot" }] }),
});

type AssetType = "image" | "video" | "audio";

type Asset = {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumb?: string;
  size: string;
  duration?: string;
  tags: string[];
  description: string;
  uploadedAt: string;
  hash: string;
};

const SAMPLE_IMG = (seed: string) =>
  `https://picsum.photos/seed/${seed}/640/480`;
const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_AUDIO =
  "https://www.w3schools.com/html/horse.mp3";

const INITIAL_ASSETS: Asset[] = [
  {
    id: "a1",
    name: "夏季新品-海边大片.jpg",
    type: "image",
    url: SAMPLE_IMG("boop-1"),
    thumb: SAMPLE_IMG("boop-1"),
    size: "1.8 MB",
    tags: ["夏季", "新品", "海边"],
    description: "夏季主推新品户外拍摄素材，主色调蓝色。",
    uploadedAt: "2026-06-08 10:24",
    hash: "h1",
  },
  {
    id: "a2",
    name: "产品开箱-30s.mp4",
    type: "video",
    url: SAMPLE_VIDEO,
    thumb: SAMPLE_IMG("boop-2"),
    size: "14.6 MB",
    duration: "00:30",
    tags: ["开箱", "短视频"],
    description: "30 秒产品开箱短视频，可用于 TikTok / Reels。",
    uploadedAt: "2026-06-07 18:02",
    hash: "h2",
  },
  {
    id: "a3",
    name: "品牌轻快配乐.mp3",
    type: "audio",
    url: SAMPLE_AUDIO,
    size: "2.4 MB",
    duration: "01:12",
    tags: ["BGM", "轻快", "品牌"],
    description: "轻快品牌背景音乐，适合产品演示。",
    uploadedAt: "2026-06-06 09:11",
    hash: "h3",
  },
  {
    id: "a4",
    name: "用户好评截图-001.png",
    type: "image",
    url: SAMPLE_IMG("boop-4"),
    thumb: SAMPLE_IMG("boop-4"),
    size: "612 KB",
    tags: ["好评", "UGC"],
    description: "用户在 Instagram 留下的好评截图。",
    uploadedAt: "2026-06-05 14:45",
    hash: "h4",
  },
  {
    id: "a5",
    name: "厨房场景-早餐.jpg",
    type: "image",
    url: SAMPLE_IMG("boop-5"),
    thumb: SAMPLE_IMG("boop-5"),
    size: "2.1 MB",
    tags: ["场景", "厨房", "生活"],
    description: "明亮的厨房早餐场景。",
    uploadedAt: "2026-06-04 08:30",
    hash: "h5",
  },
  {
    id: "a6",
    name: "广告解说-中文女声.mp3",
    type: "audio",
    url: SAMPLE_AUDIO,
    size: "3.1 MB",
    duration: "00:45",
    tags: ["配音", "中文", "女声"],
    description: "中文女声广告解说，温柔清晰。",
    uploadedAt: "2026-06-03 17:20",
    hash: "h6",
  },
  {
    id: "a7",
    name: "夜景城市灯光.mp4",
    type: "video",
    url: SAMPLE_VIDEO,
    thumb: SAMPLE_IMG("boop-7"),
    size: "22.7 MB",
    duration: "00:18",
    tags: ["城市", "夜景", "空镜"],
    description: "城市夜景灯光延时空镜素材。",
    uploadedAt: "2026-06-02 22:01",
    hash: "h7",
  },
  {
    id: "a8",
    name: "Logo-透明底.png",
    type: "image",
    url: SAMPLE_IMG("boop-8"),
    thumb: SAMPLE_IMG("boop-8"),
    size: "84 KB",
    tags: ["Logo", "品牌"],
    description: "品牌主 Logo，透明背景，适合叠加。",
    uploadedAt: "2026-06-01 11:08",
    hash: "h8",
  },
  // ---- 以下为「智能去重」演示数据：故意制造若干疑似重复素材 ----
  // 组 1：与 a1 完全相同（同 hash） — 重复上传场景
  {
    id: "a9",
    name: "夏季新品-海边大片(1).jpg",
    type: "image",
    url: SAMPLE_IMG("boop-1"),
    thumb: SAMPLE_IMG("boop-1"),
    size: "1.8 MB",
    tags: ["夏季", "新品"],
    description: "重复上传的同一张素材。",
    uploadedAt: "2026-06-09 09:12",
    hash: "h1",
  },
  {
    id: "a10",
    name: "summer-hero-final.jpg",
    type: "image",
    url: SAMPLE_IMG("boop-1"),
    thumb: SAMPLE_IMG("boop-1"),
    size: "1.8 MB",
    tags: ["夏季", "海边"],
    description: "运营从设计稿重命名后再次上传。",
    uploadedAt: "2026-06-09 15:40",
    hash: "h1",
  },
  // 组 2：与 a2 同源视频
  {
    id: "a11",
    name: "产品开箱-30s-备份.mp4",
    type: "video",
    url: SAMPLE_VIDEO,
    thumb: SAMPLE_IMG("boop-2"),
    size: "14.6 MB",
    duration: "00:30",
    tags: ["开箱"],
    description: "同一支视频由不同设备分别上传。",
    uploadedAt: "2026-06-08 21:05",
    hash: "h2",
  },
  // 组 3：与 a3 同源音频
  {
    id: "a12",
    name: "BGM-轻快.mp3",
    type: "audio",
    url: SAMPLE_AUDIO,
    size: "2.4 MB",
    duration: "01:12",
    tags: ["BGM"],
    description: "与品牌轻快配乐为同一文件，仅文件名不同。",
    uploadedAt: "2026-06-07 10:24",
    hash: "h3",
  },
  // 组 4：与 a5 近似（高相似度） — 同场景多次拍摄
  {
    id: "a13",
    name: "厨房场景-早餐-v2.jpg",
    type: "image",
    url: SAMPLE_IMG("boop-5b"),
    thumb: SAMPLE_IMG("boop-5b"),
    size: "2.0 MB",
    tags: ["场景", "厨房"],
    description: "厨房早餐场景的另一张候选图，构图相近。",
    uploadedAt: "2026-06-04 08:32",
    hash: "h5-near",
  },
  {
    id: "a14",
    name: "厨房场景-早餐-横版.jpg",
    type: "image",
    url: SAMPLE_IMG("boop-5c"),
    thumb: SAMPLE_IMG("boop-5c"),
    size: "2.2 MB",
    tags: ["场景", "厨房", "横版"],
    description: "同一场景的横版裁剪，可保留一张。",
    uploadedAt: "2026-06-04 08:35",
    hash: "h5-near",
  },
];

// 「智能去重」演示分组：完全重复（同 hash）与高相似（感知哈希近似）
const DEDUPE_MOCK_GROUPS: Array<{
  key: string;
  reason: "exact" | "similar";
  similarity: number;
  fingerprint: string;
  memberIds: string[];
}> = [
  {
    key: "dup-h1",
    reason: "exact",
    similarity: 100,
    fingerprint: "sha256:1a2b…h1",
    memberIds: ["a1", "a9", "a10"],
  },
  {
    key: "dup-h2",
    reason: "exact",
    similarity: 100,
    fingerprint: "sha256:9f0c…h2",
    memberIds: ["a2", "a11"],
  },
  {
    key: "dup-h3",
    reason: "exact",
    similarity: 100,
    fingerprint: "sha256:7d31…h3",
    memberIds: ["a3", "a12"],
  },
  {
    key: "sim-h5",
    reason: "similar",
    similarity: 92,
    fingerprint: "phash:e4a1…h5",
    memberIds: ["a5", "a13", "a14"],
  },
];

const TYPE_META: Record<AssetType, { label: string; icon: typeof ImageIcon; tint: string }> = {
  image: { label: "图片", icon: ImageIcon, tint: "text-sky-600 bg-sky-100 dark:bg-sky-500/15" },
  video: { label: "视频", icon: VideoIcon, tint: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
  audio: { label: "音频", icon: Music2, tint: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
};

type FilterType = "all" | AssetType;

function inferTypeFromFile(file: File): AssetType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "audio";
}

function MyMaterialsPage() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [tagBulkOpen, setTagBulkOpen] = useState(false);
  const [dedupeOpen, setDedupeOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return assets.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (!kw) return true;
      return (
        a.name.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw) ||
        a.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [assets, keyword, filterType]);

  const counts = useMemo(() => {
    return {
      total: assets.length,
      image: assets.filter((a) => a.type === "image").length,
      video: assets.filter((a) => a.type === "video").length,
      audio: assets.filter((a) => a.type === "audio").length,
    };
  }, [assets]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const next = new Set(selected);
      filtered.forEach((a) => next.delete(a.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((a) => next.add(a.id));
      setSelected(next);
    }
  };

  const handleReset = () => {
    setKeyword("");
    setFilterType("all");
  };

  const handleUploadDone = (newAssets: Asset[]) => {
    setAssets((prev) => [...newAssets, ...prev]);
    setUploadOpen(false);
    toast.success(`已上传 ${newAssets.length} 个素材，已自动分类`);
  };

  const handleEditSave = (next: Asset) => {
    setAssets((prev) => prev.map((a) => (a.id === next.id ? next : a)));
    setEditAsset(null);
    toast.success("已保存修改");
  };

  const handleBulkTags = (tags: string[], mode: "replace" | "append") => {
    setAssets((prev) =>
      prev.map((a) => {
        if (!selected.has(a.id)) return a;
        if (mode === "replace") return { ...a, tags };
        const merged = Array.from(new Set([...a.tags, ...tags]));
        return { ...a, tags: merged };
      }),
    );
    setTagBulkOpen(false);
    toast.success(`已为 ${selected.size} 个素材${mode === "replace" ? "替换" : "新增"}标签`);
  };

  const handleDedupe = (keepIds: string[], removeIds: string[]) => {
    setAssets((prev) => prev.filter((a) => !removeIds.includes(a.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      removeIds.forEach((id) => next.delete(id));
      return next;
    });
    setDedupeOpen(false);
    toast.success(`已去重，保留 ${keepIds.length} 个，移除 ${removeIds.length} 个`);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteId(null);
    toast.success("已删除素材");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">我的原料</h1>
          <p className="text-sm text-muted-foreground mt-1">
            集中管理您上传的图片、视频与音频素材，可被 AI 创作流程直接调用。
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          批量上传
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="素材总数" value={counts.total} icon={FileStack} />
        <StatCard title="图片" value={counts.image} icon={ImageIcon} />
        <StatCard title="视频" value={counts.video} icon={VideoIcon} />
        <StatCard title="音频" value={counts.audio} icon={Music2} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索素材文件名称、描述或标签"
              className="pl-9"
            />
          </div>
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> 图片
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-1.5">
                <VideoIcon className="h-3.5 w-3.5" /> 视频
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-1.5">
                <Music2 className="h-3.5 w-3.5" /> 音频
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> 重置
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="全选当前列表"
            />
            <span className="text-muted-foreground">
              {selected.size > 0 ? (
                <>
                  已选 <span className="font-medium text-foreground">{selected.size}</span> 项
                </>
              ) : (
                <>共 {filtered.length} 个素材</>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setDedupeOpen(true)}
            >
              <ScanSearch className="h-3.5 w-3.5" />
              智能去重
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={selected.size === 0}
              onClick={() => setTagBulkOpen(true)}
            >
              <TagIcon className="h-3.5 w-3.5" />
              修改标签
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              disabled={selected.size === 0}
              onClick={() => {
                setAssets((prev) => prev.filter((a) => !selected.has(a.id)));
                toast.success(`已删除 ${selected.size} 个素材`);
                setSelected(new Set());
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              批量删除
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-16 text-center">
          <FileStack className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">暂无匹配的素材</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            立即上传
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selected.has(asset.id)}
              onToggleSelect={() => toggleSelect(asset.id)}
              onPreview={() => setPreviewAsset(asset)}
              onEdit={() => setEditAsset(asset)}
              onDelete={() => setDeleteId(asset.id)}
            />
          ))}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onDone={handleUploadDone}
      />

      <PreviewDialog
        asset={previewAsset}
        onOpenChange={(v) => !v && setPreviewAsset(null)}
      />

      <EditDialog
        asset={editAsset}
        onOpenChange={(v) => !v && setEditAsset(null)}
        onSave={handleEditSave}
      />

      <BulkTagsDialog
        open={tagBulkOpen}
        count={selected.size}
        onOpenChange={setTagBulkOpen}
        onSubmit={handleBulkTags}
      />

      <DedupeDialog
        open={dedupeOpen}
        onOpenChange={setDedupeOpen}
        assets={assets}
        onConfirm={handleDedupe}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该素材？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，且素材将无法再被引用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ----- Asset Card -----
function AssetCard({
  asset,
  selected,
  onToggleSelect,
  onPreview,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  selected: boolean;
  onToggleSelect: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[asset.type];
  const TypeIcon = meta.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border/60",
      )}
    >
      <div
        className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
        onClick={onPreview}
      >
        {asset.type === "image" || asset.type === "video" ? (
          <img
            src={asset.thumb ?? SAMPLE_IMG(asset.id)}
            alt={asset.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30">
            <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-300">
              <Volume2 className="h-10 w-10" />
              <AudioWave />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div
          className="absolute left-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md border border-white/60 bg-white/80 backdrop-blur transition",
              selected && "border-primary bg-primary text-primary-foreground",
            )}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={onToggleSelect}
              className="h-4 w-4 border-none data-[state=checked]:bg-transparent data-[state=checked]:text-current"
            />
          </div>
        </div>

        <Badge
          className={cn(
            "absolute right-2 top-2 gap-1 border-0 px-2 py-0.5 text-[11px] font-medium shadow-sm",
            meta.tint,
          )}
        >
          <TypeIcon className="h-3 w-3" />
          {meta.label}
        </Badge>

        {asset.duration && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {asset.duration}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md hover:bg-white"
          >
            {asset.type === "audio" ? (
              <>
                <Play className="h-3.5 w-3.5" /> 试听
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> 预览
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div
          className="line-clamp-1 cursor-pointer text-sm font-medium hover:text-primary"
          title={asset.name}
          onClick={onPreview}
        >
          {asset.name}
        </div>

        <div className="flex flex-wrap gap-1">
          {asset.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="px-1.5 py-0 text-[11px] font-normal">
              {t}
            </Badge>
          ))}
          {asset.tags.length > 3 && (
            <span className="text-[11px] text-muted-foreground">+{asset.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{asset.uploadedAt.slice(0, 10)}</span>
          <span>{asset.size}</span>
        </div>

        <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}

function AudioWave() {
  return (
    <div className="flex h-6 items-end gap-0.5">
      {[8, 14, 20, 12, 22, 10, 18, 14, 8].map((h, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-emerald-500/70 dark:bg-emerald-400/70"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

// ----- Upload Dialog -----
type PendingUpload = {
  id: string;
  file: File;
  type: AssetType;
  previewUrl: string;
  progress: number;
  status: "uploading" | "done" | "duplicate";
  suggestedTags: string[];
  description: string;
};

function UploadDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (assets: Asset[]) => void;
}) {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => setPending([]);

  const startMockUpload = (items: PendingUpload[]) => {
    items.forEach((item) => {
      const tick = () => {
        setPending((prev) =>
          prev.map((p) => {
            if (p.id !== item.id) return p;
            const next = Math.min(100, p.progress + 10 + Math.random() * 20);
            const status: PendingUpload["status"] =
              next >= 100 ? (Math.random() < 0.15 ? "duplicate" : "done") : "uploading";
            return { ...p, progress: next, status };
          }),
        );
      };
      const interval = setInterval(() => {
        tick();
      }, 350);
      setTimeout(() => clearInterval(interval), 3500);
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: PendingUpload[] = Array.from(files).map((file, i) => {
      const type = inferTypeFromFile(file);
      // auto-suggest tags from filename
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const suggested = baseName
        .split(/[\s_\-—,，]+/)
        .filter((t) => t.length >= 2 && t.length <= 8)
        .slice(0, 3);
      return {
        id: `u-${Date.now()}-${i}`,
        file,
        type,
        previewUrl:
          type === "image" ? URL.createObjectURL(file) : SAMPLE_IMG(`upl-${i}`),
        progress: 5,
        status: "uploading",
        suggestedTags: suggested.length ? suggested : [TYPE_META[type].label],
        description: "",
      };
    });
    setPending((prev) => [...prev, ...items]);
    startMockUpload(items);
  };

  const removePending = (id: string) =>
    setPending((prev) => prev.filter((p) => p.id !== id));

  const handleConfirm = () => {
    const finalAssets: Asset[] = pending
      .filter((p) => p.status !== "duplicate")
      .map((p) => ({
        id: `a-${p.id}`,
        name: p.file.name,
        type: p.type,
        url: p.previewUrl,
        thumb: p.type === "audio" ? undefined : p.previewUrl,
        size: `${(p.file.size / 1024 / 1024).toFixed(1)} MB`,
        duration: p.type === "audio" ? "00:30" : p.type === "video" ? "00:20" : undefined,
        tags: p.suggestedTags,
        description: p.description || `自动分类：${TYPE_META[p.type].label}`,
        uploadedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
        hash: p.id,
      }));
    if (finalAssets.length === 0) {
      toast.error("没有可入库的素材");
      return;
    }
    onDone(finalAssets);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> 批量上传素材
          </DialogTitle>
          <DialogDescription>
            支持图片、视频、音频。上传完成后系统将
            <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              <Sparkles className="h-3 w-3" /> 自动分类
            </span>
            并基于文件名智能推荐标签。
          </DialogDescription>
        </DialogHeader>

        <div
          className="rounded-xl border-2 border-dashed border-border/70 bg-muted/30 p-8 text-center transition hover:bg-muted/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm">
            拖拽文件到此处，或
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ml-1 font-medium text-primary hover:underline"
            >
              点击选择文件
            </button>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            单个文件最大 200MB，可同时选择多个
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {pending.length > 0 && (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {pending.map((p) => {
              const meta = TYPE_META[p.type];
              const TypeIcon = meta.icon;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {p.type === "image" ? (
                      <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <TypeIcon className={cn("h-5 w-5", meta.tint.split(" ")[0])} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1 text-sm font-medium">{p.file.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {meta.label}
                      </Badge>
                      {p.status === "done" && (
                        <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> 完成
                        </Badge>
                      )}
                      {p.status === "duplicate" && (
                        <Badge variant="destructive" className="gap-1">
                          <ScanSearch className="h-3 w-3" /> 疑似重复
                        </Badge>
                      )}
                      {p.status === "uploading" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={p.progress} className="h-1.5" />
                      <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                        {Math.round(p.progress)}%
                      </span>
                    </div>
                    {p.suggestedTags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">推荐标签：</span>
                        {p.suggestedTags.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removePending(p.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={pending.length === 0}>
            确认入库（{pending.filter((p) => p.status !== "duplicate").length}）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Preview Dialog -----
function PreviewDialog({
  asset,
  onOpenChange,
}: {
  asset: Asset | null;
  onOpenChange: (v: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
    }
  };

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">{asset?.name}</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {asset?.description}
          </DialogDescription>
        </DialogHeader>
        {asset && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl bg-muted">
              {asset.type === "image" && (
                <img src={asset.url} alt={asset.name} className="w-full object-contain" />
              )}
              {asset.type === "video" && (
                <video src={asset.url} controls className="h-full w-full" />
              )}
              {asset.type === "audio" && (
                <div className="flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-emerald-50 to-teal-100 p-12 dark:from-emerald-950/40 dark:to-teal-900/30">
                  <button
                    onClick={togglePlay}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105"
                  >
                    {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 pl-1" />}
                  </button>
                  <AudioWave />
                  <audio
                    ref={audioRef}
                    src={asset.url}
                    onEnded={() => setPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{TYPE_META[asset.type].label}</Badge>
              <span>{asset.size}</span>
              {asset.duration && <span>· 时长 {asset.duration}</span>}
              <span>· 上传于 {asset.uploadedAt}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {asset.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----- Edit Dialog -----
function EditDialog({
  asset,
  onOpenChange,
  onSave,
}: {
  asset: Asset | null;
  onOpenChange: (v: boolean) => void;
  onSave: (asset: Asset) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Initialize when asset changes
  const lastIdRef = useRef<string | null>(null);
  if (asset && asset.id !== lastIdRef.current) {
    lastIdRef.current = asset.id;
    setName(asset.name);
    setDescription(asset.description);
    setTags(asset.tags);
  }

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> 编辑素材
          </DialogTitle>
          <DialogDescription>修改文件名称、描述以及标签</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>文件名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>标签</Label>
            <TagMultiSelect value={tags} onChange={setTags} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              if (!asset) return;
              if (!name.trim()) {
                toast.error("文件名称不能为空");
                return;
              }
              onSave({ ...asset, name: name.trim(), description, tags });
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Bulk Tags Dialog -----
function BulkTagsDialog({
  open,
  count,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  count: number;
  onOpenChange: (v: boolean) => void;
  onSubmit: (tags: string[], mode: "replace" | "append") => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<"replace" | "append">("append");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setTags([]);
          setMode("append");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" /> 批量修改标签
          </DialogTitle>
          <DialogDescription>
            将对已选中的 <b>{count}</b> 个素材生效
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>标签</Label>
            <TagMultiSelect value={tags} onChange={setTags} />
          </div>
          <div className="space-y-2">
            <Label>应用方式</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "replace" | "append")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="append">追加到现有标签</SelectItem>
                <SelectItem value="replace">替换现有标签</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => onSubmit(tags, mode)} disabled={tags.length === 0}>
            确认应用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Dedupe Dialog -----
function DedupeDialog({
  open,
  onOpenChange,
  assets,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assets: Asset[];
  onConfirm: (keepIds: string[], removeIds: string[]) => void;
}) {
  // 基于 mock 指纹分组，再叠加任何运行时上传中标记为重复的素材（按 hash 聚合）
  const groups = useMemo(() => {
    if (!open) return [] as {
      key: string;
      reason: "exact" | "similar";
      similarity: number;
      fingerprint: string;
      items: Asset[];
    }[];
    const byId = new Map(assets.map((a) => [a.id, a]));
    const seeded = DEDUPE_MOCK_GROUPS.map((g) => ({
      key: g.key,
      reason: g.reason,
      similarity: g.similarity,
      fingerprint: g.fingerprint,
      items: g.memberIds.map((id) => byId.get(id)).filter(Boolean) as Asset[],
    })).filter((g) => g.items.length > 1);

    // 再补充：用户运行时上传后产生的、与已有素材 hash 完全一致的新条目
    const seenIds = new Set(seeded.flatMap((g) => g.items.map((i) => i.id)));
    const byHash = new Map<string, Asset[]>();
    assets.forEach((a) => {
      if (seenIds.has(a.id)) return;
      if (!byHash.has(a.hash)) byHash.set(a.hash, []);
      byHash.get(a.hash)!.push(a);
    });
    const runtime = Array.from(byHash.entries())
      .filter(([, v]) => v.length > 1)
      .map(([h, items]) => ({
        key: `rt-${h}`,
        reason: "exact" as const,
        similarity: 100,
        fingerprint: `sha256:${h}`,
        items,
      }));
    return [...seeded, ...runtime];
  }, [open, assets]);

  const [keep, setKeep] = useState<Record<string, string>>({});

  const initKeep = () => {
    const next: Record<string, string> = {};
    groups.forEach((g) => {
      next[g.key] = g.items[0].id;
    });
    setKeep(next);
  };

  // initialize on open
  const lastOpenRef = useRef(false);
  if (open && !lastOpenRef.current) {
    lastOpenRef.current = true;
    initKeep();
  } else if (!open && lastOpenRef.current) {
    lastOpenRef.current = false;
  }

  const handleConfirm = () => {
    const keepIds: string[] = [];
    const removeIds: string[] = [];
    groups.forEach((g) => {
      const kid = keep[g.key];
      g.items.forEach((i) => {
        if (i.id === kid) keepIds.push(i.id);
        else removeIds.push(i.id);
      });
    });
    if (removeIds.length === 0) {
      toast.info("未发现可去重的素材");
      onOpenChange(false);
      return;
    }
    onConfirm(keepIds, removeIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4" /> 智能去重
          </DialogTitle>
          <DialogDescription>
            系统已根据文件指纹（类型 + 大小 + 内容哈希）扫描出疑似重复的素材，请为每组选择需要保留的版本。
          </DialogDescription>
        </DialogHeader>
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-10 text-center">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">未发现重复素材</p>
          </div>
        ) : (
          <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.key} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[11px]",
                        g.reason === "exact"
                          ? "bg-destructive/10 text-destructive border border-destructive/30"
                          : "bg-warning/10 text-warning border border-warning/30",
                      )}
                      variant="outline"
                    >
                      {g.reason === "exact" ? "完全重复" : "高度相似"} · {g.similarity}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {g.items.length} 个素材
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/80">
                      {g.fingerprint}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    保留 1 个，移除 {g.items.length - 1} 个
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {g.items.map((it) => {
                    const isKept = keep[g.key] === it.id;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setKeep((p) => ({ ...p, [g.key]: it.id }))}
                        className={cn(
                          "group relative overflow-hidden rounded-md border-2 text-left transition",
                          isKept
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border/60 opacity-70 hover:opacity-100",
                        )}
                      >
                        <div className="aspect-[4/3] bg-muted">
                          {it.type !== "audio" ? (
                            <img
                              src={it.thumb ?? SAMPLE_IMG(it.id)}
                              alt={it.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-emerald-600">
                              <Music2 className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <div className="line-clamp-1 text-[12px] font-medium">{it.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {it.uploadedAt.slice(0, 10)} · {it.size}
                          </div>
                        </div>
                        {isKept && (
                          <span className="absolute right-1 top-1 flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow">
                            <CheckCircle2 className="h-3 w-3" /> 保留
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={groups.length === 0}>
            确认去重
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

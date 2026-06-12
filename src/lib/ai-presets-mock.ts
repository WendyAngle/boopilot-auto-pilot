// AI 预设物料 — 平台级预置素材库
// 与「我的原料」(materials-store) 的区别：
//   - 我的原料：租户/用户上传，仅本租户可见，由业务运营维护
//   - AI 预设物料：平台预置，全租户或按套餐档位可见(只读引用)，由系统管理员维护
//
// 设计要点：
//   - category 决定卡片渲染方式与表单字段差异
//   - visibility 控制哪些租户可在 AI 创作端看到
//   - preset 类型(字幕/转场/滤镜)不是真实文件，仅元数据
import { useSyncExternalStore } from "react";
import type { PlanTier } from "@/lib/billing-plans";

export type PresetCategory =
  | "bgm"
  | "voiceover"
  | "sfx"
  | "avatar"
  | "scene"
  | "subtitle-style"
  | "transition"
  | "lut";

export const PRESET_CATEGORY_META: Record<
  PresetCategory,
  { label: string; desc: string; assetKind: "audio" | "video" | "image" | "preset" }
> = {
  bgm: { label: "背景音乐", desc: "情绪化的氛围与节奏配乐", assetKind: "audio" },
  voiceover: { label: "配音音色", desc: "多语种、多风格的合成音色", assetKind: "audio" },
  sfx: { label: "音效", desc: "短促的转场与点缀音效", assetKind: "audio" },
  avatar: { label: "数字人模特", desc: "可口型驱动的数字人形象", assetKind: "video" },
  scene: { label: "场景模板", desc: "通用场景背景与构图", assetKind: "image" },
  "subtitle-style": { label: "字幕样式", desc: "字体、描边、动效预设", assetKind: "preset" },
  transition: { label: "转场特效", desc: "镜头之间的过渡效果", assetKind: "preset" },
  lut: { label: "滤镜/调色", desc: "整体色调风格化预设", assetKind: "preset" },
};

export const PRESET_CATEGORIES: PresetCategory[] = [
  "bgm",
  "voiceover",
  "sfx",
  "avatar",
  "scene",
  "subtitle-style",
  "transition",
  "lut",
];

export type PresetStatus = "active" | "inactive";

/** 可见范围：全部租户 / 指定套餐档位及以上 */
export type PresetVisibility =
  | { kind: "all" }
  | { kind: "plan"; minPlan: PlanTier };

export type SubtitleStyleKey =
  | "shadow-3d"
  | "block-emphasis"
  | "outline-box"
  | "classic-black"
  | "classic-white"
  | "dark"
  | "fresh"
  | "italic"
  | "lemon"
  | "neon"
  | "outline-glow"
  | "translucent"
  | "shadow-block"
  | "spotlight-block"
  | "white-bar"
  | "white-outline";

export interface PresetItem {
  id: string;
  name: string;
  category: PresetCategory;
  cover?: string;
  /** 资源 URL：音/视频文件、图片；preset 类型可空 */
  url?: string;
  duration?: string;
  size?: string;
  tags: string[];
  description: string;
  /** 分类专属属性：BPM / 情绪 / 语言 / 性别 / 风格 / 字体 等 */
  attrs: Record<string, string>;
  /** 字幕样式预览 key（仅 subtitle-style 分类使用） */
  previewStyle?: SubtitleStyleKey;
  status: PresetStatus;
  visibility: PresetVisibility;
  createdBy: string;
  updatedAt: string;
}

const IMG = (s: string) => `https://picsum.photos/seed/${s}/640/480`;
const AUDIO = "https://www.w3schools.com/html/horse.mp3";
const VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const INITIAL: PresetItem[] = [
  // BGM
  {
    id: "p-bgm-01",
    name: "都市轻快 · Lofi",
    category: "bgm",
    cover: IMG("preset-bgm-1"),
    url: AUDIO,
    duration: "01:32",
    size: "3.2 MB",
    tags: ["轻快", "Lofi", "都市"],
    description: "节奏轻快的都市 Lofi 背景音乐，适合产品种草。",
    attrs: { BPM: "92", 情绪: "轻松", 风格: "Lofi" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-08 10:24",
  },
  {
    id: "p-bgm-02",
    name: "史诗大片 · Cinematic",
    category: "bgm",
    cover: IMG("preset-bgm-2"),
    url: AUDIO,
    duration: "02:14",
    size: "5.1 MB",
    tags: ["史诗", "电影感"],
    description: "宏大磅礴的电影感 BGM，适合品牌片头。",
    attrs: { BPM: "78", 情绪: "震撼", 风格: "Cinematic" },
    status: "active",
    visibility: { kind: "plan", minPlan: "basic" },
    createdBy: "系统",
    updatedAt: "2026-06-07 14:02",
  },
  {
    id: "p-bgm-03",
    name: "动感电子 · EDM",
    category: "bgm",
    cover: IMG("preset-bgm-3"),
    url: AUDIO,
    duration: "01:58",
    size: "4.4 MB",
    tags: ["EDM", "动感"],
    description: "动感电子律动，适合快节奏短视频。",
    attrs: { BPM: "128", 情绪: "激昂", 风格: "EDM" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-06 09:11",
  },
  // 配音
  {
    id: "p-vo-01",
    name: "晓雨 · 温柔女声",
    category: "voiceover",
    cover: IMG("preset-vo-1"),
    url: AUDIO,
    duration: "00:08",
    tags: ["中文", "女声", "温柔"],
    description: "温柔清晰的中文女声，适合美妆、生活类。",
    attrs: { 语言: "中文(普通话)", 性别: "女", 年龄: "青年", 风格: "温柔" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-05 17:20",
  },
  {
    id: "p-vo-02",
    name: "云鹤 · 沉稳男声",
    category: "voiceover",
    cover: IMG("preset-vo-2"),
    url: AUDIO,
    duration: "00:09",
    tags: ["中文", "男声", "沉稳"],
    description: "沉稳磁性的中文男声，适合品牌、科技类。",
    attrs: { 语言: "中文(普通话)", 性别: "男", 年龄: "中年", 风格: "沉稳" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-05 17:25",
  },
  {
    id: "p-vo-03",
    name: "Ava · English Female",
    category: "voiceover",
    cover: IMG("preset-vo-3"),
    url: AUDIO,
    duration: "00:08",
    tags: ["English", "Female"],
    description: "清晰自然的英文女声，适合海外投放。",
    attrs: { 语言: "English (US)", 性别: "女", 年龄: "青年", 风格: "自然" },
    status: "active",
    visibility: { kind: "plan", minPlan: "basic" },
    createdBy: "系统",
    updatedAt: "2026-06-04 11:42",
  },
  // 音效
  {
    id: "p-sfx-01",
    name: "Whoosh · 快速转场",
    category: "sfx",
    url: AUDIO,
    duration: "00:01",
    tags: ["转场", "Whoosh"],
    description: "短促 Whoosh 转场音效。",
    attrs: { 场景: "转场", 时长: "0.8s" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-03 09:00",
  },
  {
    id: "p-sfx-02",
    name: "Pop · 提示气泡",
    category: "sfx",
    url: AUDIO,
    duration: "00:01",
    tags: ["提示", "Pop"],
    description: "轻快 Pop 提示音，适合弹幕、点赞。",
    attrs: { 场景: "提示", 时长: "0.3s" },
    status: "inactive",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-02 18:15",
  },
  // 数字人
  {
    id: "p-av-01",
    name: "Luna · 商务女主播",
    category: "avatar",
    cover: IMG("preset-av-1"),
    url: VIDEO,
    tags: ["女", "商务", "1080P"],
    description: "亚洲面孔商务风女主播，支持口型驱动。",
    attrs: { 性别: "女", 风格: "商务", 口型驱动: "支持", 分辨率: "1920×1080" },
    status: "active",
    visibility: { kind: "plan", minPlan: "pro" },
    createdBy: "系统",
    updatedAt: "2026-06-09 10:05",
  },
  {
    id: "p-av-02",
    name: "Kai · 阳光男青年",
    category: "avatar",
    cover: IMG("preset-av-2"),
    url: VIDEO,
    tags: ["男", "青年", "户外"],
    description: "阳光男青年形象，适合运动、户外品类。",
    attrs: { 性别: "男", 风格: "阳光", 口型驱动: "支持", 分辨率: "1920×1080" },
    status: "active",
    visibility: { kind: "plan", minPlan: "pro" },
    createdBy: "系统",
    updatedAt: "2026-06-09 10:18",
  },
  {
    id: "p-av-03",
    name: "Mira · 二次元虚拟形象",
    category: "avatar",
    cover: IMG("preset-av-3"),
    url: VIDEO,
    tags: ["二次元", "虚拟"],
    description: "二次元风格虚拟形象，适合游戏、潮玩。",
    attrs: { 性别: "女", 风格: "二次元", 口型驱动: "支持", 分辨率: "1080×1920" },
    status: "active",
    visibility: { kind: "plan", minPlan: "flagship" },
    createdBy: "系统",
    updatedAt: "2026-06-09 10:32",
  },
  // 场景模板
  {
    id: "p-sc-01",
    name: "极简白底产品台",
    category: "scene",
    cover: IMG("preset-sc-1"),
    url: IMG("preset-sc-1"),
    tags: ["产品", "极简", "白底"],
    description: "极简白底产品展示场景，适合电商主图。",
    attrs: { 类别: "产品展示", 色调: "高亮", 构图: "居中" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-06-01 11:08",
  },
  {
    id: "p-sc-02",
    name: "都市夜景街头",
    category: "scene",
    cover: IMG("preset-sc-2"),
    url: IMG("preset-sc-2"),
    tags: ["夜景", "都市", "街头"],
    description: "霓虹氛围都市街景，适合潮流、3C 品类。",
    attrs: { 类别: "户外", 色调: "冷调", 构图: "广角" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-05-30 22:01",
  },
  // 字幕样式
  {
    id: "p-sub-01",
    name: "默认 · 白字黑描边",
    category: "subtitle-style",
    cover: IMG("preset-sub-1"),
    tags: ["通用"],
    description: "通用字幕样式，白字黑描边，可读性高。",
    attrs: { 字体: "PingFang SC", 字号: "48", 描边: "黑色 2px", 动效: "无" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-05-28 09:00",
  },
  {
    id: "p-sub-02",
    name: "综艺 · 大字弹跳",
    category: "subtitle-style",
    cover: IMG("preset-sub-2"),
    tags: ["综艺", "弹跳"],
    description: "综艺感大字幕，逐字弹跳出现。",
    attrs: { 字体: "站酷快乐体", 字号: "72", 描边: "黄色 4px", 动效: "逐字弹跳" },
    status: "active",
    visibility: { kind: "plan", minPlan: "basic" },
    createdBy: "系统",
    updatedAt: "2026-05-28 09:30",
  },
  // 转场
  {
    id: "p-tr-01",
    name: "淡入淡出",
    category: "transition",
    cover: IMG("preset-tr-1"),
    tags: ["基础"],
    description: "经典淡入淡出转场。",
    attrs: { 时长: "0.4s", 风格: "柔和" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-05-25 16:10",
  },
  {
    id: "p-tr-02",
    name: "镜头推拉",
    category: "transition",
    cover: IMG("preset-tr-2"),
    tags: ["运镜"],
    description: "模拟镜头推拉的动感转场。",
    attrs: { 时长: "0.6s", 风格: "动感" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-05-25 16:20",
  },
  // 滤镜
  {
    id: "p-lut-01",
    name: "胶片 · Kodak 暖调",
    category: "lut",
    cover: IMG("preset-lut-1"),
    tags: ["胶片", "暖调"],
    description: "经典 Kodak 胶片暖色调。",
    attrs: { 风格: "胶片", 强度: "70%" },
    status: "active",
    visibility: { kind: "all" },
    createdBy: "系统",
    updatedAt: "2026-05-24 10:00",
  },
  {
    id: "p-lut-02",
    name: "赛博朋克 · 紫青",
    category: "lut",
    cover: IMG("preset-lut-2"),
    tags: ["赛博朋克", "高对比"],
    description: "紫青双色赛博朋克风格调色。",
    attrs: { 风格: "赛博朋克", 强度: "85%" },
    status: "active",
    visibility: { kind: "plan", minPlan: "pro" },
    createdBy: "系统",
    updatedAt: "2026-05-24 10:30",
  },
];

// ---- store ----
let _items: PresetItem[] = [...INITIAL];
const _listeners = new Set<() => void>();
const emit = () => _listeners.forEach((f) => f());
const subscribe = (f: () => void) => {
  _listeners.add(f);
  return () => _listeners.delete(f);
};
const snapshot = () => _items;

export function getPresets() {
  return _items;
}
export function addPreset(p: PresetItem) {
  _items = [p, ..._items];
  emit();
}
export function updatePreset(id: string, patch: Partial<PresetItem>) {
  _items = _items.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
}
export function deletePresets(ids: string[]) {
  const set = new Set(ids);
  _items = _items.filter((p) => !set.has(p.id));
  emit();
}
export function togglePresetStatus(id: string) {
  _items = _items.map((p) =>
    p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p,
  );
  emit();
}
export function usePresetsStore(): PresetItem[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function genPresetId(category: PresetCategory) {
  const short = category.slice(0, 3);
  const ts = Date.now().toString(36).slice(-4);
  const rand = Math.random().toString(36).slice(2, 5);
  return `p-${short}-${ts}${rand}`.toLowerCase();
}

export type TagStatus = "active" | "inactive";

export interface SystemTag {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  color: string;
  order: number;
  status: TagStatus;
  description?: string;
  remark?: string;
  createdAt: string;
}

export const SYSTEM_TAGS: SystemTag[] = [
  { id: "tag-1", parentId: null, name: "test", code: "test", color: "#16A6A6", order: 0, status: "inactive", createdAt: "2026-03-19 18:00:59" },
  { id: "tag-2", parentId: null, name: "高意向", code: "high_intent", color: "#F56C6C", order: 1, status: "active", description: "潜在转化意向较高的客户", createdAt: "2026-03-20 09:12:30" },
  { id: "tag-2-1", parentId: "tag-2", name: "已加微信", code: "wechat_added", color: "#67C23A", order: 0, status: "active", createdAt: "2026-03-20 10:01:11" },
  { id: "tag-2-2", parentId: "tag-2", name: "已留资", code: "lead_collected", color: "#409EFF", order: 1, status: "active", createdAt: "2026-03-20 10:05:00" },
  { id: "tag-3", parentId: null, name: "黑名单", code: "blacklist", color: "#909399", order: 2, status: "active", description: "禁止再次触达的账号", remark: "由系统/管理员维护", createdAt: "2026-03-21 14:33:22" },
  { id: "tag-s-1", parentId: null, name: "新品促销", code: "promo_new", color: "#E6A23C", order: 10, status: "active", description: "新品上市促销期使用", createdAt: "2026-04-01 09:00:00" },
  { id: "tag-s-2", parentId: null, name: "节日问候", code: "festival_greeting", color: "#F56C6C", order: 11, status: "active", description: "节假日问候 / 祝福话术", createdAt: "2026-04-01 09:00:00" },
  { id: "tag-s-3", parentId: null, name: "售后跟进", code: "after_sales", color: "#16A6A6", order: 12, status: "active", description: "订单售后 / 满意度回访", createdAt: "2026-04-01 09:00:00" },
  { id: "tag-s-4", parentId: null, name: "新品预热", code: "preheat", color: "#9B5CFF", order: 13, status: "active", description: "上新前的预热种草", createdAt: "2026-04-01 09:00:00" },
  { id: "tag-s-5", parentId: null, name: "活动邀请", code: "event_invite", color: "#409EFF", order: 14, status: "active", description: "线上 / 线下活动邀请", createdAt: "2026-04-01 09:00:00" },
  { id: "tag-acct-1", parentId: null, name: "主账号", code: "main_account", color: "#409EFF", order: 30, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-acct-2", parentId: null, name: "IP号", code: "ip_account", color: "#9B5CFF", order: 31, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-acct-3", parentId: null, name: "矩阵号", code: "matrix_account", color: "#5470C6", order: 32, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-acct-5", parentId: null, name: "客户托管", code: "client_hosted", color: "#FF6B9A", order: 34, status: "active", description: "代客户运营的托管账号", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-biz-1", parentId: null, name: "品牌", code: "brand", color: "#FF6B9A", order: 40, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-biz-2", parentId: null, name: "种草", code: "seeding", color: "#67C23A", order: 41, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-biz-3", parentId: null, name: "出海", code: "overseas", color: "#16A6A6", order: 42, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-music", parentId: null, name: "音乐", code: "music", color: "#9B5CFF", order: 70, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-music-1", parentId: "tag-music", name: "emo音乐", code: "music_emo", color: "#5470C6", order: 0, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-music-2", parentId: "tag-music", name: "歌词音乐", code: "music_lyric", color: "#73C0DE", order: 1, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-music-4", parentId: "tag-music", name: "热门 BGM", code: "music_hot_bgm", color: "#E6A23C", order: 3, status: "active", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-st-2", parentId: null, name: "停用", code: "disabled", color: "#909399", order: 91, status: "inactive", createdAt: "2026-04-10 09:00:00" },
  { id: "tag-st-3", parentId: null, name: "高活跃", code: "high_active", color: "#67C23A", order: 92, status: "active", createdAt: "2026-04-10 09:00:00" },
];

export function getUsableTags(): SystemTag[] {
  return SYSTEM_TAGS.filter((t) => t.status === "active");
}

export function findTagByName(name: string): SystemTag | undefined {
  return SYSTEM_TAGS.find((t) => t.name === name);
}

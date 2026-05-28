import { type Platform, type TaskRow } from "@/lib/operations-store";

export type LogStatus = "success" | "failed" | "running" | "pending";

export const STATUS_LABEL: Record<LogStatus, string> = {
  success: "执行成功", failed: "执行失败", running: "执行中", pending: "待执行",
};
export const STATUS_CLS: Record<LogStatus, string> = {
  success: "bg-success/10 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  running: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export const ACTION_TYPES = [
  "gather_friend_list", "gather_unread_message", "visit_no_target",
  "send_message", "register_account", "like_post", "comment_post",
  "follow_user", "share_post", "browse_feed",
] as const;

export const EVENT_TYPES = [
  "WORK_DISPATCH_SUCCEEDED",
  "ACTION_CREATED",
  "WORK_ACK",
  "ACTION_EXECUTION",
  "RESULT_CALLBACK",
  "WORK_COMPLETED",
  "WORK_FAILED",
] as const;

type CodeDef = { code: string; desc: string };
const SUCCESS_CODE: CodeDef = { code: "0", desc: "成功" };
const FAIL_CODES: CodeDef[] = [
  { code: "999900", desc: "不支持的操作类型" },
  { code: "100401", desc: "登录态过期" },
  { code: "100503", desc: "请求被平台限流" },
  { code: "100404", desc: "目标内容不存在" },
  { code: "100500", desc: "执行节点超时" },
];

export type LogRow = {
  id: string;
  subTaskId: string;
  subIndex: number;
  account: string;
  actionType: string;
  eventType: string;
  target: string;
  platform: string;
  statusCode: string;
  statusCodeDesc: string;
  content: string;
  ts: string;
  status: LogStatus;
  platformBadge: Platform;
};

export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export function platformText(p: string) {
  const map: Record<string, string> = {
    "Facebook": "facebook", "TikTok": "tiktok", "Instagram": "instagram",
    "X": "x", "Twitter": "x", "微信": "wechat", "抖音": "douyin",
    "小红书": "xiaohongshu", "快手": "kuaishou", "微博": "weibo",
    "B站": "bilibili", "哔哩哔哩": "bilibili",
  };
  return map[p] ?? p.toLowerCase();
}

function mkRow(
  subId: string, evt: string, account: string, actionType: string, eventType: string,
  target: string, platform: string, platformBadge: Platform,
  code: string, codeDesc: string, content: string, ts: string, status: LogStatus,
): LogRow {
  return {
    id: `${subId}-${evt}`, subTaskId: subId, subIndex: 0, account, actionType, eventType,
    target, platform, platformBadge, statusCode: code, statusCodeDesc: codeDesc,
    content, ts, status,
  };
}

export function buildLogs(t: TaskRow): LogRow[] {
  const rows: LogRow[] = [];
  const total = t.total;
  const done = t.done;
  const failed = t.failed;
  const running = t.status === "running" ? Math.min(2, total - done - failed) : 0;
  const baseDate = (t.createdAt.split(" ")[0] || "2026-04-22");
  const [bh, bm, bs] = (t.createdAt.split(" ")[1] || "14:12:00").split(":").map(Number);
  const baseSeq = Number(t.id.slice(-6)) || 111000;

  const fmt = (offset: number) => {
    const total2 = (bh * 3600 + bm * 60 + bs + offset) % 86400;
    return `${baseDate} ${pad(Math.floor(total2 / 3600))}:${pad(Math.floor((total2 % 3600) / 60))}:${pad(total2 % 60)}`;
  };

  for (let i = 0; i < total; i++) {
    const before = rows.length;
    const h = hash(`${t.id}|${i}`);
    const platform = t.platforms[h % t.platforms.length];
    const actionType = ACTION_TYPES[(h >> 3) % ACTION_TYPES.length];
    const accountNo = `6${String(1500000000000 + ((h >> 6) % 99999999999))}`.slice(0, 14);
    const subId = String(baseSeq + i * 7);
    let subStatus: LogStatus;
    if (i < done) subStatus = "success";
    else if (i < done + failed) subStatus = "failed";
    else if (i < done + failed + running) subStatus = "running";
    else subStatus = "pending";

    const failCode = FAIL_CODES[(h >> 9) % FAIL_CODES.length];
    const hasTargetJson = (h >> 12) % 4 !== 0;
    const target = hasTargetJson
      ? `{"account": "6${String(1500000000000 + ((h >> 15) % 99999999999)).slice(0, 13)}"}`
      : "--";
    const pf = platformText(platform);
    const baseOffset = i * 60;

    rows.push(mkRow(subId, "e1", accountNo, actionType, "WORK_DISPATCH_SUCCEEDED",
      target, pf, platform, "0", "成功",
      "Work dispatched successfully", fmt(baseOffset + 0), "success"));
    rows.push(mkRow(subId, "e2", accountNo, actionType, "ACTION_CREATED",
      target, pf, platform, "0", "成功",
      `自动调度创建 ${actionType} Work,时长 7 分钟`, fmt(baseOffset + 1), "success"));

    if (subStatus === "pending") {
      rows.push(mkRow(subId, "e3", accountNo, actionType, "WORK_ACK",
        target, pf, platform, "--", "--",
        "work pending dispatch", fmt(baseOffset + 2), "pending"));
      continue;
    }
    rows.push(mkRow(subId, "e3", accountNo, actionType, "WORK_ACK",
      target, pf, platform, "0", "成功",
      "work received", fmt(baseOffset + 2), "success"));

    if (subStatus === "running") {
      rows.push(mkRow(subId, "e4", accountNo, actionType, "ACTION_EXECUTION",
        target, pf, platform, "--", "--",
        `${actionType} executing on node`, fmt(baseOffset + 8), "running"));
      continue;
    }
    rows.push(mkRow(subId, "e4", accountNo, actionType, "ACTION_EXECUTION",
      target, pf, platform, "0", "成功",
      "收到 ACTION_EXECUTION 回调", fmt(baseOffset + 10), "success"));

    if (subStatus === "success") {
      rows.push(mkRow(subId, "e5", accountNo, actionType, "RESULT_CALLBACK",
        target, pf, platform, SUCCESS_CODE.code, SUCCESS_CODE.desc,
        `${actionType} executed successfully`, fmt(baseOffset + 12), "success"));
      rows.push(mkRow(subId, "e6", accountNo, actionType, "WORK_COMPLETED",
        target, pf, platform, "0", "成功",
        "Work completed", fmt(baseOffset + 14), "success"));
    } else {
      rows.push(mkRow(subId, "e5", accountNo, actionType, "RESULT_CALLBACK",
        target, pf, platform, failCode.code, failCode.desc,
        `${actionType} failed: ${failCode.desc}`, fmt(baseOffset + 12), "failed"));
      rows.push(mkRow(subId, "e6", accountNo, actionType, "WORK_FAILED",
        target, pf, platform, failCode.code, failCode.desc,
        `Work failed: ${failCode.desc}`, fmt(baseOffset + 14), "failed"));
    }
    for (let k = before; k < rows.length; k++) rows[k].subIndex = i;
  }
  return rows;
}

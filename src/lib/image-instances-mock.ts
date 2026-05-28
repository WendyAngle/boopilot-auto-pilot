// 镜像实例 mock 数据 — 供「资源管理-镜像实例」页 与「托管账号-设置镜像实例」弹窗共用

export type CloudStatus =
  | "in_use"
  | "mounted"
  | "mounting"
  | "unmounting"
  | "pending"
  | "abnormal";

export const CLOUD_STATUS_LABEL: Record<CloudStatus, string> = {
  in_use: "使用中",
  mounted: "已挂载",
  mounting: "挂载中",
  unmounting: "卸载中",
  pending: "待挂载",
  abnormal: "异常",
};

export interface CloudInstance {
  id: string;
  index: number;
  instanceId: string;
  instanceName: string;
  capacity: number; // GB
  used: number;
  runningVm?: string;
  recentVm?: string;
  proxyIp: string;
  serviceNode: string;
  serviceNodeName: string;
  createdBy: string;
  updatedAt: string;
  status: CloudStatus;
}

export type FpStatus = "available" | "in_use" | "unused" | "abnormal";

export const FP_STATUS_LABEL: Record<FpStatus, string> = {
  available: "可用",
  in_use: "使用中",
  unused: "未使用",
  abnormal: "异常",
};

export interface FpResource {
  id: string;
  index: number;
  resourceId: string;
  resourceName: string;
  capacity: number; // GB
  bucket: string;
  path: string;
  proxyIp: string;
  createdBy: string;
  vm?: string;
  updatedAt: string;
  status: FpStatus;
  boundIp: boolean;
}

const NAMES = [
  "image-test-004-1",
  "image-test-009-1",
  "132123-1",
  "image_test_0021-1",
  "image-test-003-1",
  "test-1-27-i2-1",
  "image-test-008-1",
  "tiktok-test-001",
  "test-1-13-i2-1",
];
const VMS = [
  "test-1-13-i2",
  "test-1-5-i3",
  "test-1-27-i3",
  "test-1-1-i3",
  "test-1-19-i1",
  "test-1-24-i1",
  "test-1-7-i2",
  "",
];
const IPS = [
  "23.95.228.2",
  "192.3.176.155",
  "23.95.228.1",
  "23.95.10.28",
  "192.3.176.158",
  "23.95.10.26",
  "23.95.228.5",
  "192.3.176.156",
];
const USERS = ["--", "admin", "wyf", "--", "admin", "--", "admin", "wyf", "--"];

export function seedCloudInstances(): CloudInstance[] {
  return Array.from({ length: 9 }, (_, i) => {
    const idx = i + 1;
    const statusPool: CloudStatus[] = [
      "in_use",
      "in_use",
      "pending",
      "in_use",
      "in_use",
      "pending",
      "in_use",
      "mounted",
      "pending",
    ];
    const status = statusPool[i % statusPool.length];
    const running = i % 3 === 2 ? "" : VMS[i % VMS.length];
    return {
      id: `cloud-${idx}`,
      index: idx,
      instanceId: `2057009125105${String(1000 + i)}`.slice(0, 17),
      instanceName: NAMES[i % NAMES.length],
      capacity: [10, 15, 1, 10, 10, 10, 10, 15, 10][i],
      used: 0,
      runningVm: running || undefined,
      recentVm: VMS[(i + 2) % VMS.length] || undefined,
      proxyIp: IPS[i % IPS.length],
      serviceNode: "172.30.11.173",
      serviceNodeName: "boo-node-shenzhen-01",
      createdBy: USERS[i % USERS.length],
      updatedAt: `2026-05-26 ${String(17 - (i % 8)).padStart(2, "0")}:${String(
        55 - i * 3,
      ).padStart(2, "0")}:${String(16 + i).padStart(2, "0")}`,
      status,
    };
  });
}

export function seedFpResources(): FpResource[] {
  return [
    {
      id: "fp-1",
      index: 1,
      resourceId: "2057418712428152345",
      resourceName: "tiktok-test-001",
      capacity: 2,
      bucket: "matrix",
      path: "/fingerprintBrowserFiles/resources/tiktok-test-001",
      proxyIp: "23.95.228.5",
      createdBy: "-",
      vm: undefined,
      updatedAt: "2026-05-21 19:10:21",
      status: "available",
      boundIp: true,
    },
    {
      id: "fp-2",
      index: 2,
      resourceId: "2056625819813098765",
      resourceName: "12313-weqwe.qwedqw",
      capacity: 2,
      bucket: "matrix",
      path: "/fingerprintBrowserFiles/resources/12313-weqwe-qwedqw",
      proxyIp: "192.3.176.156",
      createdBy: "wyf",
      vm: undefined,
      updatedAt: "2026-05-19 14:39:41",
      status: "available",
      boundIp: true,
    },
    {
      id: "fp-3",
      index: 3,
      resourceId: "2056625819813098766",
      resourceName: "fp-instance-003",
      capacity: 2,
      bucket: "matrix",
      path: "/fingerprintBrowserFiles/resources/fp-003",
      proxyIp: "23.95.10.26",
      createdBy: "admin",
      vm: "test-1-7-i2",
      updatedAt: "2026-05-18 09:12:30",
      status: "in_use",
      boundIp: true,
    },
    {
      id: "fp-4",
      index: 4,
      resourceId: "2056625819813098770",
      resourceName: "fp-instance-004",
      capacity: 2,
      bucket: "matrix",
      path: "/fingerprintBrowserFiles/resources/fp-004",
      proxyIp: "23.95.228.1",
      createdBy: "admin",
      vm: "test-1-13-i2",
      updatedAt: "2026-05-20 10:24:11",
      status: "in_use",
      boundIp: true,
    },
    {
      id: "fp-5",
      index: 5,
      resourceId: "2056625819813098771",
      resourceName: "fp-instance-005",
      capacity: 2,
      bucket: "matrix",
      path: "/fingerprintBrowserFiles/resources/fp-005",
      proxyIp: "192.3.176.158",
      createdBy: "wyf",
      vm: "test-1-5-i3",
      updatedAt: "2026-05-22 16:08:55",
      status: "in_use",
      boundIp: true,
    },
    {
      id: "fp-6",
      index: 6,
      resourceId: "2056625819813098772",
      resourceName: "fp-instance-006",
      capacity: 2,
      bucket: "matrix",
      path: "/fingerprintBrowserFiles/resources/fp-006",
      proxyIp: "23.95.228.2",
      createdBy: "admin",
      vm: "test-1-27-i3",
      updatedAt: "2026-05-23 11:45:02",
      status: "in_use",
      boundIp: true,
    },
  ];
}


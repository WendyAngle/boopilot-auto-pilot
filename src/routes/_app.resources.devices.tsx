import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  RotateCw,
  Eye,
  MonitorSmartphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Server,
  Cloud,
  MonitorCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ClipboardPaste,
  Camera,
  Plus,
  Minus,
  Lock,
  LayoutGrid,
  Home,
  ArrowLeft,
  Power,
  Square as SquareIcon,
  Triangle,
  Circle,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationBar } from "@/components/pagination-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/resources/devices")({
  component: DeviceList,
  head: () => ({
    meta: [
      { title: "设备列表 — BooPilot" },
      { name: "description", content: "统一管理云机与 Windows 虚拟机资源" },
    ],
  }),
});

/* ============================================================ */
/* 类型 & Mock                                                  */
/* ============================================================ */

type RunStatus = "running" | "stopped";
type MountStatus = "in_use" | "idle";

interface CloudVm {
  id: string;
  index: number;
  vmId: string;
  vmName: string;
  source: "雅安" | "圣何塞";
  host: string;
  status: RunStatus;
  mount: MountStatus;
  roomId: string;
  ip: string;
  syncTime: string;
  cpuCores: number;
  memGB: number;
  diskGB: number;
  os: string;
  uptime: string;
  imageTpl: string;
  deployTime: string;
}

interface WinVm {
  id: string;
  index: number;
  vmId: string;
  vmName: string;
  ip: string;
  host: string;
  status: RunStatus;
  bizStatus: string;
  occupyStatus: "idle" | "busy";
  online: string;
  lastHeartbeat: string;
  source: "PVE 同步";
  machineVersion: string;
  deployTime: string;
  cpuCores: number;
  cpuPct: number;
  memUsed: string;
  memTotal: string;
  diskUsed: string;
  diskTotal: string;
  os: string;
  uptime: string;
  syncTime: string;
}

const SOURCES = ["雅安", "圣何塞"] as const;
const HOSTS_CLOUD = ["yaan-test", "sjc-test", "yaan-prod"];
const HOSTS_WIN = ["pve", "yh-pve3", "yh-pve4", "yh-pve5"];

const seedCloud = (): CloudVm[] => {
  const rows: CloudVm[] = [];
  for (let i = 1; i <= 110; i++) {
    const source = SOURCES[i % 2];
    const status: RunStatus = i % 13 === 0 ? "stopped" : "running";
    rows.push({
      id: `c-${i}`,
      index: i,
      vmId: `yaan-test-${(i * 9301 + 49297).toString(36).slice(-7)}`,
      vmName: `test-1-${(i % 20) + 1}-i${(i % 4) + 1}`,
      source,
      host: HOSTS_CLOUD[i % HOSTS_CLOUD.length],
      status,
      mount: i % 9 === 0 ? "idle" : "in_use",
      roomId: `KxRfgJSdsEE${((i * 131) % 9999).toString(36)}`,
      ip: `172.31.50.${70 + (i % 50)}`,
      syncTime: `2026-04-27 16:${String(28 - (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      cpuCores: 2,
      memGB: 3,
      diskGB: 4,
      os: "Android 13",
      uptime: status === "running" ? `${(i % 9) + 1}d ${i % 60}m` : "-",
      imageTpl: "V1.0.42",
      deployTime: "2026-04-23 19:38:24",
    });
  }
  return rows;
};

const seedWin = (): WinVm[] => {
  const rows: WinVm[] = [];
  for (let i = 1; i <= 253; i++) {
    const status: RunStatus = i % 4 === 0 ? "stopped" : "running";
    rows.push({
      id: `w-${i}`,
      index: i,
      vmId: String(110 + i),
      vmName: i % 17 === 0 ? "sml" : `win10-${110 + i}`,
      ip: i % 23 === 0 ? "-" : `172.30.${21 + (i % 3)}.${(i * 7) % 250}`,
      host: HOSTS_WIN[i % HOSTS_WIN.length],
      status,
      bizStatus: "-",
      occupyStatus: i % 5 === 0 ? "busy" : "idle",
      online: "-",
      lastHeartbeat: "-",
      source: "PVE 同步",
      machineVersion: "-",
      deployTime: `2026-04-27 16:${String(55 + (i % 5)).padStart(2, "0")}:${String((i * 3) % 60).padStart(2, "0")}`,
      cpuCores: (i % 4) + 2,
      cpuPct: (i * 13) % 100,
      memUsed: i % 7 === 0 ? "3.5 GB" : i % 5 === 0 ? "4 GB" : "0 B",
      memTotal: i % 5 === 0 ? "8 GB" : "4 GB",
      diskUsed: "0 B",
      diskTotal: "40 GB",
      os: "Windows",
      uptime:
        status === "running" ? (i % 11 === 0 ? `${i % 9}d ${i % 60}m` : "0m") : "-",
      syncTime: `2026-04-27 16:${String(55 + (i % 5)).padStart(2, "0")}:${String((i * 3) % 60).padStart(2, "0")}`,
    });
  }
  return rows;
};

/* ============================================================ */
/* 主页面                                                       */
/* ============================================================ */

function DeviceList() {
  const [tab, setTab] = useState<"cloud" | "win">("cloud");
  const [cloudVms] = useState<CloudVm[]>(seedCloud);
  const [winVms] = useState<WinVm[]>(seedWin);

  const stats = useMemo(() => {
    const cloudRun = cloudVms.filter((v) => v.status === "running").length;
    const winRun = winVms.filter((v) => v.status === "running").length;
    return {
      total: cloudVms.length + winVms.length,
      cloudRun,
      cloudTotal: cloudVms.length,
      winRun,
      winTotal: winVms.length,
      abnormal: 0,
    };
  }, [cloudVms, winVms]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-w-0 space-y-6">
        {/* 顶部标题 */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                设备列表
              </h2>
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                设备资源池
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              统一管理云机与 Windows 虚拟机资源，支持详情查看与远程控制。
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigStatCard
            title="设备总数"
            value={stats.total.toString()}
            hint="所有虚拟机总数"
            icon={Server}
            tone="primary"
          />
          <RatioStatCard
            title="云机数量"
            current={stats.cloudRun}
            total={stats.cloudTotal}
            hint="运行/总数"
            icon={Cloud}
            tone1="success"
            tone2="primary"
          />
          <RatioStatCard
            title="Windows 数量"
            current={stats.winRun}
            total={stats.winTotal}
            hint="运行/总数"
            icon={MonitorCheck}
            tone1="success"
            tone2="violet"
          />
          <BigStatCard
            title="异常数量"
            value={stats.abnormal.toString()}
            hint="云机异常 + Windows 异常"
            icon={AlertTriangle}
            tone="destructive"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "cloud" | "win")}>
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border/60 bg-transparent p-0">
            <TabsTrigger
              value="cloud"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              云机
            </TabsTrigger>
            <TabsTrigger
              value="win"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Windows 虚拟机
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "cloud" ? (
          <CloudTab data={cloudVms} />
        ) : (
          <WinTab data={winVms} />
        )}
      </div>
    </TooltipProvider>
  );
}

/* ============================================================ */
/* 云机 Tab                                                     */
/* ============================================================ */

function CloudTab({ data }: { data: CloudVm[] }) {
  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [hostFilter, setHostFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<CloudVm | null>(null);
  const [remote, setRemote] = useState<CloudVm | null>(null);

  const filtered = useMemo(() => {
    return data.filter((v) => {
      if (
        keyword &&
        !`${v.vmId}${v.vmName}${v.ip}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      )
        return false;
      if (sourceFilter !== "all" && v.source !== sourceFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (hostFilter !== "all" && v.host !== hostFilter) return false;
      return true;
    });
  }, [data, keyword, sourceFilter, statusFilter, hostFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allChecked =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const toggleAll = () => {
    if (allChecked)
      setSelected(selected.filter((id) => !pageRows.some((r) => r.id === id)));
    else setSelected([...new Set([...selected, ...pageRows.map((r) => r.id)])]);
  };

  const handleReset = () => {
    setKeyword("");
    setSourceFilter("all");
    setStatusFilter("all");
    setHostFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 筛选条 */}
      <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-sm text-muted-foreground">
              关键字：
            </Label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="实例 ID / 名称 / IP"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-sm text-muted-foreground">
              来源：
            </Label>
            <Select
              value={sourceFilter}
              onValueChange={(v) => {
                setSourceFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="全部来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage(1)}>
              <Search className="h-4 w-4" />
              搜索
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCw className="h-4 w-4" />
              重置
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => setExpanded((e) => !e)}
            className="text-primary"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {expanded ? "收起" : "展开"}
          </Button>
        </div>
        {expanded && (
          <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-sm text-muted-foreground">
                状态：
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as RunStatus | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="stopped">停止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm text-muted-foreground">
                所属主机：
              </Label>
              <Select
                value={hostFilter}
                onValueChange={(v) => {
                  setHostFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部主机</SelectItem>
                  {HOSTS_CLOUD.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {selected.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-medium text-primary">
              已选 {selected.length} 项
            </span>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              取消选择
            </Button>
          </div>
        )}
      </div>

      {/* 操作工具栏 */}
      <div className="flex flex-wrap items-center justify-start gap-2">
        <Button
          variant="outline"
          onClick={() =>
            toast.success("同步雅安", { description: "已发起雅安数据同步任务。" })
          }
        >
          <RefreshCw className="h-4 w-4" />
          同步雅安
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success("同步圣何塞", {
              description: "已发起圣何塞数据同步任务。",
            })
          }
        >
          <RefreshCw className="h-4 w-4" />
          同步圣何塞
        </Button>
      </div>

      {/* 列表 */}
      <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-max [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 pl-4">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[200px]">虚拟机 ID</TableHead>
                <TableHead className="w-[140px]">虚拟机名称</TableHead>
                <TableHead className="w-[100px]">来源</TableHead>
                <TableHead className="w-[120px]">所属主机</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[110px]">挂载状态</TableHead>
                <TableHead className="w-[180px]">房间ID</TableHead>
                <TableHead className="w-[140px]">IP 地址</TableHead>
                <TableHead className="w-[170px]">同步时间</TableHead>
                <TableHead className="w-[90px]">CPU 核数</TableHead>
                <TableHead className="w-[100px]">内存 (GB)</TableHead>
                <TableHead className="w-[100px]">磁盘 (GB)</TableHead>
                <TableHead className="w-[140px]">操作系统版本</TableHead>
                <TableHead className="w-[100px]">运行时长</TableHead>
                <TableHead className="w-[110px]">镜像模板</TableHead>
                <TableHead className="w-[170px]">部署时间</TableHead>
                <TableHead className="sticky right-0 z-10 w-[180px] bg-card pr-4 text-center shadow-[-8px_0_12px_-8px_oklch(0.20_0.04_240_/0.10)]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={19}
                    className="h-40 text-center text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.includes(v.id)}
                        onCheckedChange={(c) =>
                          setSelected((p) =>
                            c ? [...p, v.id] : p.filter((id) => id !== v.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {v.index}
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                        {v.vmId}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {v.vmName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full border-primary/30 bg-primary/10 font-medium text-primary"
                      >
                        {v.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {v.host}
                    </TableCell>
                    <TableCell>
                      <RunStatusBadge status={v.status} />
                    </TableCell>
                    <TableCell>
                      <MountBadge mount={v.mount} />
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                        {v.roomId}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {v.ip}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.syncTime}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {v.cpuCores}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {v.memGB} GB
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {v.diskGB}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {v.os}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.uptime}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {v.imageTpl}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.deployTime}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 bg-card pr-4 shadow-[-8px_0_12px_-8px_oklch(0.20_0.04_240_/0.10)]">
                      <div className="flex flex-nowrap items-center justify-center gap-x-3 whitespace-nowrap">
                        <TextActionBtn
                          label="详情"
                          icon={Eye}
                          onClick={() => setViewing(v)}
                        />
                        <TextActionBtn
                          label="远程控制"
                          icon={MonitorSmartphone}
                          onClick={() => setRemote(v)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          setPage={setPage}
        />
      </div>

      <CloudVmDetailDialog vm={viewing} onClose={() => setViewing(null)} />
      <RemoteDialog
        kind="cloud"
        name={remote?.vmName ?? ""}
        ip={remote?.ip ?? ""}
        machineId={remote?.vmId ?? ""}
        open={!!remote}
        onClose={() => setRemote(null)}
      />
    </div>
  );
}

/* ============================================================ */
/* Windows Tab                                                  */
/* ============================================================ */

function WinTab({ data }: { data: WinVm[] }) {
  const [keyword, setKeyword] = useState("");
  const [hostFilter, setHostFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [occupyFilter, setOccupyFilter] = useState<"all" | "idle" | "busy">(
    "all",
  );
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<WinVm | null>(null);
  const [remote, setRemote] = useState<WinVm | null>(null);

  const filtered = useMemo(() => {
    return data.filter((v) => {
      if (
        keyword &&
        !`${v.vmId}${v.vmName}${v.ip}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      )
        return false;
      if (hostFilter !== "all" && v.host !== hostFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (occupyFilter !== "all" && v.occupyStatus !== occupyFilter)
        return false;
      return true;
    });
  }, [data, keyword, hostFilter, statusFilter, occupyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allChecked =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const toggleAll = () => {
    if (allChecked)
      setSelected(selected.filter((id) => !pageRows.some((r) => r.id === id)));
    else setSelected([...new Set([...selected, ...pageRows.map((r) => r.id)])]);
  };

  const handleReset = () => {
    setKeyword("");
    setHostFilter("all");
    setStatusFilter("all");
    setOccupyFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 筛选条 */}
      <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-sm text-muted-foreground">
              关键字：
            </Label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="实例 ID / 名称 / IP"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0 text-sm text-muted-foreground">
              所属主机：
            </Label>
            <Select
              value={hostFilter}
              onValueChange={(v) => {
                setHostFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="节点名称 / 节点 ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部主机</SelectItem>
                {HOSTS_WIN.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage(1)}>
              <Search className="h-4 w-4" />
              搜索
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCw className="h-4 w-4" />
              重置
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => setExpanded((e) => !e)}
            className="text-primary"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {expanded ? "收起" : "展开"}
          </Button>
        </div>
        {expanded && (
          <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-sm text-muted-foreground">
                状态：
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as RunStatus | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="stopped">停止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm text-muted-foreground">
                占用状态：
              </Label>
              <Select
                value={occupyFilter}
                onValueChange={(v) => {
                  setOccupyFilter(v as "all" | "idle" | "busy");
                  setPage(1);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="idle">空闲</SelectItem>
                  <SelectItem value="busy">占用中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {selected.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-medium text-primary">
              已选 {selected.length} 项
            </span>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              取消选择
            </Button>
          </div>
        )}
      </div>

      {/* 操作工具栏 */}
      <div className="flex flex-wrap items-center justify-start gap-2">
        <Button
          variant="outline"
          onClick={() =>
            toast.success("同步数据", {
              description: "已发起 Windows 虚拟机数据同步。",
            })
          }
        >
          <RefreshCw className="h-4 w-4" />
          同步数据
        </Button>
      </div>

      {/* 列表 */}
      <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-max [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 pl-4">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[100px]">虚拟机 ID</TableHead>
                <TableHead className="w-[140px]">虚拟机名称</TableHead>
                <TableHead className="w-[140px]">IP 地址</TableHead>
                <TableHead className="w-[120px]">所属主机</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[100px]">业务状态</TableHead>
                <TableHead className="w-[100px]">占用状态</TableHead>
                <TableHead className="w-[100px]">在线状态</TableHead>
                <TableHead className="w-[110px]">最后心跳</TableHead>
                <TableHead className="w-[100px]">来源</TableHead>
                <TableHead className="w-[110px]">机器版本</TableHead>
                <TableHead className="w-[170px]">部署时间</TableHead>
                <TableHead className="w-[100px]">CPU 核数</TableHead>
                <TableHead className="w-[160px]">CPU (%)</TableHead>
                <TableHead className="w-[140px]">内存 (GB)</TableHead>
                <TableHead className="w-[140px]">磁盘 (GB)</TableHead>
                <TableHead className="w-[120px]">操作系统版本</TableHead>
                <TableHead className="w-[100px]">运行时长</TableHead>
                <TableHead className="w-[170px]">同步时间</TableHead>
                <TableHead className="sticky right-0 z-10 w-[180px] bg-card pr-4 text-center shadow-[-8px_0_12px_-8px_oklch(0.20_0.04_240_/0.10)]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={22}
                    className="h-40 text-center text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.includes(v.id)}
                        onCheckedChange={(c) =>
                          setSelected((p) =>
                            c ? [...p, v.id] : p.filter((id) => id !== v.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {v.index}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {v.vmId}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {v.vmName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {v.ip}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {v.host}
                    </TableCell>
                    <TableCell>
                      <RunStatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.bizStatus}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full font-medium",
                          v.occupyStatus === "busy"
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {v.occupyStatus === "busy" ? "占用中" : "空闲"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.online}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.lastHeartbeat}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full border-violet-300/40 bg-violet-500/10 font-medium text-violet-600"
                      >
                        {v.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.machineVersion}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.deployTime}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {v.cpuCores}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full",
                              v.cpuPct >= 80
                                ? "bg-destructive"
                                : v.cpuPct >= 60
                                  ? "bg-warning"
                                  : "bg-primary",
                            )}
                            style={{ width: `${v.cpuPct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {v.cpuPct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-foreground">
                      {v.memUsed} / {v.memTotal}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-foreground">
                      {v.diskUsed} / {v.diskTotal}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {v.os}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.uptime}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.syncTime}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 bg-card pr-4 shadow-[-8px_0_12px_-8px_oklch(0.20_0.04_240_/0.10)]">
                      <div className="flex flex-nowrap items-center justify-center gap-x-3 whitespace-nowrap">
                        <TextActionBtn
                          label="详情"
                          icon={Eye}
                          onClick={() => setViewing(v)}
                        />
                        <TextActionBtn
                          label="远程控制"
                          icon={MonitorSmartphone}
                          onClick={() => setRemote(v)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          setPage={setPage}
        />
      </div>

      <WinVmDetailDialog vm={viewing} onClose={() => setViewing(null)} />
      <RemoteDialog
        name={remote?.vmName ?? ""}
        ip={remote?.ip ?? ""}
        open={!!remote}
        onClose={() => setRemote(null)}
      />
    </div>
  );
}

/* ============================================================ */
/* 子组件                                                       */
/* ============================================================ */

function BigStatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: "primary" | "destructive" | "success" | "violet" | "warning";
}) {
  const toneCls = {
    primary: "from-primary/15 to-primary/5 text-primary",
    success: "from-success/15 to-success/5 text-success",
    warning: "from-warning/15 to-warning/5 text-warning",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-600",
    destructive: "from-destructive/15 to-destructive/5 text-destructive",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tabular-nums",
              tone === "destructive" ? "text-destructive" : "text-foreground",
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className={cn("rounded-xl bg-gradient-to-br p-2.5", toneCls)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function RatioStatCard({
  title,
  current,
  total,
  hint,
  icon: Icon,
  tone1,
  tone2,
}: {
  title: string;
  current: number;
  total: number;
  hint: string;
  icon: LucideIcon;
  tone1: "success" | "primary";
  tone2: "primary" | "violet";
}) {
  const c1 = { success: "text-success", primary: "text-primary" }[tone1];
  const c2 = { primary: "text-primary", violet: "text-violet-600" }[tone2];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            <span className={c1}>{current}</span>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className={c2}>{total}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: RunStatus }) {
  if (status === "running")
    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full border-success/30 bg-success/10 font-medium text-success"
      >
        <CheckCircle2 className="h-3 w-3" />
        运行中
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-full border-destructive/30 bg-destructive/10 font-medium text-destructive"
    >
      <XCircle className="h-3 w-3" />
      停止
    </Badge>
  );
}

function MountBadge({ mount }: { mount: MountStatus }) {
  if (mount === "in_use")
    return (
      <Badge
        variant="outline"
        className="rounded-full border-success/30 bg-success/10 font-medium text-success"
      >
        使用中
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="rounded-full border-border bg-muted font-medium text-muted-foreground"
    >
      空闲
    </Badge>
  );
}

function TextActionBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-primary transition-colors hover:text-primary/80"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}


function CloudVmDetailDialog({
  vm,
  onClose,
}: {
  vm: CloudVm | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!vm} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>云机详情</DialogTitle>
          <DialogDescription>查看云机完整运行信息。</DialogDescription>
        </DialogHeader>
        {vm && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <DetailRow
              label="虚拟机 ID"
              value={<span className="font-mono">{vm.vmId}</span>}
            />
            <DetailRow label="虚拟机名称" value={vm.vmName} />
            <DetailRow label="来源" value={vm.source} />
            <DetailRow label="所属主机" value={vm.host} />
            <DetailRow label="状态" value={<RunStatusBadge status={vm.status} />} />
            <DetailRow label="挂载状态" value={<MountBadge mount={vm.mount} />} />
            <DetailRow
              label="IP 地址"
              value={<span className="font-mono">{vm.ip}</span>}
            />
            <DetailRow
              label="房间ID"
              value={<span className="font-mono">{vm.roomId}</span>}
            />
            <DetailRow label="CPU 核数" value={vm.cpuCores} />
            <DetailRow label="内存" value={`${vm.memGB} GB`} />
            <DetailRow label="磁盘" value={`${vm.diskGB} GB`} />
            <DetailRow label="操作系统" value={vm.os} />
            <DetailRow label="镜像模板" value={vm.imageTpl} />
            <DetailRow label="运行时长" value={vm.uptime} />
            <DetailRow label="部署时间" value={vm.deployTime} />
            <DetailRow label="同步时间" value={vm.syncTime} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WinVmDetailDialog({
  vm,
  onClose,
}: {
  vm: WinVm | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!vm} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Windows 虚拟机详情</DialogTitle>
          <DialogDescription>
            查看 Windows 虚拟机完整运行信息。
          </DialogDescription>
        </DialogHeader>
        {vm && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <DetailRow label="虚拟机 ID" value={vm.vmId} />
            <DetailRow label="虚拟机名称" value={vm.vmName} />
            <DetailRow
              label="IP 地址"
              value={<span className="font-mono">{vm.ip}</span>}
            />
            <DetailRow label="所属主机" value={vm.host} />
            <DetailRow label="状态" value={<RunStatusBadge status={vm.status} />} />
            <DetailRow
              label="占用状态"
              value={vm.occupyStatus === "busy" ? "占用中" : "空闲"}
            />
            <DetailRow label="来源" value={vm.source} />
            <DetailRow label="机器版本" value={vm.machineVersion} />
            <DetailRow label="CPU 核数" value={vm.cpuCores} />
            <DetailRow label="CPU (%)" value={`${vm.cpuPct}%`} />
            <DetailRow label="内存" value={`${vm.memUsed} / ${vm.memTotal}`} />
            <DetailRow label="磁盘" value={`${vm.diskUsed} / ${vm.diskTotal}`} />
            <DetailRow label="操作系统" value={vm.os} />
            <DetailRow label="运行时长" value={vm.uptime} />
            <DetailRow label="部署时间" value={vm.deployTime} />
            <DetailRow label="同步时间" value={vm.syncTime} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoteDialog({
  name,
  ip,
  open,
  onClose,
}: {
  name: string;
  ip: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MonitorSmartphone className="h-4 w-4 text-primary" />
            远程控制 · {name}
          </DialogTitle>
          <DialogDescription>
            正在连接到 <span className="font-mono">{ip}</span>，请稍候...
          </DialogDescription>
        </DialogHeader>
        <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-gradient-to-br from-foreground/5 to-foreground/10">
          <div className="space-y-3 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MonitorSmartphone className="h-7 w-7 animate-pulse text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              远程桌面会话连接中...
            </p>
            <p className="font-mono text-xs text-muted-foreground">{ip}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            断开连接
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

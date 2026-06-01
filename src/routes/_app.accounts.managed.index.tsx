import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import {
  Plus,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Pencil,
  Trash2,
  Upload,
  Download,
  Eye,
  Users2,
  Building,
  Tag as TagIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Power,
  MonitorSmartphone,
  UserPlus,
  ShieldCheck,
  Clock,
  Sparkles,
  Server,
  Bell,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getUsableTags, findTagByName } from "@/lib/systemTags";
import { useTenantScope } from "@/lib/tenant-scope";
import {
  type Platform,
  type AccountStatus,
  type DeviceType,
  type ManagedAccount,
  PLATFORMS,
  PLATFORM_META,
  ACCOUNT_STATUS_META,
  ACTIVE_TENANTS,
  OPERATORS,
  PERSONAS,
  COUNTRIES,
  seedManagedAccounts,
} from "@/lib/managed-account-mock";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  seedCloudInstances,
  seedFpResources,
} from "@/lib/image-instances-mock";


export const Route = createFileRoute("/_app/accounts/managed/")({
  component: ManagedAccountsPage,
  head: () => ({
    meta: [
      { title: "托管账号 — BooPilot" },
      { name: "description", content: "管理由 BooPilot 托管运营的业务账号。" },
    ],
  }),
});



/* ============================================================ */
/* 主页面                                                       */
/* ============================================================ */

function ManagedAccountsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ManagedAccount[]>(() =>
    seedManagedAccounts(),
  );
  const [tenantScope] = useTenantScope();

  // 筛选
  const [keyword, setKeyword] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingFilter, setPendingFilter] = useState("all");
  
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tenantScope !== "all" && r.tenantId !== tenantScope) return false;
      if (platformFilter !== "all" && r.platform !== platformFilter)
        return false;
      if (tenantFilter !== "all" && r.tenantId !== tenantFilter) return false;
      if (statusFilter !== "all" && r.accountStatus !== statusFilter)
        return false;
      if (pendingFilter === "yes" && !r.pending) return false;
      if (pendingFilter === "no" && r.pending) return false;
      if (
        keyword &&
        !r.username.toLowerCase().includes(keyword.toLowerCase()) &&
        !r.platformId.includes(keyword) &&
        !(r.remark ?? "").toLowerCase().includes(keyword.toLowerCase())
      )
        return false;
      return true;
    });
  }, [
    rows,
    tenantScope,
    keyword,
    platformFilter,
    tenantFilter,
    statusFilter,
    pendingFilter,
    
  ]);

  // 分页
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // 选择
  const [selected, setSelected] = useState<string[]>([]);
  const allChecked =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const toggleAll = () => {
    if (allChecked)
      setSelected(selected.filter((id) => !pageRows.some((r) => r.id === id)));
    else setSelected([...new Set([...selected, ...pageRows.map((r) => r.id)])]);
  };

  // 弹窗
  const [editing, setEditing] = useState<ManagedAccount | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ManagedAccount | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  
  const [remoteFor, setRemoteFor] = useState<ManagedAccount | null>(null);
  const [assignTenantOpen, setAssignTenantOpen] = useState(false);
  const [assignOwnerOpen, setAssignOwnerOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [activeTimeOpen, setActiveTimeOpen] = useState(false);
  const [actionToggleOpen, setActionToggleOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mirrorFor, setMirrorFor] = useState<ManagedAccount | null>(null);
  const [assignOne, setAssignOne] = useState<ManagedAccount | null>(null);
  const [loginStatusDialogOpen, setLoginStatusDialogOpen] = useState(false);

  // 统计
  const stats = useMemo(
    () => ({
      total: rows.length,
      normal: rows.filter((r) => r.accountStatus === "normal").length,
      pending: rows.filter((r) => r.accountStatus === "pending").length,
      risk: rows.filter((r) => r.accountStatus === "risk").length,
      disabled: rows.filter((r) => r.accountStatus === "disabled").length,
      fail: rows.filter((r) => r.accountStatus === "fail").length,
    }),
    [rows],
  );

  const handleReset = () => {
    setKeyword("");
    setPlatformFilter("all");
    setTenantFilter("all");
    setStatusFilter("all");
    setPendingFilter("all");
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: ManagedAccount) => {
    setEditing(r);
    setFormOpen(true);
  };

  const handleSave = (data: Partial<ManagedAccount>) => {
    if (editing) {
      setRows((prev) =>
        prev.map((x) => (x.id === editing.id ? { ...x, ...data } : x)),
      );
      toast.success("已保存", { description: data.username ?? editing.username });
    } else {
      const t = ACTIVE_TENANTS.find((x) => x.id === data.tenantId);
      const item: ManagedAccount = {
        id: `m-${Date.now()}`,
        platform: "Facebook",
        username: "",
        platformId: "",
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${Date.now()}`,
        remark: "--",
        followers: 0,
        following: 0,
        likes: 0,
        accountStatus: "normal",
        tags: [],
        country: "美国",
        
        tenantId: t?.id ?? "",
        tenantName: t?.name ?? "未分配",
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        ...data,
      };
      setRows((prev) => [item, ...prev]);
      toast.success("新增成功", { description: item.username });
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setRows((prev) => prev.filter((x) => x.id !== deleting.id));
    toast.success("已删除", { description: deleting.username });
    setDeleting(null);
  };
  const handleBatchDelete = () => {
    setRows((prev) => prev.filter((x) => !selected.includes(x.id)));
    toast.success("批量删除完成", { description: `共 ${selected.length} 个账号` });
    setSelected([]);
    setBatchDeleteOpen(false);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-w-0 space-y-6">
        {/* 标题 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              托管账号
            </h2>
            <Badge
              variant="outline"
              className="rounded-full bg-violet-500/10 text-violet-600 border-violet-300/40"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              托管
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            团队代为托管运营的业务账号,统一管理设备、负责人、租户及运营任务。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard title="账号总数" value={stats.total} icon={Users2} tone="primary" />
          <StatCard title="正常" value={stats.normal} icon={CheckCircle2} tone="success" />
          <StatCard title="待确认" value={stats.pending} icon={Clock} tone="warning" />
          <StatCard title="风控" value={stats.risk} icon={AlertTriangle} tone="warning" />
          <StatCard title="禁用" value={stats.disabled} icon={Power} tone="muted" />
          <StatCard title="登录失败" value={stats.fail} icon={XCircle} tone="destructive" />
        </div>

        {/* 筛选 */}
        <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormItem label="平台">
              <Select
                value={platformFilter}
                onValueChange={(v) => {
                  setPlatformFilter(v);
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
            <FormItem label="账号">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="账号名 / 平台ID / 备注"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </FormItem>
            <div className="flex items-end justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                重置
              </Button>
              <Button onClick={() => setPage(1)}>
                <Search className="h-4 w-4" />
                搜索
              </Button>
              <Button
                variant="ghost"
                className="text-primary"
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {expanded ? "收起" : "展开"}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 xl:grid-cols-3">
              <FormItem label="所属租户">
                <Select
                  value={tenantFilter}
                  onValueChange={(v) => {
                    setTenantFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部租户</SelectItem>
                    {ACTIVE_TENANTS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
              <FormItem label="账号状态">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {(Object.keys(ACCOUNT_STATUS_META) as AccountStatus[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {ACCOUNT_STATUS_META[s].label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
              <FormItem label="待处理事项">
                <Select
                  value={pendingFilter}
                  onValueChange={(v) => {
                    setPendingFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="yes">有待处理</SelectItem>
                    <SelectItem value="no">无待处理</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </div>
          )}
        </div>

        {/* 工具栏 + 表格 */}
        <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2 border-b p-4">
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              新增账号
            </Button>
            <Button
              variant="outline"
              disabled={selected.length === 0}
              onClick={() => setLoginStatusDialogOpen(true)}
            >
              <ShieldCheck className="h-4 w-4" />
              设置账号状态{selected.length > 0 && ` (${selected.length})`}
            </Button>
            <Button
              variant="outline"
              disabled={selected.length === 0}
              onClick={() => setAssignTenantOpen(true)}
            >
              <Building className="h-4 w-4" />
              分配租户{selected.length > 0 && ` (${selected.length})`}
            </Button>
            <Button
              variant="outline"
              disabled={selected.length === 0}
              onClick={() => setAssignOwnerOpen(true)}
            >
              <Users2 className="h-4 w-4" />
              分配负责人{selected.length > 0 && ` (${selected.length})`}
            </Button>
            <Button
              variant="outline"
              disabled={selected.length === 0}
              onClick={() => setActiveTimeOpen(true)}
            >
              <Clock className="h-4 w-4" />
              设置活跃时间{selected.length > 0 && ` (${selected.length})`}
            </Button>
            <Button
              variant="outline"
              disabled={selected.length === 0}
              onClick={() => setActionToggleOpen(true)}
            >
              <ShieldCheck className="h-4 w-4" />
              禁/启用动作设置{selected.length > 0 && ` (${selected.length})`}
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              批量导入
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("导出中…", {
                  description: `将导出 ${filtered.length} 条数据`,
                })
              }
            >
              <Download className="h-4 w-4" />
              导出
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

          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 pl-4">
                    <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="min-w-[180px]">账号</TableHead>
                  <TableHead className="w-[110px]">账号状态</TableHead>
                  
                  <TableHead className="w-[240px] whitespace-nowrap">待处理事项</TableHead>
                  <TableHead className="w-[160px]">标签</TableHead>
                  <TableHead className="w-[120px]">运营负责人</TableHead>
                  <TableHead className="w-[160px]">所属租户</TableHead>
                  <TableHead className="w-[160px]">备注</TableHead>
                  <TableHead className="w-[140px]">添加时间</TableHead>
                  <TableHead className="w-[260px] pr-4 text-center">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                      暂无符合条件的托管账号
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((r) => {
                    const pm = PLATFORM_META[r.platform];
                    const sm = ACCOUNT_STATUS_META[r.accountStatus];
                    return (
                      <TableRow key={r.id} className="group">
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selected.includes(r.id)}
                            onCheckedChange={(c) =>
                              setSelected((prev) =>
                                c
                                  ? [...prev, r.id]
                                  : prev.filter((id) => id !== r.id),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 ring-1 ring-border">
                                <AvatarImage src={r.avatar} />
                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                  {r.username.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={cn(
                                      "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 cursor-default items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-background",
                                      pm.cls,
                                    )}
                                  >
                                    {pm.letter}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  {r.platform}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="min-w-0">
                              <span className="truncate font-medium text-foreground">
                                {r.username}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("rounded-full font-medium", sm.cls)}
                          >
                            {sm.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.pending ? (
                            <div className="flex flex-nowrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="gap-1 rounded-full bg-destructive/10 font-medium text-destructive border-destructive/20"
                              >
                                <Bell className="h-3 w-3" />
                                待处理
                              </Badge>
                              {r.pending.msg > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex h-5 items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 text-[10px] text-destructive">
                                      <MessageSquare className="h-3 w-3" />
                                      {r.pending.msg}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {r.pending.msg} 条未读私信
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {r.pending.friend > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex h-5 items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 text-[10px] text-destructive">
                                      <UserPlus className="h-3 w-3" />
                                      {r.pending.friend}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {r.pending.friend} 条好友申请
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TagPillList tags={r.tags} />
                        </TableCell>
                        <TableCell>
                          {r.ownerName ? (
                            <span className="text-sm text-foreground">{r.ownerName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">未分配</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs text-foreground">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {r.tenantName}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-[160px] truncate text-xs text-muted-foreground"
                          title={r.remark}
                        >
                          {r.remark}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {r.createdAt}
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex flex-nowrap items-center justify-end gap-x-2 whitespace-nowrap">
                            <TextActionBtn
                              icon={MonitorSmartphone}
                              label="远程控制"
                              onClick={() => setRemoteFor(r)}
                            />
                            <TextActionBtn
                              icon={UserPlus}
                              label="分配"
                              onClick={() => setAssignOne(r)}
                            />
                            <TextActionBtn
                              icon={Server}
                              label="设置镜像实例"
                              onClick={() => setMirrorFor(r)}
                            />
                            <TextActionBtn
                              icon={Pencil}
                              label="编辑"
                              onClick={() => openEdit(r)}
                            />
                            <TextActionBtn
                              icon={Eye}
                              label="查看"
                              onClick={() =>
                                navigate({
                                  to: "/accounts/managed/$id",
                                  params: { id: r.id },
                                })
                              }
                            />
                            <TextActionBtn
                              icon={Trash2}
                              label="删除"
                              danger
                              onClick={() => setDeleting(r)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

        {/* ===== 弹窗 ===== */}
        <EditDialog
          open={formOpen}
          item={editing}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditing(null);
          }}
          onConfirm={handleSave}
        />

        <AlertDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除该托管账号？</AlertDialogTitle>
              <AlertDialogDescription>
                即将删除托管账号 <b className="text-foreground">{deleting?.username}</b>,操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>批量删除托管账号</AlertDialogTitle>
              <AlertDialogDescription>
                即将删除已选的 <b className="text-foreground">{selected.length}</b> 个账号,操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SimpleSelectDialog
          open={assignTenantOpen}
          onOpenChange={setAssignTenantOpen}
          title="分配租户"
          description={`将所选 ${selected.length} 个托管账号分配到指定租户。`}
          options={ACTIVE_TENANTS.map((t) => ({ value: t.id, label: t.name }))}
          confirmLabel="分配"
          onConfirm={(v) => {
            const t = ACTIVE_TENANTS.find((x) => x.id === v);
            if (!t) return;
            setRows((prev) =>
              prev.map((x) =>
                selected.includes(x.id)
                  ? { ...x, tenantId: t.id, tenantName: t.name }
                  : x,
              ),
            );
            setAssignTenantOpen(false);
            toast.success("分配成功", {
              description: `${selected.length} 个账号 → ${t.name}`,
            });
            setSelected([]);
          }}
        />

        <SimpleSelectDialog
          open={assignOwnerOpen}
          onOpenChange={setAssignOwnerOpen}
          title="分配负责人"
          description={`将所选 ${selected.length} 个账号分配给指定运营人员。`}
          options={OPERATORS.map((n) => ({ value: n, label: n }))}
          confirmLabel="分配"
          onConfirm={(v) => {
            setRows((prev) =>
              prev.map((x) =>
                selected.includes(x.id) ? { ...x, ownerName: v } : x,
              ),
            );
            setAssignOwnerOpen(false);
            toast.success("分配成功", {
              description: `${selected.length} 个账号 → ${v}`,
            });
            setSelected([]);
          }}
        />

        <SimpleSelectDialog
          open={!!assignOne}
          onOpenChange={(o) => !o && setAssignOne(null)}
          title="分配负责人"
          description={assignOne ? `将账号「${assignOne.username}」分配给指定运营人员。` : ""}
          options={OPERATORS.map((n) => ({ value: n, label: n }))}
          confirmLabel="分配"
          onConfirm={(v) => {
            if (!assignOne) return;
            setRows((prev) =>
              prev.map((x) =>
                x.id === assignOne.id ? { ...x, ownerName: v } : x,
              ),
            );
            toast.success("分配成功", {
              description: `${assignOne.username} → ${v}`,
            });
            setAssignOne(null);
          }}
        />

        <SimpleSelectDialog
          open={loginStatusDialogOpen}
          onOpenChange={setLoginStatusDialogOpen}
          title="设置账号状态"
          description={`为所选 ${selected.length} 个托管账号设置账号状态。`}
          options={(Object.keys(ACCOUNT_STATUS_META) as AccountStatus[]).map(
            (s) => ({
              value: s,
              label: ACCOUNT_STATUS_META[s].label,
            }),
          )}
          confirmLabel="确认"
          onConfirm={(v) => {
            setRows((prev) =>
              prev.map((x) =>
                selected.includes(x.id)
                  ? { ...x, accountStatus: v as AccountStatus }
                  : x,
              ),
            );
            setLoginStatusDialogOpen(false);
            toast.success("账号状态已更新", {
              description: `${selected.length} 个账号 → ${ACCOUNT_STATUS_META[v as AccountStatus].label}`,
            });
            setSelected([]);
          }}
        />


        <TagsDialog
          open={tagsOpen}
          onOpenChange={setTagsOpen}
          count={selected.length}
          onConfirm={(tag) => {
            setRows((prev) =>
              prev.map((x) =>
                selected.includes(x.id) ? { ...x, tags: [tag] } : x,
              ),
            );
            setTagsOpen(false);
            toast.success("标签已更新", {
              description: `${selected.length} 个账号 → 「${tag}」`,
            });
            setSelected([]);
          }}
        />

        <PlaceholderDialog
          open={activeTimeOpen}
          onOpenChange={setActiveTimeOpen}
          title="设置活跃时间"
          description={`为所选 ${selected.length} 个托管账号配置每日活跃时间窗口。`}
          icon={Clock}
        />

        <PlaceholderDialog
          open={actionToggleOpen}
          onOpenChange={setActionToggleOpen}
          title="禁/启用动作设置"
          description={`为所选 ${selected.length} 个托管账号配置可执行的运营动作清单。`}
          icon={ShieldCheck}
        />

        <PlaceholderDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="批量导入托管账号"
          description="支持 .csv / .xlsx 文件,单次最多 5000 条。"
          icon={Upload}
        />

        <PlaceholderDialog
          open={!!remoteFor}
          onOpenChange={(o) => !o && setRemoteFor(null)}
          title="远程控制"
          description={remoteFor ? `打开账号「${remoteFor.username}」绑定的云机/虚拟机远程桌面。` : ""}
          icon={MonitorSmartphone}
        />

        <ImageInstanceDialog
          account={mirrorFor}
          onOpenChange={(o) => !o && setMirrorFor(null)}
        />

      </div>
    </TooltipProvider>
  );
}

/* ============================================================ */
/* 复用组件                                                     */
/* ============================================================ */

function FormItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}


function TextActionBtn({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline",
        danger ? "text-destructive hover:text-destructive/80" : "text-primary hover:text-primary/80",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function TagPill({ name }: { name: string }) {
  const t = findTagByName(name);
  const color = t?.color ?? "#94a3b8";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}1A`,
        color,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

function TagPillList({ tags }: { tags?: string[] | null }) {
  if (!tags || tags.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <TagPill key={t} name={t} />
      ))}
    </div>
  );
}

/* ============================================================ */
/* 弹窗组件                                                     */
/* ============================================================ */

function EditDialog({
  open,
  item,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  item: ManagedAccount | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: (d: Partial<ManagedAccount>) => void;
}) {
  const [platform, setPlatform] = useState<Platform>("Facebook");
  const [username, setUsername] = useState("");
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("normal");
  
  const [tags, setTags] = useState<string[]>([]);
  const [tenantId, setTenantId] = useState(ACTIVE_TENANTS[0]?.id ?? "");
  const [ownerName, setOwnerName] = useState<string>("");
  const [remark, setRemark] = useState("");

  const tagOptions = useMemo(() => getUsableTags().map((t) => t.name), []);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setPlatform(item.platform);
      setUsername(item.username);
      setAccountStatus(item.accountStatus);
      
      setTags(item.tags ?? []);
      setTenantId(item.tenantId || ACTIVE_TENANTS[0]?.id || "");
      setOwnerName(item.ownerName ?? "");
      setRemark(item.remark === "--" ? "" : item.remark);
    } else {
      setPlatform("Facebook");
      setUsername("");
      setAccountStatus("normal");
      
      setTags([]);
      setTenantId(ACTIVE_TENANTS[0]?.id ?? "");
      setOwnerName("");
      setRemark("");
    }
  }, [item, open]);

  const valid = username.trim().length > 0;

  const toggleTag = (name: string) => {
    setTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "编辑托管账号" : "新增托管账号"}</DialogTitle>
          <DialogDescription>
            维护托管账号的平台资料、状态、标签、负责人与租户信息。
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="平台" required>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="账号名" required>
            <Input
              placeholder="请输入账号名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="账号状态">
            <Select value={accountStatus} onValueChange={(v) => setAccountStatus(v as AccountStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_STATUS_META) as AccountStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{ACCOUNT_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="运营负责人">
            <Select value={ownerName || "__none"} onValueChange={(v) => setOwnerName(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="选择运营负责人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">未分配</SelectItem>
                {OPERATORS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="所属租户">
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVE_TENANTS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="标签" full>
            {tagOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无可用标签,请先到标签管理中创建。</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
          <Field label="备注" full>
            <Textarea
              rows={2}
              placeholder="选填,便于团队协作"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              const t = ACTIVE_TENANTS.find((x) => x.id === tenantId);
              onConfirm({
                platform,
                username,
                accountStatus,
                
                tags,
                tenantId: t?.id ?? tenantId,
                tenantName: t?.name ?? "未分配",
                ownerName: ownerName || undefined,
                remark: remark || "--",
              });
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs text-muted-foreground">
        {required && <span className="mr-1 text-destructive">*</span>}
        {label}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SimpleSelectDialog({
  open,
  onOpenChange,
  title,
  description,
  options,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  options: { value: string; label: string }[];
  confirmLabel: string;
  onConfirm: (v: string) => void;
}) {
  const [v, setV] = useState<string>(options[0]?.value ?? "");
  useEffect(() => {
    if (open) setV(options[0]?.value ?? "");
  }, [open, options]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Select value={v} onValueChange={setV}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => onConfirm(v)} disabled={!v}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagsDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  count: number;
  onConfirm: (tag: string) => void;
}) {
  const tags = getUsableTags();
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<string>("");
  useEffect(() => {
    if (open) {
      setKeyword("");
      setSelected("");
    }
  }, [open]);
  const list = tags.filter((t) =>
    t.name.toLowerCase().includes(keyword.toLowerCase()),
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>修改标签</DialogTitle>
          <DialogDescription>
            为所选 {count} 个托管账号设置标签。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="搜索标签"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-auto rounded-md border p-2">
            <div className="flex flex-wrap gap-2">
              {list.map((t) => {
                const isSel = selected === t.name;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.name)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      isSel
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.name}
                  </button>
                );
              })}
              {list.length === 0 && (
                <span className="text-xs text-muted-foreground">无匹配标签</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={!selected} onClick={() => onConfirm(selected)}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlaceholderDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <Icon className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">功能即将上线</p>
          <p className="mt-1 text-xs text-muted-foreground">
            该功能的详细交互正在设计中,敬请期待。
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>知道了</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================ */
/* 设置镜像实例 弹窗                                            */
/* ============================================================ */

function ImageInstanceDialog({
  account,
  onOpenChange,
}: {
  account: ManagedAccount | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<"cloud" | "fp">("cloud");
  const [cloudKw, setCloudKw] = useState("");
  const [fpKw, setFpKw] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setTab("cloud");
      setCloudKw("");
      setFpKw("");
      setSelected(null);
    }
  }, [account?.id]);


  const cloudRows = useMemo(() => seedCloudInstances(), []);
  const fpRows = useMemo(() => seedFpResources(), []);

  const filteredCloud = useMemo(() => {
    return cloudRows.filter((r) => {
      if (r.status !== "in_use") return false;
      if (cloudKw) {
        const k = cloudKw.toLowerCase();
        if (
          !r.instanceId.toLowerCase().includes(k) &&
          !r.instanceName.toLowerCase().includes(k)
        )
          return false;
      }
      return true;
    });
  }, [cloudRows, cloudKw]);

  const filteredFp = useMemo(() => {
    return fpRows.filter((r) => {
      if (r.status !== "in_use") return false;
      if (fpKw) {
        const k = fpKw.toLowerCase();
        if (
          !r.resourceId.toLowerCase().includes(k) &&
          !r.resourceName.toLowerCase().includes(k)
        )
          return false;
      }
      return true;
    });
  }, [fpRows, fpKw]);


  const handleConfirm = () => {
    if (!selected) {
      toast.warning("请先选择一个镜像实例");
      return;
    }
    toast.success("镜像实例已设置", {
      description: `已为账号「${account?.username}」绑定镜像实例。`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!account} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            设置镜像实例
          </DialogTitle>
          <DialogDescription>
            {account
              ? `为账号「${account.username}」选择一个镜像实例。`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as "cloud" | "fp");
            setSelected(null);
          }}
        >
          <TabsList>
            <TabsTrigger value="cloud">云机</TabsTrigger>
            <TabsTrigger value="fp">指纹浏览器</TabsTrigger>
          </TabsList>

          <TabsContent value="cloud" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-64"
                placeholder="搜索镜像实例ID/名称"
                value={cloudKw}
                onChange={(e) => setCloudKw(e.target.value)}
              />
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              当前列表只展示可用的云机
            </div>

            <div className="max-h-[360px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>镜像实例ID</TableHead>
                    <TableHead>镜像实例名称</TableHead>
                    <TableHead className="w-24">容量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCloud.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCloud.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(r.id)}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            checked={selected === r.id}
                            onChange={() => setSelected(r.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.instanceId}</TableCell>
                        <TableCell className="text-sm">{r.instanceName}</TableCell>
                        <TableCell className="text-sm tabular-nums">{r.capacity}GB</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="fp" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-64"
                placeholder="搜索镜像实例ID/名称"
                value={fpKw}
                onChange={(e) => setFpKw(e.target.value)}
              />
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              当前列表只展示可用的指纹浏览器
            </div>

            <div className="max-h-[360px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>镜像实例ID</TableHead>
                    <TableHead>镜像实例名称</TableHead>
                    <TableHead className="w-24">容量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFp.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFp.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(r.id)}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            checked={selected === r.id}
                            onChange={() => setSelected(r.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.resourceId}</TableCell>
                        <TableCell className="text-sm">{r.resourceName}</TableCell>
                        <TableCell className="text-sm tabular-nums">{r.capacity}GB</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



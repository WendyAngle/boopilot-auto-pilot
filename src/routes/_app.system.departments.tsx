import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2,
  FoldVertical,
  CheckCircle2,
  Network,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/system/departments")({
  component: DepartmentManagement,
  head: () => ({
    meta: [
      { title: "部门管理 — BooPilot" },
      { name: "description", content: "维护组织部门层级、负责人与状态" },
    ],
  }),
});

/* ============================================================ */
/* 类型 & 数据                                                   */
/* ============================================================ */

type DeptStatus = "active" | "inactive";

interface Department {
  id: string;
  parentId: string | null;
  name: string;
  order: number;
  leaderId?: string;
  leaderName?: string;
  phone?: string;
  email?: string;
  status: DeptStatus;
  createdAt: string;
}

const LEADER_OPTIONS = [
  { id: "u-1", name: "陈晓明" },
  { id: "u-2", name: "李雨欣" },
  { id: "u-3", name: "王浩然" },
  { id: "u-4", name: "张梦琪" },
  { id: "u-5", name: "刘子轩" },
];

const INITIAL_DEPTS: Department[] = [
  { id: "root", parentId: null, name: "Boo科技有限责任公司", order: 0, leaderId: "u-1", leaderName: "陈晓明", phone: "13800000000", email: "hq@boo.com", status: "active", createdAt: "2026-01-29 17:33:22" },
  { id: "dept-product", parentId: "root", name: "产品运营部", order: 0, leaderId: "u-2", leaderName: "李雨欣", phone: "13800000001", email: "product@boo.com", status: "active", createdAt: "2026-02-03 17:55:30" },
  { id: "dept-tech", parentId: "root", name: "技术研发部", order: 1, leaderId: "u-3", leaderName: "王浩然", phone: "13800000002", email: "tech@boo.com", status: "active", createdAt: "2026-02-04 09:12:01" },
  { id: "dept-market", parentId: "root", name: "市场推广部", order: 2, leaderId: "u-4", leaderName: "张梦琪", status: "active", createdAt: "2026-02-05 10:08:45" },
  { id: "dept-hr", parentId: "root", name: "人力资源部", order: 3, leaderId: "u-5", leaderName: "刘子轩", status: "inactive", createdAt: "2026-02-06 14:30:00" },
  { id: "dept-tech-fe", parentId: "dept-tech", name: "前端组", order: 0, status: "active", createdAt: "2026-02-10 11:00:00" },
  { id: "dept-tech-be", parentId: "dept-tech", name: "后端组", order: 1, status: "active", createdAt: "2026-02-10 11:05:00" },
];

interface DeptNode extends Department {
  children: DeptNode[];
  depth: number;
}

function buildTree(list: Department[]): DeptNode[] {
  const map = new Map<string, DeptNode>();
  list.forEach((d) => map.set(d.id, { ...d, children: [], depth: 0 }));
  const roots: DeptNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (arr: DeptNode[]) => {
    arr.sort((a, b) => a.order - b.order);
    arr.forEach((c) => sortRec(c.children));
  };
  sortRec(roots);
  return roots;
}

function flattenTree(nodes: DeptNode[], expanded: Record<string, boolean>, out: DeptNode[] = []): DeptNode[] {
  nodes.forEach((n) => {
    out.push(n);
    if (n.children.length && expanded[n.id]) {
      flattenTree(n.children, expanded, out);
    }
  });
  return out;
}

function collectAllIds(nodes: DeptNode[], out: string[] = []): string[] {
  nodes.forEach((n) => {
    if (n.children.length) {
      out.push(n.id);
      collectAllIds(n.children, out);
    }
  });
  return out;
}

function filterTree(nodes: DeptNode[], keyword: string, status: string): DeptNode[] {
  const result: DeptNode[] = [];
  nodes.forEach((n) => {
    const childMatched = filterTree(n.children, keyword, status);
    const nameOk = !keyword || n.name.toLowerCase().includes(keyword.toLowerCase());
    const statusOk = status === "all" || n.status === status;
    if ((nameOk && statusOk) || childMatched.length) {
      result.push({ ...n, children: childMatched });
    }
  });
  return result;
}

/* ============================================================ */
/* 组件                                                         */
/* ============================================================ */

function DepartmentManagement() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<"all" | DeptStatus>("all");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<"all" | DeptStatus>("all");

  const [depts, setDepts] = useState<Department[]>(INITIAL_DEPTS);
  const tree = useMemo(() => buildTree(depts), [depts]);
  const filteredTree = useMemo(
    () => filterTree(tree, appliedKeyword, appliedStatus),
    [tree, appliedKeyword, appliedStatus],
  );

  const allParentIds = useMemo(() => collectAllIds(filteredTree), [filteredTree]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    root: true,
    "dept-tech": true,
  });

  const allExpanded = allParentIds.length > 0 && allParentIds.every((id) => expanded[id]);
  const rows = useMemo(() => flattenTree(filteredTree, expanded), [filteredTree, expanded]);

  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / pageSize)),
    [rows.length, pageSize],
  );
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim());
    setAppliedStatus(status);
    setPage(1);
  };
  const handleReset = () => {
    setKeyword("");
    setStatus("all");
    setAppliedKeyword("");
    setAppliedStatus("all");
    setPage(1);
    toast.success("已重置筛选条件");
  };
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpanded({});
    } else {
      const next: Record<string, boolean> = {};
      allParentIds.forEach((id) => (next[id] = true));
      setExpanded(next);
    }
  };
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const openAdd = (parentId: string | null) => {
    setEditing(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  };
  const openEdit = (d: Department) => {
    setEditing(d);
    setDefaultParentId(d.parentId);
    setFormOpen(true);
  };
  const handleSave = (form: Partial<Department>) => {
    if (editing) {
      setDepts((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...form } : x)));
      toast.success("保存成功");
    } else {
      const id = `dept-${Date.now()}`;
      setDepts((prev) => [
        ...prev,
        {
          id,
          parentId: form.parentId ?? null,
          name: form.name || "新部门",
          order: form.order ?? 0,
          leaderId: form.leaderId,
          leaderName: form.leaderName,
          phone: form.phone,
          email: form.email,
          status: form.status || "active",
          createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        },
      ]);
      if (form.parentId) {
        setExpanded((p) => ({ ...p, [form.parentId as string]: true }));
      }
      toast.success("新增成功");
    }
    setFormOpen(false);
  };
  const handleDelete = () => {
    if (!deleting) return;
    const ids = new Set<string>();
    const collect = (pid: string) => {
      ids.add(pid);
      depts.filter((x) => x.parentId === pid).forEach((c) => collect(c.id));
    };
    collect(deleting.id);
    setDepts((prev) => prev.filter((x) => !ids.has(x.id)));
    toast.success("已删除", { description: deleting.name });
    setDeleting(null);
  };

  const stats = useMemo(
    () => ({
      total: depts.length,
      active: depts.filter((d) => d.status === "active").length,
      inactive: depts.filter((d) => d.status === "inactive").length,
    }),
    [depts],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-w-0 space-y-6">
        {/* 标题区 */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">部门管理</h2>
          <p className="text-sm text-muted-foreground">
            维护组织架构，管理部门层级、负责人与状态。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="部门总数" value={stats.total} icon={Network} tone="primary" />
          <StatCard title="正常" value={stats.active} icon={CheckCircle2} tone="success" />
          <StatCard title="停用" value={stats.inactive} icon={ShieldCheck} tone="muted" />
        </div>

        {/* 筛选条件 */}
        <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormItem label="部门">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="请输入部门名称"
              />
            </FormItem>
            <FormItem label="状态">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue placeholder="部门状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            <div className="flex items-end justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                重置
              </Button>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
                搜索
              </Button>
            </div>
          </div>
        </div>

        {/* 工具栏 + 表格 */}
        <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-2 border-b p-4">
            <Button onClick={() => openAdd(null)}>
              <Plus className="h-4 w-4" />
              新增部门
            </Button>
            <Button variant="outline" onClick={toggleExpandAll}>
              <FoldVertical className="h-4 w-4" />
              展开/折叠
            </Button>
          </div>

          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="pl-4">部门</TableHead>
                  <TableHead className="w-[100px] text-center">排序</TableHead>
                  <TableHead className="w-[90px] text-center">状态</TableHead>
                  <TableHead className="w-[170px] text-center">创建时间</TableHead>
                  <TableHead className="w-[280px] pr-4 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((d) => {
                    const hasChildren = d.children.length > 0;
                    const isOpen = expanded[d.id];
                    return (
                      <TableRow key={d.id} className="group">
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-1" style={{ paddingLeft: d.depth * 20 }}>
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => toggle(d.id)}
                                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                              >
                                {isOpen ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block w-5" />
                            )}
                            <Building2
                              className={cn(
                                "h-4 w-4 shrink-0",
                                d.parentId === null ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span className="font-medium">{d.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums">{d.order}</TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={d.status} />
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm tabular-nums text-muted-foreground">
                          {d.createdAt}
                        </TableCell>
                        <TableCell className="pr-4 text-center">
                          <div className="flex flex-nowrap items-center justify-center gap-1 whitespace-nowrap">
                            <IconAction icon={Pencil} tip="编辑" tone="primary" onClick={() => openEdit(d)} />
                            <IconAction icon={Plus} tip="新增下级部门" tone="primary" onClick={() => openAdd(d.id)} />
                            <IconAction icon={Trash2} tip="删除" tone="danger" onClick={() => setDeleting(d)} />
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
            total={rows.length}
            setPage={setPage}
          />
        </div>

        <DepartmentFormDialog
          open={formOpen}
          editing={editing}
          defaultParentId={defaultParentId}
          allDepts={depts}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />

        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除该部门？</AlertDialogTitle>
              <AlertDialogDescription>
                即将删除部门 <b>{deleting?.name}</b>
                {depts.some((x) => x.parentId === deleting?.id) && (
                  <span className="text-destructive">（包含其全部子部门）</span>
                )}
                ，删除后不可恢复。
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
      </div>
    </TooltipProvider>
  );
}

/* ============================================================ */
/* 子组件                                                       */
/* ============================================================ */

function FormItem({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Label className="w-16 shrink-0 text-right text-sm text-muted-foreground">{label}</Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}


function StatusBadge({ status }: { status: DeptStatus }) {
  return status === "active" ? (
    <span className="inline-flex items-center rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
      正常
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      停用
    </span>
  );
}

function IconAction({
  icon: Icon,
  tip,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tip: string;
  tone: "primary" | "danger" | "warning";
  onClick?: () => void;
}) {
  const cls =
    tone === "primary"
      ? "text-primary hover:bg-primary/10"
      : tone === "danger"
        ? "text-destructive hover:bg-destructive/10"
        : "text-warning hover:bg-warning/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
        cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {tip}
    </button>
  );
}

/* -------- 表单弹窗 -------- */

function ReqLabel({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <Label className="flex w-24 shrink-0 items-center justify-end gap-0.5 text-sm text-foreground">
      {required && <span className="text-destructive">*</span>}
      <span>{children}</span>
    </Label>
  );
}

function FieldRow({ required, label, children }: { required?: boolean; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-2">
        <ReqLabel required={required}>{label}</ReqLabel>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function DepartmentFormDialog({
  open,
  editing,
  defaultParentId,
  allDepts,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Department | null;
  defaultParentId: string | null;
  allDepts: Department[];
  onClose: () => void;
  onSave: (form: Partial<Department>) => void;
}) {
  const [form, setForm] = useState<Partial<Department>>({});

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? { ...editing }
          : {
              parentId: defaultParentId,
              name: "",
              order: 0,
              leaderId: undefined,
              leaderName: undefined,
              phone: "",
              email: "",
              status: "active",
            },
      );
    }
  }, [open, editing, defaultParentId]);

  const showParent = !editing;

  const parentOptions = useMemo(() => {
    if (!editing) return allDepts;
    const banned = new Set<string>([editing.id]);
    const collect = (pid: string) => {
      allDepts.filter((x) => x.parentId === pid).forEach((c) => {
        banned.add(c.id);
        collect(c.id);
      });
    };
    collect(editing.id);
    return allDepts.filter((d) => !banned.has(d.id));
  }, [allDepts, editing]);

  const handleSubmit = () => {
    if (showParent && form.parentId === undefined) {
      toast.error("请选择上级部门");
      return;
    }
    if (!form.name?.trim()) {
      toast.error("请填写部门名称");
      return;
    }
    if (form.order === undefined || form.order === null || isNaN(Number(form.order))) {
      toast.error("请填写显示顺序");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑部门" : "新增部门"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {showParent && (
            <FieldRow required label="上级部门">
              <Select
                value={form.parentId ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {parentOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <FieldRow required label="部门">
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="请输入部门名称"
              />
            </FieldRow>
            <FieldRow required label="显示顺序">
              <Input
                type="number"
                value={form.order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </FieldRow>

            <FieldRow label="负责人">
              <Select
                value={form.leaderId ?? ""}
                onValueChange={(v) => {
                  const leader = LEADER_OPTIONS.find((l) => l.id === v);
                  setForm((f) => ({ ...f, leaderId: v, leaderName: leader?.name }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {LEADER_OPTIONS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="联系电话">
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="请输入联系电话"
              />
            </FieldRow>

            <FieldRow label="邮箱">
              <Input
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="请输入邮箱"
              />
            </FieldRow>
            <FieldRow label="部门状态">
              <RadioGroup
                value={form.status ?? "active"}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as DeptStatus }))}
                className="flex h-10 items-center gap-6"
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="active" id="dept-status-active" />
                  <span className={cn(form.status === "active" && "font-medium text-primary")}>正常</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="inactive" id="dept-status-inactive" />
                  <span>停用</span>
                </label>
              </RadioGroup>
            </FieldRow>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>确 定</Button>
          <Button variant="outline" onClick={onClose}>
            取 消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

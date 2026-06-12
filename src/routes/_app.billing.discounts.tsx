import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Percent,
  RotateCcw,
  RefreshCw,
  Search,
  TrendingDown,
  Ban,
  Calculator,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";

import { PLAN_META, PLAN_TIERS, usePlans, type PlanTier } from "@/lib/billing-plans";
import {
  BILLING_FUNCTIONS,
  type BillingFunction,
  type DiscountValue,
  formatDiscount,
  resetMatrix,
  resetRow,
  setDiscount,
  useDiscountMatrix,
  calcCost,
} from "@/lib/billing-discounts";

export const Route = createFileRoute("/_app/billing/discounts")({
  component: DiscountsPage,
  head: () => ({
    meta: [
      { title: "积分管理 — BooPilot" },
      { name: "description", content: "功能 × 套餐 的积分折扣规则矩阵" },
    ],
  }),
});

function DiscountsPage() {
  const matrix = useDiscountMatrix();
  const plans = usePlans();
  const [keyword, setKeyword] = useState("");
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftPlan, setShiftPlan] = useState<PlanTier>("basic");
  const [shiftDelta, setShiftDelta] = useState(0.05);

  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return BILLING_FUNCTIONS.filter((f) =>
      !kw ? true : f.label.toLowerCase().includes(kw) || f.key.includes(kw),
    );
  }, [keyword]);

  /** 各档套餐平均折扣 */
  const avgByPlan = useMemo(() => {
    const out: Record<PlanTier, number> = { free: 0, basic: 0, pro: 0, flagship: 0 };
    PLAN_TIERS.forEach((p) => {
      const vals = BILLING_FUNCTIONS.map((f) => matrix[f.key][p]).filter(
        (v): v is number => v !== "disabled",
      );
      out[p] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    return out;
  }, [matrix]);

  const totalCells = BILLING_FUNCTIONS.length * 3; // basic/pro/flagship

  const handleShift = () => {
    BILLING_FUNCTIONS.forEach((f) => {
      const cur = matrix[f.key][shiftPlan];
      if (cur === "disabled") return;
      const next = Math.min(1, Math.max(0.1, +(cur + shiftDelta).toFixed(2)));
      setDiscount(f.key, shiftPlan, next);
    });
    toast.success(`已对「${PLAN_META[shiftPlan].label}」全场${shiftDelta >= 0 ? "提价" : "让利"} ${Math.abs(shiftDelta * 10).toFixed(1)} 折`);
    setShiftOpen(false);
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* 标题 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">积分管理</h2>
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            折扣规则
          </Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          配置 <span className="font-medium text-foreground">「功能 × 套餐」</span> 二维折扣矩阵：消耗积分 = 模型基准积分 × 用量 × 折扣率。免费版固定为「禁用」，无法使用消耗积分的功能。
        </p>
      </div>

      {/* StatCard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="计费功能数" value={BILLING_FUNCTIONS.length} icon={Percent} tone="primary" />
        <StatCard
          title="基础版平均折扣"
          value={formatDiscount(avgByPlan.basic)}
          icon={TrendingDown}
          tone="primary"
        />
        <StatCard
          title="专业版平均折扣"
          value={formatDiscount(avgByPlan.pro)}
          icon={TrendingDown}
          tone="violet"
        />
        <StatCard
          title="旗舰版平均折扣"
          value={formatDiscount(avgByPlan.flagship)}
          icon={TrendingDown}
          tone="warning"
        />
      </div>

      {/* 搜索 */}
      <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full shrink-0 sm:w-[340px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索功能名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            共 {totalCells} 个可配置单元格 · 单元格点击即可编辑
          </div>
        </div>
      </div>

      {/* 操作工具栏 */}
      <div className="flex flex-wrap items-center justify-start gap-2">
        <Button onClick={() => setShiftOpen(true)}>
          <Wand2 className="h-4 w-4" />
          一键平移
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetMatrix();
            toast.success("已重置全部折扣规则为默认值");
          }}
        >
          <RotateCcw className="h-4 w-4" />
          重置全部
        </Button>
        <Button variant="ghost" size="icon" onClick={() => toast.success("已刷新")}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 矩阵表 */}
      <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[180px] pl-4">功能模块</TableHead>
                <TableHead className="w-[120px]">单位</TableHead>
                <TableHead className="w-[100px] text-right">基准积分</TableHead>
                {PLAN_TIERS.map((p) => (
                  <TableHead key={p} className="w-[140px] text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        PLAN_META[p].badgeCls,
                      )}
                    >
                      {PLAN_META[p].label}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-[80px] pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={PLAN_TIERS.length + 4} className="h-32 text-center text-muted-foreground">
                    暂无匹配功能
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((f) => (
                  <TableRow key={f.key}>
                    <TableCell className="pl-4">
                      <div className="font-medium text-foreground">{f.label}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{f.key}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">每 1 {f.unit}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      {f.baseCost}
                    </TableCell>
                    {PLAN_TIERS.map((p) => (
                      <TableCell key={p} className="text-center">
                        <DiscountCell fn={f.key} plan={p} value={matrix[f.key][p]} base={f.baseCost} unit={f.unit} />
                      </TableCell>
                    ))}
                    <TableCell className="pr-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => {
                          resetRow(f.key);
                          toast.success(`已重置「${f.label}」的折扣规则`);
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                        重置
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 说明 */}
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
        <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
          <Calculator className="h-3.5 w-3.5" />
          计费公式
        </div>
        <code className="rounded bg-background px-2 py-1 text-[11px] text-foreground">
          消耗积分 = ⌈ 模型基准积分 × 用量 × 套餐折扣率 ⌉
        </code>
        <span className="ml-2">；免费版任何功能均不可用，需升级套餐解锁。</span>
      </div>

      {/* 一键平移 */}
      <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>一键平移折扣</DialogTitle>
            <DialogDescription>对选定套餐档位的所有功能折扣率统一加减。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">套餐档位</Label>
              <Select value={shiftPlan} onValueChange={(v) => setShiftPlan(v as PlanTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TIERS.filter((p) => p !== "free").map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLAN_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                变化量：{shiftDelta >= 0 ? "+" : ""}
                {(shiftDelta * 10).toFixed(1)} 折（{shiftDelta >= 0 ? "提价" : "让利"}）
              </Label>
              <Slider
                value={[shiftDelta]}
                min={-0.3}
                max={0.3}
                step={0.05}
                onValueChange={([v]) => setShiftDelta(+v.toFixed(2))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftOpen(false)}>取消</Button>
            <Button onClick={handleShift}>应用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiscountCell({
  fn,
  plan,
  value,
  base,
  unit,
}: {
  fn: BillingFunction;
  plan: PlanTier;
  value: DiscountValue;
  base: number;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<number>(value === "disabled" ? 0.8 : value);
  const isFree = plan === "free";

  if (isFree) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
        <Ban className="h-3 w-3" />
        禁用
      </span>
    );
  }

  /** 折扣越低色越深 */
  const cls =
    value === "disabled"
      ? "border-border bg-muted text-muted-foreground"
      : value <= 0.5
        ? "border-success/40 bg-success/15 text-success"
        : value <= 0.7
          ? "border-primary/40 bg-primary/15 text-primary"
          : value <= 0.85
            ? "border-violet-400/40 bg-violet-500/15 text-violet-600"
            : "border-border bg-muted text-foreground";

  const sample = calcCost(fn, plan, 1);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setLocal(value === "disabled" ? 0.8 : value);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-w-[64px] items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold transition hover:scale-105",
            cls,
          )}
        >
          {formatDiscount(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="center">
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className={cn("mr-1 rounded-full", PLAN_META[plan].badgeCls)}>
            {PLAN_META[plan].label}
          </Badge>
          调整折扣
        </div>
        <div className="flex items-center gap-2">
          <Slider
            value={[local]}
            min={0.1}
            max={1}
            step={0.05}
            onValueChange={([v]) => setLocal(+v.toFixed(2))}
            className="flex-1"
          />
          <Input
            value={local}
            type="number"
            min={0.1}
            max={1}
            step={0.05}
            onChange={(e) => setLocal(Math.min(1, Math.max(0.1, +Number(e.target.value).toFixed(2))))}
            className="h-8 w-16 text-center"
          />
        </div>
        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground">
          基准 {base} 积分 / {unit} × {(local * 10).toFixed(1)} 折 ={" "}
          <span className="font-semibold text-foreground">
            {Math.ceil(base * local)} 积分
          </span>
          {value !== "disabled" && (
            <span className="ml-1">（当前 {sample.cost} 积分）</span>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setDiscount(fn, plan, local);
              setOpen(false);
            }}
          >
            保存
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

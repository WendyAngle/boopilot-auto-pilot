import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Wallet,
  Sparkles,
  Check,
  Pencil,
  RotateCcw,
  Crown,
  Zap,
  Gem,
  Gift,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";

import {
  PLAN_META,
  PLAN_TIERS,
  type PlanConfig,
  type PlanTier,
  usePlans,
  updatePlan,
  resetPlan,
} from "@/lib/billing-plans";
import { useTenantPlans } from "@/lib/billing-tenants";

export const Route = createFileRoute("/_app/billing/plans")({
  component: PlansPage,
  head: () => ({
    meta: [
      { title: "套餐管理 — BooPilot" },
      { name: "description", content: "管理免费版/基础版/专业版/旗舰版四档套餐参数" },
    ],
  }),
});

const PLAN_ICON: Record<PlanTier, typeof Crown> = {
  free: Gift,
  basic: Zap,
  pro: Gem,
  flagship: Crown,
};

function PlansPage() {
  const plans = usePlans();
  const assignments = useTenantPlans();
  const [editing, setEditing] = useState<PlanTier | null>(null);

  const stats = useMemo(() => {
    const tenantsByPlan = { free: 0, basic: 0, pro: 0, flagship: 0 } as Record<PlanTier, number>;
    Object.values(assignments).forEach((p) => (tenantsByPlan[p] += 1));
    const paidTenants =
      tenantsByPlan.basic + tenantsByPlan.pro + tenantsByPlan.flagship;
    const mrr =
      tenantsByPlan.basic * plans.basic.monthlyPrice +
      tenantsByPlan.pro * plans.pro.monthlyPrice +
      tenantsByPlan.flagship * plans.flagship.monthlyPrice;
    const bonusTotal =
      tenantsByPlan.basic * plans.basic.bonusCredits +
      tenantsByPlan.pro * plans.pro.bonusCredits +
      tenantsByPlan.flagship * plans.flagship.bonusCredits +
      tenantsByPlan.free * plans.free.bonusCredits;
    return { tenantsByPlan, paidTenants, mrr, bonusTotal };
  }, [assignments, plans]);

  return (
    <div className="min-w-0 space-y-6">
      {/* 标题 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">套餐管理</h2>
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            计费中心
          </Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          管理平台 4 档固定套餐（免费版 / 基础版 / 专业版 / 旗舰版）的价格、积分赠送与功能授权。免费版租户无法使用任何需要消耗积分的 AI 功能。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="付费租户数" value={stats.paidTenants} icon={Users} tone="primary" />
        <StatCard title="月度营收 (MRR)" value={`¥${stats.mrr.toLocaleString()}`} icon={CircleDollarSign} tone="success" />
        <StatCard title="本月赠送积分" value={stats.bonusTotal.toLocaleString()} icon={Gift} tone="violet" />
        <StatCard title="免费版租户" value={stats.tenantsByPlan.free} icon={Wallet} tone="muted" />
      </div>

      {/* 套餐卡片网格 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_TIERS.map((t) => {
          const p = plans[t];
          const meta = PLAN_META[t];
          const Icon = PLAN_ICON[t];
          const tenantCount = stats.tenantsByPlan[t];
          return (
            <div
              key={t}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] ring-1 transition hover:shadow-md",
                meta.cardRing,
              )}
            >
              {/* 头部 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      meta.badgeCls,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={cn("text-base font-bold", meta.accent)}>{p.name}</div>
                    <Badge
                      variant="outline"
                      className="mt-0.5 rounded-full border-border/60 px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                    >
                      {tenantCount} 个租户
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.tagline}</p>

              {/* 价格 */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {p.monthlyPrice === 0 ? "免费" : `¥${p.monthlyPrice}`}
                </span>
                {p.monthlyPrice > 0 && (
                  <span className="text-xs text-muted-foreground">/ 月</span>
                )}
              </div>
              {p.yearlyPrice > 0 && (
                <div className="text-xs text-muted-foreground">
                  年付 ¥{p.yearlyPrice.toLocaleString()}（约
                  {((1 - p.yearlyPrice / (p.monthlyPrice * 12)) * 100).toFixed(0)}% 优惠）
                </div>
              )}

              {/* 积分 */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">基础积分</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums">
                    {p.baseCredits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">赠送积分</div>
                  <div className={cn("mt-0.5 text-sm font-semibold tabular-nums", meta.accent)}>
                    +{p.bonusCredits.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 功能 */}
              <ul className="mt-4 space-y-1.5 text-xs">
                <FeatureLine ok={p.canConsume} text={p.canConsume ? "可使用全部 AI 创作功能" : "AI 创作功能不可用"} />
                <FeatureLine ok={p.premiumModels} text="高级模型授权" />
                <FeatureLine ok={p.priorityQueue} text="优先队列" />
                <FeatureLine
                  ok
                  text={`套餐有效期 ${p.planValidDays === 0 ? "永久" : `${p.planValidDays} 天`}`}
                />
                <FeatureLine ok text={`积分有效期 ${p.creditValidDays} 天`} />
              </ul>

              <div className="mt-auto flex gap-2 pt-5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditing(t)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  编辑参数
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    resetPlan(t);
                    toast.success(`已重置「${p.name}」为默认参数`);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <PlanEditSheet
          key={editing}
          tier={editing}
          plan={plans[editing]}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function FeatureLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-full",
          ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50",
        )}
      >
        <Check className="h-2.5 w-2.5" />
      </span>
      <span className={ok ? "text-foreground" : "text-muted-foreground/60 line-through"}>{text}</span>
    </li>
  );
}

function PlanEditSheet({
  tier,
  plan,
  onClose,
}: {
  tier: PlanTier;
  plan: PlanConfig;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PlanConfig>(plan);

  const meta = PLAN_META[tier];
  const isFree = tier === "free";

  const save = () => {
    updatePlan(tier, {
      name: form.name,
      tagline: form.tagline,
      monthlyPrice: Math.max(0, Number(form.monthlyPrice) || 0),
      yearlyPrice: Math.max(0, Number(form.yearlyPrice) || 0),
      baseCredits: Math.max(0, Number(form.baseCredits) || 0),
      bonusCredits: Math.max(0, Number(form.bonusCredits) || 0),
      creditValidDays: Math.max(1, Number(form.creditValidDays) || 30),
      canConsume: isFree ? false : form.canConsume,
      priorityQueue: form.priorityQueue,
      premiumModels: form.premiumModels,
    });
    toast.success(`已保存「${form.name}」参数`);
    onClose();
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge variant="outline" className={cn("rounded-full", meta.badgeCls)}>
              {meta.label}
            </Badge>
            编辑套餐参数
          </SheetTitle>
          <SheetDescription>
            修改本套餐的价格、赠送积分与功能授权。免费版不可消费功能为强制项。
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Field label="套餐名称">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="一句话描述">
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="月价 (¥)">
              <Input
                type="number"
                min={0}
                value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })}
              />
            </Field>
            <Field label="年价 (¥)">
              <Input
                type="number"
                min={0}
                value={form.yearlyPrice}
                onChange={(e) => setForm({ ...form, yearlyPrice: Number(e.target.value) })}
              />
            </Field>
            <Field label="基础积分 / 月">
              <Input
                type="number"
                min={0}
                value={form.baseCredits}
                onChange={(e) => setForm({ ...form, baseCredits: Number(e.target.value) })}
              />
            </Field>
            <Field label="赠送积分 / 月">
              <Input
                type="number"
                min={0}
                value={form.bonusCredits}
                onChange={(e) => setForm({ ...form, bonusCredits: Number(e.target.value) })}
              />
            </Field>
            <Field label="积分有效期（天）">
              <Input
                type="number"
                min={1}
                value={form.creditValidDays}
                onChange={(e) => setForm({ ...form, creditValidDays: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
            <div className="text-xs font-medium text-foreground">功能授权</div>
            <SwitchRow
              label="允许使用消耗积分的 AI 功能"
              checked={form.canConsume}
              disabled={isFree}
              onChange={(v) => setForm({ ...form, canConsume: v })}
              hint={isFree ? "免费版强制不可用" : undefined}
            />
            <SwitchRow
              label="高级模型授权"
              checked={form.premiumModels}
              onChange={(v) => setForm({ ...form, premiumModels: v })}
            />
            <SwitchRow
              label="优先队列"
              checked={form.priorityQueue}
              onChange={(v) => setForm({ ...form, priorityQueue: v })}
            />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={save}>保存</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm">
        <div className="text-foreground">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

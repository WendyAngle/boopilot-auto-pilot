import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { ACTIVE_TENANTS } from "@/lib/managed-account-mock";
import { getCurrentUser } from "@/lib/auth";
import { getTenantScope } from "@/lib/tenant-scope";

/**
 * 「分配租户」通用弹窗
 * - 可选项：与顶部租户选择器一致（受 allowedTenantNames 约束）
 * - 默认选中：当前顶部租户作用域；若为「全部租户」则取首个可选项
 */
export function AssignTenantDialog({
  open,
  onOpenChange,
  count,
  entityLabel = "条数据",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  count: number;
  entityLabel?: string;
  onConfirm: (tenant: { id: string; name: string }) => void;
}) {
  const user = getCurrentUser();
  const allowed = user?.allowedTenantNames;
  const visibleTenants = allowed
    ? ACTIVE_TENANTS.filter((t) => allowed.includes(t.name))
    : ACTIVE_TENANTS;

  const pickDefault = () => {
    const scope = getTenantScope();
    if (scope && scope !== "all" && visibleTenants.some((t) => t.id === scope)) {
      return scope;
    }
    return visibleTenants[0]?.id ?? "";
  };

  const [value, setValue] = useState<string>(pickDefault);

  useEffect(() => {
    if (open) setValue(pickDefault());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分配租户</DialogTitle>
          <DialogDescription>
            将所选 <b>{count}</b> {entityLabel}分配到指定租户。
          </DialogDescription>
        </DialogHeader>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="请选择租户" />
          </SelectTrigger>
          <SelectContent>
            {visibleTenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!value}
            onClick={() => {
              const t = visibleTenants.find((x) => x.id === value);
              if (!t) return;
              onConfirm({ id: t.id, name: t.name });
            }}
          >
            分配
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

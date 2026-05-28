import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Bot, Search } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2 } from "lucide-react";
import { ACTIVE_TENANTS } from "@/lib/managed-account-mock";
import { useTenantScope } from "@/lib/tenant-scope";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

// 已启用的智能体列表（与 智能体列表 页面保持一致）
const ENABLED_AGENTS = [
  { id: "ag-000", name: "账号运营助手", route: "/agents/workspace" as const },
  { id: "ag-001", name: "内容创作助手" },
  { id: "ag-002", name: "评论话术生成器" },
  { id: "ag-003", name: "多语言翻译助手" },
  { id: "ag-004", name: "风控分析专家" },
  { id: "ag-005", name: "数据洞察分析师" },
  { id: "ag-006", name: "客户互动机器人" },
];

function AppLayout() {
  const navigate = useNavigate();
  const [tenantScope, setTenantScopeState] = useTenantScope();
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  const resetAgentForm = () => {
    setSelectedAgent("");
  };

  const handleAgentCancel = () => {
    setAgentDialogOpen(false);
    resetAgentForm();
  };

  const handleAgentConfirm = () => {
    if (!selectedAgent) {
      toast.error("请先选择一个智能体");
      return;
    }
    const agent = ENABLED_AGENTS.find((a) => a.id === selectedAgent);
    if (agent?.route) {
      setAgentDialogOpen(false);
      resetAgentForm();
      navigate({ to: agent.route });
      return;
    }
    toast.info(`「${agent?.name}」工作台即将上线`);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索任务、账号、素材..."
              className="h-9 rounded-full bg-muted/60 pl-9 border-transparent focus-visible:bg-background"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                BP
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <Toaster position="top-right" />

        {/* 智能体全局悬浮按钮 */}
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setAgentDialogOpen(true)}
        >
          <Bot className="h-6 w-6" />
        </Button>

        {/* 智能体弹窗 */}
        <Dialog
          open={agentDialogOpen}
          onOpenChange={(open) => {
            setAgentDialogOpen(open);
            if (!open) resetAgentForm();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                智能体
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="agent-select">
                  智能体 <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger id="agent-select">
                    <SelectValue placeholder="请选择智能体" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENABLED_AGENTS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  选择智能体后将开启与智能体互动哦
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleAgentCancel}>
                取消
              </Button>
              <Button onClick={handleAgentConfirm}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}


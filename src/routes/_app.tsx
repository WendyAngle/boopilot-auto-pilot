import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [tenantScope, setTenantScopeState] = useTenantScope();

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
            <Select value={tenantScope} onValueChange={setTenantScopeState}>
              <SelectTrigger className="h-9 w-[180px] rounded-full bg-muted/60 border-transparent">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="切换租户" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">全部租户</SelectItem>
                {ACTIVE_TENANTS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      </SidebarInset>
    </SidebarProvider>
  );
}

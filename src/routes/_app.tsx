import { createFileRoute, Outlet } from "@tanstack/react-router";


import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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

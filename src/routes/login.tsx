import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Cloud, Send, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { login } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "登录 — BooPilot" },
      { name: "description", content: "登录 BooPilot 业务运营自动驾驶平台" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCloudLogin = () => {
    setLoading(true);
    setTimeout(() => {
      login("admin", "admin123");
      toast.success("已通过博海身份云登录");
      navigate({ to: "/" });
    }, 500);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] left-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-info/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        }}
      />

      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-6 sm:px-14">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Send className="h-4 w-4 -rotate-12" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground">
            BooPilot
          </span>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          身份云服务运行中
        </div>
      </header>

      {/* Centered hero + login */}
      <main className="flex flex-1 items-center justify-center px-6 pb-16 pt-4">
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur">
            BooPilot Platform
          </div>

          <h1 className="mt-6 text-5xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-6xl">
            业务运营
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              自动驾驶
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            统一接入账号、任务、素材、资源与智能体能力，让运营动作可配置、可追踪、可回放。
          </p>

          <Button
            type="button"
            onClick={handleCloudLogin}
            disabled={loading}
            className="group mt-10 h-12 min-w-[16rem] justify-center rounded-full px-8 text-base font-medium text-primary-foreground"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-elegant)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                正在跳转身份云...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4" />
                身份云登录
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            企业级单点登录，统一身份与权限治理
          </div>

          <p className="mt-8 text-[11px] leading-5 text-muted-foreground">
            登录即代表您同意 BooPilot 的
            <span className="text-foreground/70"> 服务条款 </span>
            与
            <span className="text-foreground/70"> 隐私政策</span>
          </p>
        </div>
      </main>

      <footer className="px-8 pb-6 text-center text-xs text-muted-foreground sm:px-14">
        © {new Date().getFullYear()} BooPilot · 业务运营自动驾驶平台
      </footer>

      <Toaster position="top-right" />
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Cloud, Send, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/4 -z-10 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 -z-10 h-[28rem] w-[28rem] rounded-full bg-info/20 blur-3xl" />

      <div className="grid w-full max-w-6xl grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Brand / intro panel */}
        <section
          className="flex flex-col justify-between rounded-3xl border border-border/60 bg-card/80 p-10 backdrop-blur-xl"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          <div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Send className="h-7 w-7 -rotate-12" />
            </div>

            <div className="mt-16 max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                BooPilot Platform
              </div>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                业务运营自动驾驶
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                统一接入账号、任务、素材、资源与智能体能力，让运营动作可配置、可追踪、可回放。
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { k: "24/7", v: "任务执行" },
              { k: "多租户", v: "隔离管理" },
              { k: "AI", v: "模板生成" },
            ].map((it) => (
              <div
                key={it.k}
                className="rounded-2xl border border-border/60 bg-background/60 px-4 py-4"
              >
                <div className="text-lg font-semibold text-foreground">{it.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{it.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Login panel */}
        <section
          className="flex flex-col justify-center rounded-3xl border border-border/60 bg-card/85 p-10 backdrop-blur-xl"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Send className="h-7 w-7 -rotate-12" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              BooPilot
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">使用身份云继续工作</p>
          </div>

          <Button
            type="button"
            onClick={handleCloudLogin}
            disabled={loading}
            className="mt-8 h-12 w-full rounded-xl text-base font-medium text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                正在跳转...
              </>
            ) : (
              <>
                <Cloud className="h-5 w-5" />
                身份云登录
              </>
            )}
          </Button>

          <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              企业级单点登录，统一身份与权限治理
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              首次登录将由管理员分配租户与角色
            </li>
          </ul>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            登录即代表您同意 BooPilot 的服务条款与隐私政策
          </p>
        </section>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

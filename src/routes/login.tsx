import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Cloud, Send, ShieldCheck, Loader2 } from "lucide-react";
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

      <div className="w-full max-w-md">
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

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            企业级单点登录，统一身份与权限治理
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            登录即代表您同意 BooPilot 的服务条款与隐私政策
          </p>
        </section>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

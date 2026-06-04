import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, RotateCcw, LogIn, Cloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setUsername("");
    setPassword("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("请输入用户名和密码");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("登录成功");
      navigate({ to: "/" });
    }, 500);
  };

  const handleCloudLogin = () => {
    toast.success("已通过博海身份云登录");
    setTimeout(() => navigate({ to: "/" }), 400);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute -left-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-info/20 blur-3xl" />

      <div className="w-full max-w-md">
        <div
          className="rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur-xl"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          {/* Brand */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Cloud className="h-7 w-7" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                BooPilot
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                业务运营自动驾驶平台
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="h-11 rounded-xl bg-muted/40 pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="h-11 rounded-xl bg-muted/40 pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(!!v)}
                />
                记住我
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => toast.info("请联系管理员重置密码")}
              >
                忘记密码？
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
                重置
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl"
                style={{ background: "var(--gradient-primary)" }}
              >
                <LogIn className="h-4 w-4" />
                {loading ? "登录中..." : "登录"}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                第三方登录
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCloudLogin}
            className="h-11 w-full rounded-xl bg-success text-success-foreground hover:bg-success/90"
          >
            <Cloud className="h-4 w-4" />
            博海身份云登录
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

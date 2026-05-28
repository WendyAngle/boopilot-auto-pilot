import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/agents/models")({
  component: () => <PlaceholderPage title="模型配置" description="配置智能体所使用的模型及参数。" />,
  head: () => ({ meta: [{ title: "模型配置 — BooPilot" }] }),
});

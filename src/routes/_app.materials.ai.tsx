import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/materials/ai")({
  component: () => (
    <PlaceholderPage
      title="AI 创作"
      description="基于智能体的素材生成工作台，后续支持图文 / 视频 / 多模态创作。"
    />
  ),
  head: () => ({ meta: [{ title: "AI 创作 — BooPilot" }] }),
});

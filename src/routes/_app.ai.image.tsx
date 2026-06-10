import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/ai/image")({
  component: () => (
    <PlaceholderPage title="图片生成" description="AI 图片生成功能建设中。" />
  ),
  head: () => ({ meta: [{ title: "图片生成 — BooPilot" }] }),
});

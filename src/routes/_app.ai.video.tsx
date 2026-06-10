import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/ai/video")({
  component: () => (
    <PlaceholderPage title="视频生成" description="AI 视频生成功能建设中。" />
  ),
  head: () => ({ meta: [{ title: "视频生成 — BooPilot" }] }),
});

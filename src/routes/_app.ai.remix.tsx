import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/ai/remix")({
  component: () => (
    <PlaceholderPage title="视频混剪" description="视频混剪功能建设中。" />
  ),
  head: () => ({ meta: [{ title: "视频混剪 — BooPilot" }] }),
});

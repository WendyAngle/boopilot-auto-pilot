import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/ai/materials")({
  component: () => (
    <PlaceholderPage title="我的原料" description="我的原料功能建设中。" />
  ),
  head: () => ({ meta: [{ title: "我的原料 — BooPilot" }] }),
});

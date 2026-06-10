import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_app/ai/library")({
  component: () => (
    <PlaceholderPage title="AI 成片库" description="AI 成片库功能建设中。" />
  ),
  head: () => ({ meta: [{ title: "AI 成片库 — BooPilot" }] }),
});

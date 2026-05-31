import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/app/ChatPanel";

export const Route = createFileRoute("/_authenticated/app/support")({
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-primary mb-4">Soporte</h1>
      <p className="text-muted-foreground mb-4">Habla directamente con tu coach.</p>
      <ChatPanel />
    </div>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { CreditCard, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("*").eq("client_id", user.id).maybeSingle().then(({ data }) => setSub(data));
  }, [user]);
  const active = sub?.status === "active" || sub?.status === "trial";
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-primary mb-6">Mi plan</h1>
      <Card className={`p-8 shadow-deep border-0 ${active ? "bg-gradient-cta text-primary-foreground" : "bg-gradient-card"}`}>
        <div className="flex items-center gap-3">
          <CreditCard className={`h-10 w-10 ${active ? "" : "text-accent"}`} />
          <div>
            <p className={active ? "text-white/80" : "text-muted-foreground"}>Plan actual</p>
            <h2 className="text-3xl font-bold">{sub?.plan ?? "Free"}</h2>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2">
          {active ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5 text-destructive" />}
          <span className="font-semibold uppercase tracking-wide text-sm">{sub?.status ?? "inactive"}</span>
        </div>
        {sub?.expires_at && <p className={`mt-3 text-sm ${active ? "text-white/85" : "text-muted-foreground"}`}>Vence el {new Date(sub.expires_at).toLocaleDateString()}</p>}
      </Card>
    </div>
  );
}

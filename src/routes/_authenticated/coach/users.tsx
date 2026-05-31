import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/users")({
  component: UsersPage,
});

interface Row { id: string; full_name: string | null; blocked: boolean; subscription?: { plan: string; status: string } | null; }

function UsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const refresh = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id,full_name,blocked");
    const { data: subs } = await supabase.from("subscriptions").select("client_id,plan,status");
    const { data: clients } = await supabase.from("user_roles").select("user_id").eq("role", "client");
    const clientIds = new Set((clients ?? []).map((c) => c.user_id));
    const subMap = new Map((subs ?? []).map((s) => [s.client_id, s]));
    setRows((profiles ?? []).filter((p) => clientIds.has(p.id)).map((p) => ({
      ...p,
      subscription: subMap.get(p.id) as any,
    })));
  };
  useEffect(() => { refresh(); }, []);
  const toggleBlock = async (id: string, blocked: boolean) => {
    await supabase.from("profiles").update({ blocked: !blocked }).eq("id", id);
    toast.success(blocked ? "Cliente activado" : "Cliente bloqueado");
    refresh();
  };
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <h1 className="text-3xl font-bold text-primary mb-6">Clientes</h1>
      <div className="space-y-3">
        {rows.length === 0 && <Card className="p-8 text-center text-muted-foreground">Aún no tienes clientes.</Card>}
        {rows.map((r) => (
          <Card key={r.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-primary">{r.full_name ?? "Sin nombre"}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant={r.blocked ? "destructive" : "secondary"}>{r.blocked ? "Bloqueado" : "Activo"}</Badge>
                {r.subscription && <Badge variant="outline">{r.subscription.plan} · {r.subscription.status}</Badge>}
              </div>
            </div>
            <Button onClick={() => toggleBlock(r.id, r.blocked)} variant={r.blocked ? "hero" : "outline"} size="sm">
              {r.blocked ? <><Unlock className="h-4 w-4" /> Activar</> : <><Lock className="h-4 w-4" /> Bloquear</>}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

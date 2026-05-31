import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [routineId, setRoutineId] = useState("");
  const [list, setList] = useState<any[]>([]);

  const refresh = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "client");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      setClients(profiles ?? []);
    }
    const { data: r } = await supabase.from("routines").select("id,name");
    setRoutines(r ?? []);
    const { data: a } = await supabase.from("routine_assignments").select("id,active,assigned_at,routine:routines(name),client:profiles!routine_assignments_client_id_fkey(full_name)").order("assigned_at", { ascending: false });
    setList(a ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const assign = async () => {
    if (!clientId || !routineId || !user) return;
    const { error } = await supabase.from("routine_assignments").upsert({ client_id: clientId, routine_id: routineId, assigned_by: user.id, active: true }, { onConflict: "routine_id,client_id" });
    if (error) return toast.error(error.message);
    const routineName = routines.find((r) => r.id === routineId)?.name ?? "Rutina";
    await supabase.from("notifications").insert({ user_id: clientId, title: "Nueva rutina asignada", body: routineName, link: "/app/training" });
    toast.success("Asignada y notificada");
    refresh();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">Asignar rutinas</h1>
      <Card className="p-5 grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name ?? c.id}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rutina</Label>
          <Select value={routineId} onValueChange={setRoutineId}>
            <SelectTrigger><SelectValue placeholder="Rutina" /></SelectTrigger>
            <SelectContent>{routines.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={assign} variant="hero">Asignar</Button>
      </Card>
      <div className="space-y-2">
        {list.map((a: any) => (
          <Card key={a.id} className="p-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-primary">{a.routine?.name}</div>
              <div className="text-xs text-muted-foreground">{a.client?.full_name ?? "Cliente"} · {new Date(a.assigned_at).toLocaleDateString()}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${a.active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{a.active ? "Activa" : "Inactiva"}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

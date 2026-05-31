import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/routines/")({
  component: RoutinesList,
});

interface R { id: string; name: string; is_free: boolean; is_challenge: boolean; }

function RoutinesList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [routines, setRoutines] = useState<R[]>([]);
  const [name, setName] = useState("");
  const refresh = async () => {
    const { data } = await supabase.from("routines").select("id,name,is_free,is_challenge").order("created_at", { ascending: false });
    setRoutines((data as R[]) ?? []);
  };
  useEffect(() => { refresh(); }, []);
  const create = async () => {
    if (!name.trim() || !user) return;
    const { data, error } = await supabase.from("routines").insert({ name: name.trim(), created_by: user.id }).select().single();
    if (error) return toast.error(error.message);
    // create 7 empty days
    await supabase.from("routine_days").insert(Array.from({ length: 7 }, (_, i) => ({ routine_id: data.id, day_of_week: i + 1 })));
    toast.success("Rutina creada");
    nav({ to: "/coach/routines/$id", params: { id: data.id } });
  };
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">Rutinas</h1>
      <Card className="p-4 flex gap-2">
        <Input placeholder="Nombre de la nueva rutina" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={create} variant="hero"><Plus className="h-4 w-4" />Crear</Button>
      </Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.map((r) => (
          <Card key={r.id} className="bg-gradient-card p-5 shadow-soft hover:shadow-glow transition-all">
            <h3 className="font-semibold text-primary text-lg">{r.name}</h3>
            <div className="flex gap-2 mt-2 text-xs">
              {r.is_free && <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent">Gratis</span>}
              {r.is_challenge && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">Reto</span>}
            </div>
            <Button asChild variant="hero" size="sm" className="mt-4 w-full"><Link to="/coach/routines/$id" params={{ id: r.id }}>Editar</Link></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

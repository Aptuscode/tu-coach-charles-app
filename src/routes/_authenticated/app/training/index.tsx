import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Trophy, Gift } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/training/")({
  component: TrainingList,
});

interface Routine { id: string; name: string; description: string | null; is_free: boolean; is_challenge: boolean; }

function Section({ title, icon: Icon, items }: { title: string; icon: typeof Dumbbell; items: Routine[] }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold text-primary">{title}</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((r) => (
          <Card key={r.id} className="bg-gradient-card p-5 shadow-soft hover:shadow-glow transition-all">
            <h3 className="font-semibold text-primary text-lg">{r.name}</h3>
            {r.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
            <Button asChild variant="hero" size="sm" className="mt-4 w-full">
              <Link to="/app/training/$id" params={{ id: r.id }}>Ver rutina</Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function TrainingList() {
  const { user } = useAuth();
  const [assigned, setAssigned] = useState<Routine[]>([]);
  const [free, setFree] = useState<Routine[]>([]);
  const [challenges, setChallenges] = useState<Routine[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: a } = await supabase
        .from("routine_assignments")
        .select("routine:routines(id,name,description,is_free,is_challenge)")
        .eq("client_id", user.id).eq("active", true);
      setAssigned(((a ?? []).map((x: any) => x.routine).filter(Boolean)) as Routine[]);
      const { data: f } = await supabase.from("routines").select("id,name,description,is_free,is_challenge").eq("is_free", true);
      setFree((f as Routine[]) ?? []);
      const { data: c } = await supabase.from("routines").select("id,name,description,is_free,is_challenge").eq("is_challenge", true);
      setChallenges((c as Routine[]) ?? []);
    })();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">Entrenamiento</h1>
        <p className="text-muted-foreground">Tus rutinas, retos del mes y rutinas gratis.</p>
      </header>
      {assigned.length === 0 && free.length === 0 && challenges.length === 0 && (
        <Card className="p-8 text-center bg-gradient-card">
          <Dumbbell className="h-10 w-10 mx-auto text-accent" />
          <p className="mt-3 text-muted-foreground">Aún no tienes rutinas asignadas. Tu coach te asignará una pronto.</p>
        </Card>
      )}
      <Section title="Mis rutinas" icon={Dumbbell} items={assigned} />
      <Section title="Retos del mes" icon={Trophy} items={challenges} />
      <Section title="Rutinas gratis" icon={Gift} items={free} />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, BookOpen, Megaphone, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coach/")({
  component: CoachHome,
});

function CoachHome() {
  const [stats, setStats] = useState({ clients: 0, routines: 0, announcements: 0, assignments: 0 });
  useEffect(() => {
    (async () => {
      const [c, r, a, ass] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("routines").select("*", { count: "exact", head: true }),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase.from("routine_assignments").select("*", { count: "exact", head: true }).eq("active", true),
      ]);
      setStats({ clients: c.count ?? 0, routines: r.count ?? 0, announcements: a.count ?? 0, assignments: ass.count ?? 0 });
    })();
  }, []);
  const cards = [
    { to: "/coach/users", label: "Clientes", value: stats.clients, icon: Users },
    { to: "/coach/routines", label: "Rutinas", value: stats.routines, icon: BookOpen },
    { to: "/coach/announcements", label: "Anuncios", value: stats.announcements, icon: Megaphone },
    { to: "/coach/assignments", label: "Asignaciones activas", value: stats.assignments, icon: Send },
  ];
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <Card className="bg-gradient-header text-primary-foreground p-6 shadow-deep border-0">
        <h1 className="text-2xl font-bold">Panel de Coach</h1>
        <p className="text-white/85 text-sm mt-1">Gestiona clientes, rutinas, dietas y anuncios.</p>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="bg-gradient-card p-5 shadow-soft hover:shadow-glow transition-all">
              <c.icon className="h-6 w-6 text-accent" />
              <div className="text-3xl font-bold text-primary mt-3">{c.value}</div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

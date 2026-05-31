import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import poster1 from "@/assets/poster-disciplina.jpg";
import poster2 from "@/assets/poster-excusas.jpg";
import poster3 from "@/assets/poster-fuerte.jpg";
import { Megaphone, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/app/")({
  component: ClientHome,
});

const fallbackPosters = [poster1, poster2, poster3];

interface Announcement { id: string; title: string; content: string | null; kind: string; image_url: string | null; created_at: string; }

function ClientHome() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems((data as Announcement[]) ?? []));
    if (user) {
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <Card className="bg-gradient-header text-primary-foreground p-6 shadow-deep border-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6" />
          <div>
            <p className="text-white/80 text-sm">Hola,</p>
            <h1 className="text-2xl font-bold">{profile?.full_name ?? "atleta"} 💪</h1>
          </div>
        </div>
        <p className="mt-3 text-white/85 text-sm">No es suerte. Es disciplina. Vamos por el día de hoy.</p>
      </Card>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-bold text-primary">Muro</h2>
        </div>
        {items.length === 0 ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {fallbackPosters.map((p, i) => (
              <Card key={i} className="overflow-hidden p-0 shadow-soft">
                <img src={p} alt={`Motivación ${i + 1}`} loading="lazy" className="w-full h-64 object-cover" width={1024} height={1280} />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((a) => (
              <Card key={a.id} className="overflow-hidden p-0 shadow-soft hover:shadow-glow transition-all">
                {a.image_url && <img src={a.image_url} alt={a.title} loading="lazy" className="w-full h-44 object-cover" />}
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{a.kind}</span>
                  <h3 className="font-semibold text-primary mt-1">{a.title}</h3>
                  {a.content && <p className="text-sm text-muted-foreground mt-1">{a.content}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

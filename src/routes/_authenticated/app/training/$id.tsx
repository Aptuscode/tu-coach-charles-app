import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { exportRoutineToPdf, type RoutinePdfDay } from "@/lib/pdf";
import { getYouTubeEmbed } from "@/lib/youtube";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/training/$id")({
  component: RoutineDetail,
});

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Exercise { id: string; name: string; sets: number | null; reps: string | null; rest_seconds: number | null; video_url: string | null; file_url: string | null; notes: string | null; position: number; }
interface Day { id: string; day_of_week: number; title: string | null; exercises: Exercise[]; }
interface Routine { id: string; name: string; description: string | null; }

function RoutineDetail() {
  const { id } = Route.useParams();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [days, setDays] = useState<Day[]>([]);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from("routines").select("id,name,description").eq("id", id).maybeSingle();
      setRoutine(r as Routine);
      const { data: d } = await supabase.from("routine_days").select("id,day_of_week,title,exercises(id,name,sets,reps,rest_seconds,video_url,file_url,notes,position)").eq("routine_id", id).order("day_of_week");
      const sorted = ((d as any[]) ?? []).map((x) => ({ ...x, exercises: (x.exercises ?? []).sort((a: any, b: any) => a.position - b.position) }));
      setDays(sorted as Day[]);
    })();
  }, [id]);

  const handleExport = () => {
    if (!routine) return;
    const pdfDays: RoutinePdfDay[] = DAYS.map((dayName, i) => {
      const d = days.find((x) => x.day_of_week === i + 1);
      return { day: dayName, title: d?.title ?? null, exercises: d?.exercises ?? [] };
    });
    exportRoutineToPdf(routine.name, routine.description, pdfDays);
    toast.success("PDF descargado");
  };

  if (!routine) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2"><Link to="/app/training"><ArrowLeft className="h-4 w-4" /> Volver</Link></Button>
          <h1 className="text-3xl font-bold text-primary">{routine.name}</h1>
          {routine.description && <p className="text-muted-foreground mt-1">{routine.description}</p>}
        </div>
        <Button onClick={handleExport} variant="hero" size="lg"><Download className="h-4 w-4" /> Exportar a PDF</Button>
      </div>

      <div className="space-y-4">
        {DAYS.map((dayName, i) => {
          const d = days.find((x) => x.day_of_week === i + 1);
          return (
            <Card key={i} className="p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-primary">{dayName}{d?.title ? ` — ${d.title}` : ""}</h2>
              </div>
              {!d || d.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Día de descanso</p>
              ) : (
                <div className="space-y-3">
                  {d.exercises.map((ex) => {
                    const embed = ex.video_url ? getYouTubeEmbed(ex.video_url) : null;
                    return (
                      <div key={ex.id} className="border-l-4 border-accent pl-4 py-2">
                        <h3 className="font-semibold">{ex.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {[ex.sets && `${ex.sets} series`, ex.reps && `${ex.reps} reps`, ex.rest_seconds && `desc ${ex.rest_seconds}s`].filter(Boolean).join(" • ")}
                        </p>
                        {ex.notes && <p className="text-sm mt-1">{ex.notes}</p>}
                        {embed && (
                          <div className="mt-2 aspect-video rounded-lg overflow-hidden">
                            <iframe src={embed} className="w-full h-full" allowFullScreen title={ex.name} />
                          </div>
                        )}
                        {ex.video_url && !embed && (
                          <a href={ex.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent text-sm mt-1 hover:underline"><ExternalLink className="h-3 w-3" /> Ver video</a>
                        )}
                        {ex.file_url && (
                          <a href={ex.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent text-sm mt-1 hover:underline"><Download className="h-3 w-3" /> Archivo</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

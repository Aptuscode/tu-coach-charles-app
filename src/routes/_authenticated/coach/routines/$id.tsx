import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { exportRoutineToPdf, type RoutinePdfDay } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/routines/$id")({
  component: RoutineEditor,
});

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Ex { id: string; name: string; sets: number | null; reps: string | null; rest_seconds: number | null; video_url: string | null; notes: string | null; position: number; }
interface D { id: string; day_of_week: number; title: string | null; exercises: Ex[]; }

function RoutineEditor() {
  const { id } = Route.useParams();
  const [routine, setRoutine] = useState<any>(null);
  const [days, setDays] = useState<D[]>([]);

  const refresh = async () => {
    const { data: r } = await supabase.from("routines").select("*").eq("id", id).maybeSingle();
    setRoutine(r);
    const { data: d } = await supabase.from("routine_days").select("id,day_of_week,title,exercises(id,name,sets,reps,rest_seconds,video_url,notes,position)").eq("routine_id", id).order("day_of_week");
    const sorted = ((d as any[]) ?? []).map((x) => ({ ...x, exercises: (x.exercises ?? []).sort((a: any, b: any) => a.position - b.position) }));
    setDays(sorted as D[]);
  };
  useEffect(() => { refresh(); }, [id]);

  const saveRoutine = async () => {
    await supabase.from("routines").update({ name: routine.name, description: routine.description, is_free: routine.is_free, is_challenge: routine.is_challenge }).eq("id", id);
    toast.success("Guardado");
  };

  const updateDayTitle = async (dayId: string, title: string) => {
    await supabase.from("routine_days").update({ title }).eq("id", dayId);
  };

  const addExercise = async (dayId: string, position: number) => {
    await supabase.from("exercises").insert({ routine_day_id: dayId, name: "Nuevo ejercicio", position });
    refresh();
  };
  const updateEx = async (exId: string, patch: Partial<Ex>) => {
    await supabase.from("exercises").update(patch).eq("id", exId);
  };
  const deleteEx = async (exId: string) => {
    await supabase.from("exercises").delete().eq("id", exId); refresh();
  };

  const exportPdf = () => {
    if (!routine) return;
    const pdfDays: RoutinePdfDay[] = DAYS.map((d, i) => {
      const day = days.find((x) => x.day_of_week === i + 1);
      return { day: d, title: day?.title ?? null, exercises: day?.exercises ?? [] };
    });
    exportRoutineToPdf(routine.name, routine.description, pdfDays);
  };

  if (!routine) return <div className="p-8 text-muted-foreground text-center">Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/coach/routines"><ArrowLeft className="h-4 w-4" />Volver</Link></Button>
      <Card className="p-5 space-y-3">
        <div><Label>Nombre</Label><Input value={routine.name} onChange={(e) => setRoutine({ ...routine, name: e.target.value })} /></div>
        <div><Label>Descripción</Label><Textarea value={routine.description ?? ""} onChange={(e) => setRoutine({ ...routine, description: e.target.value })} /></div>
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2"><Switch checked={routine.is_free} onCheckedChange={(v) => setRoutine({ ...routine, is_free: v })} />Gratis</label>
          <label className="flex items-center gap-2"><Switch checked={routine.is_challenge} onCheckedChange={(v) => setRoutine({ ...routine, is_challenge: v })} />Reto del mes</label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={saveRoutine} variant="hero">Guardar</Button>
          <Button onClick={exportPdf} variant="outline"><Download className="h-4 w-4" />Exportar PDF</Button>
        </div>
      </Card>

      <div className="space-y-4">
        {DAYS.map((dayName, i) => {
          const day = days.find((x) => x.day_of_week === i + 1);
          if (!day) return null;
          return (
            <Card key={day.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-bold text-primary text-lg w-28">{dayName}</h2>
                <Input placeholder="Título del día (ej. Pecho y tríceps)" defaultValue={day.title ?? ""} onBlur={(e) => updateDayTitle(day.id, e.target.value)} />
                <Button size="sm" variant="hero" onClick={() => addExercise(day.id, day.exercises.length)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {day.exercises.map((ex) => (
                  <div key={ex.id} className="border-l-4 border-accent pl-3 py-2 grid sm:grid-cols-12 gap-2 items-start">
                    <Input className="sm:col-span-3" defaultValue={ex.name} onBlur={(e) => updateEx(ex.id, { name: e.target.value })} placeholder="Nombre" />
                    <Input className="sm:col-span-1" type="number" defaultValue={ex.sets ?? ""} onBlur={(e) => updateEx(ex.id, { sets: e.target.value ? Number(e.target.value) : null })} placeholder="Series" />
                    <Input className="sm:col-span-2" defaultValue={ex.reps ?? ""} onBlur={(e) => updateEx(ex.id, { reps: e.target.value || null })} placeholder="Reps" />
                    <Input className="sm:col-span-1" type="number" defaultValue={ex.rest_seconds ?? ""} onBlur={(e) => updateEx(ex.id, { rest_seconds: e.target.value ? Number(e.target.value) : null })} placeholder="Desc s" />
                    <Input className="sm:col-span-3" defaultValue={ex.video_url ?? ""} onBlur={(e) => updateEx(ex.id, { video_url: e.target.value || null })} placeholder="URL video YouTube/Vimeo" />
                    <Input className="sm:col-span-2" defaultValue={ex.notes ?? ""} onBlur={(e) => updateEx(ex.id, { notes: e.target.value || null })} placeholder="Notas" />
                    <Button size="icon" variant="ghost" onClick={() => deleteEx(ex.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                {day.exercises.length === 0 && <p className="text-sm text-muted-foreground italic">Día de descanso. Agrega un ejercicio para empezar.</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

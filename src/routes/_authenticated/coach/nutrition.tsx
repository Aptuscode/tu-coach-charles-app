import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/nutrition")({
  component: CoachNutrition,
});

function CoachNutrition() {
  const { user } = useAuth();
  const [clients, setClients] = useState<{ id: string; full_name: string | null }[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [diets, setDiets] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "client");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        setClients(profiles ?? []);
      }
    })();
  }, []);

  useEffect(() => {
    if (!clientId) { setDiets([]); return; }
    supabase.from("diet_plans").select("*").eq("client_id", clientId).order("created_at", { ascending: false })
      .then(({ data }) => setDiets(data ?? []));
  }, [clientId]);

  const upload = async (file: File) => {
    if (!clientId || !user) return toast.error("Selecciona un cliente");
    const path = `${clientId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("diet-pdfs").upload(path, file);
    if (error) return toast.error(error.message);
    await supabase.from("diet_plans").insert({ client_id: clientId, uploaded_by: user.id, title: title || file.name, pdf_path: path });
    await supabase.from("notifications").insert({ user_id: clientId, title: "Nueva dieta disponible", body: title || file.name, link: "/app/nutrition" });
    setTitle("");
    toast.success("Dieta subida");
    const { data } = await supabase.from("diet_plans").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setDiets(data ?? []);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">Nutrición — Subir dietas</h1>
      <Card className="p-5 space-y-3">
        <div>
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
            <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name ?? c.id}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Título del plan</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Plan de definición — Mayo" /></div>
        <div>
          <Label className="flex items-center gap-2"><Upload className="h-4 w-4" />PDF de dieta</Label>
          <Input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
      </Card>
      {diets.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold text-primary mb-2">Planes del cliente</h2>
          <div className="space-y-1 text-sm">
            {diets.map((d) => (
              <div key={d.id} className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent" />{d.title} <span className="text-xs text-muted-foreground ml-auto">{new Date(d.created_at).toLocaleDateString()}</span></div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

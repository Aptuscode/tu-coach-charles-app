import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/announcements")({
  component: AnnouncementsAdmin,
});

function AnnouncementsAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", content: "", kind: "announcement", image_url: "" });
  const refresh = () => supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { refresh(); }, []);
  const create = async () => {
    if (!form.title || !user) return;
    const { error } = await supabase.from("announcements").insert({
      ...form,
      kind: form.kind as "announcement" | "discipline" | "motivation",
      image_url: form.image_url || null,
      created_by: user.id,
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", content: "", kind: "announcement", image_url: "" });
    toast.success("Publicado"); refresh();
  };
  const del = async (id: string) => { await supabase.from("announcements").delete().eq("id", id); refresh(); };
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold text-primary">Muro de anuncios</h1>
      <Card className="p-5 space-y-3">
        <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Contenido</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Anuncio</SelectItem>
                <SelectItem value="motivation">Motivación</SelectItem>
                <SelectItem value="discipline">Disciplina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>URL de imagen (opcional)</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
        </div>
        <Button onClick={create} variant="hero">Publicar</Button>
      </Card>
      <div className="space-y-2">
        {items.map((it) => (
          <Card key={it.id} className="p-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-primary">{it.title}</div>
              <div className="text-xs text-muted-foreground uppercase">{it.kind}</div>
            </div>
            <Button onClick={() => del(it.id)} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

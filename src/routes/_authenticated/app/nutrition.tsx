import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileText, Image as ImageIcon, FlaskConical } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/nutrition")({
  component: NutritionPage,
});

interface DietPlan { id: string; title: string; pdf_path: string; created_at: string; }
interface Photo { id: string; image_path: string; note: string | null; taken_at: string; }
interface Lab { id: string; file_path: string; description: string | null; created_at: string; }

function NutritionPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({ height_cm: "", weight_kg: "", birth_date: "", gender: "", occupation: "", goals: "", medical_history: "", family_history: "", allergies: "" });
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [signedDiet, setSignedDiet] = useState<Record<string, string>>({});

  const refresh = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("nutrition_profiles").select("*").eq("client_id", user.id).maybeSingle();
    if (p) setProfile({ ...p });
    const { data: d } = await supabase.from("diet_plans").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
    setDiets((d as DietPlan[]) ?? []);
    const { data: ph } = await supabase.from("progress_photos").select("*").eq("client_id", user.id).order("taken_at", { ascending: false });
    setPhotos((ph as Photo[]) ?? []);
    const { data: l } = await supabase.from("lab_results").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
    setLabs((l as Lab[]) ?? []);
  };

  useEffect(() => { refresh(); }, [user]);

  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      for (const d of diets) {
        const { data } = await supabase.storage.from("diet-pdfs").createSignedUrl(d.pdf_path, 3600);
        if (data?.signedUrl) map[d.id] = data.signedUrl;
      }
      setSignedDiet(map);
    })();
  }, [diets]);

  const bmi = (() => {
    const h = parseFloat(profile.height_cm), w = parseFloat(profile.weight_kg);
    if (!h || !w) return null;
    return (w / Math.pow(h / 100, 2)).toFixed(2);
  })();

  const saveProfile = async () => {
    if (!user) return;
    const payload = {
      client_id: user.id,
      height_cm: profile.height_cm ? Number(profile.height_cm) : null,
      weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
      birth_date: profile.birth_date || null,
      gender: profile.gender || null,
      occupation: profile.occupation || null,
      goals: profile.goals || null,
      medical_history: profile.medical_history || null,
      family_history: profile.family_history || null,
      allergies: profile.allergies || null,
    };
    const { error } = await supabase.from("nutrition_profiles").upsert(payload, { onConflict: "client_id" });
    if (error) toast.error(error.message);
    else { toast.success("Datos guardados"); refresh(); }
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("progress-photos").upload(path, file);
    if (error) return toast.error(error.message);
    await supabase.from("progress_photos").insert({ client_id: user.id, image_path: path });
    toast.success("Foto subida"); refresh();
  };

  const uploadLab = async (file: File, desc: string) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lab-results").upload(path, file);
    if (error) return toast.error(error.message);
    await supabase.from("lab_results").insert({ client_id: user.id, file_path: path, description: desc });
    toast.success("Laboratorio subido"); refresh();
  };

  const photoUrl = (path: string) => supabase.storage.from("progress-photos").createSignedUrl(path, 3600);

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const m: Record<string, string> = {};
      for (const p of photos) { const { data } = await photoUrl(p.image_path); if (data?.signedUrl) m[p.id] = data.signedUrl; }
      setPhotoUrls(m);
    })();
  }, [photos]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary">Nutrición</h1>
        <p className="text-muted-foreground">Tus datos clínicos, planes y avances.</p>
      </header>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="anthro">Antropometría</TabsTrigger>
          <TabsTrigger value="diets">Dietas</TabsTrigger>
          <TabsTrigger value="photos">Avances</TabsTrigger>
          <TabsTrigger value="labs">Laboratorio</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Fecha de nacimiento</Label><Input type="date" value={profile.birth_date ?? ""} onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })} /></div>
              <div><Label>Género</Label><Input value={profile.gender ?? ""} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Ocupación</Label><Input value={profile.occupation ?? ""} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Objetivos</Label><Textarea value={profile.goals ?? ""} onChange={(e) => setProfile({ ...profile, goals: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Historia clínica</Label><Textarea value={profile.medical_history ?? ""} onChange={(e) => setProfile({ ...profile, medical_history: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Antecedentes familiares</Label><Textarea value={profile.family_history ?? ""} onChange={(e) => setProfile({ ...profile, family_history: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Alergias</Label><Textarea value={profile.allergies ?? ""} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} /></div>
            </div>
            <Button onClick={saveProfile} variant="hero">Guardar</Button>
          </Card>
        </TabsContent>

        <TabsContent value="anthro">
          <Card className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Talla (cm)</Label><Input type="number" step="0.1" value={profile.height_cm ?? ""} onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })} /></div>
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={profile.weight_kg ?? ""} onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })} /></div>
            </div>
            {bmi && (
              <div className="p-4 rounded-xl bg-gradient-cta text-primary-foreground shadow-glow">
                <div className="text-sm opacity-90">IMC</div>
                <div className="text-3xl font-bold">{bmi}</div>
              </div>
            )}
            <Button onClick={saveProfile} variant="hero">Guardar</Button>
          </Card>
        </TabsContent>

        <TabsContent value="diets">
          <div className="space-y-3">
            {diets.length === 0 && <Card className="p-8 text-center text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 text-accent" />Tu coach aún no ha subido planes.</Card>}
            {diets.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-primary">{d.title}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  {signedDiet[d.id] && (
                    <Button asChild variant="hero" size="sm"><a href={signedDiet[d.id]} download target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Descargar PDF</a></Button>
                  )}
                </div>
                {signedDiet[d.id] && (
                  <iframe src={signedDiet[d.id]} className="mt-4 w-full h-[60vh] rounded-lg border border-border" title={d.title} />
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <Card className="p-4 mb-4">
            <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Subir foto de avance</Label>
            <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} className="mt-2" />
          </Card>
          {photos.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground"><ImageIcon className="h-8 w-8 mx-auto mb-2 text-accent" />Sin fotos aún.</Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-muted shadow-soft">
                  {photoUrls[p.id] && <img src={photoUrls[p.id]} alt="Avance" className="w-full h-full object-cover" />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="labs">
          <LabUploader onUpload={uploadLab} labs={labs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LabUploader({ onUpload, labs }: { onUpload: (f: File, d: string) => Promise<unknown>; labs: Lab[] }) {
  const [desc, setDesc] = useState("");
  const [signed, setSigned] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const m: Record<string, string> = {};
      for (const l of labs) { const { data } = await supabase.storage.from("lab-results").createSignedUrl(l.file_path, 3600); if (data?.signedUrl) m[l.id] = data.signedUrl; }
      setSigned(m);
    })();
  }, [labs]);
  return (
    <>
      <Card className="p-4 mb-4 space-y-2">
        <Label>Descripción</Label>
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej. Perfil tiroideo Mayo 2026" />
        <Label>Archivo (PDF / imagen)</Label>
        <Input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], desc)} />
      </Card>
      {labs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground"><FlaskConical className="h-8 w-8 mx-auto mb-2 text-accent" />Sin resultados aún.</Card>
      ) : (
        <div className="space-y-2">
          {labs.map((l) => (
            <Card key={l.id} className="p-3 flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{l.description ?? "Resultado"}</div>
                <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</div>
              </div>
              {signed[l.id] && <Button asChild variant="outline" size="sm"><a href={signed[l.id]} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Ver</a></Button>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

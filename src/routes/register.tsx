import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — Tu Coach Charles Isaac" }, { name: "description", content: "Crea tu cuenta y comienza tu transformación con Charles Isaac." }] }),
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Nombre muy corto").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: form.full_name },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cuenta creada. Revisa tu correo para confirmar.");
    nav({ to: "/login" });
  };

  return (
    <AuthShell title="Crear cuenta" subtitle="Empieza tu transformación">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input id="full_name" required maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          ¿Ya tienes cuenta? <Link to="/login" className="text-accent hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}

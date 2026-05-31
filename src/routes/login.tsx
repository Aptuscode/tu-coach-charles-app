import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Tu Coach Charles Isaac" }, { name: "description", content: "Accede a tu cuenta para ver tus rutinas y planes de nutrición." }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { refreshRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    // load role then route
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user!.id).maybeSingle();
    await refreshRole();
    toast.success("Bienvenido");
    nav({ to: r?.role === "coach" ? "/coach" : "/app" });
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Bienvenido de vuelta">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="text-accent hover:underline">¿Olvidaste tu contraseña?</Link>
          <Link to="/register" className="text-accent hover:underline">Crear cuenta</Link>
        </div>
      </form>
    </AuthShell>
  );
}

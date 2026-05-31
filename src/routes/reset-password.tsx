import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Restablecer contraseña — Tu Coach Charles Isaac" }, { name: "description", content: "Define una nueva contraseña." }] }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash automatically and sets a session
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); return; }
    toast.success("Contraseña actualizada");
    nav({ to: "/login" });
  };
  return (
    <AuthShell title="Nueva contraseña" subtitle={ready ? "Define tu nueva contraseña" : "Verificando enlace..."}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={!ready}>Actualizar</Button>
      </form>
    </AuthShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar contraseña — Tu Coach Charles Isaac" }, { name: "description", content: "Recupera el acceso a tu cuenta." }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Te enviamos un correo para restablecer tu contraseña.");
  };
  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace por correo">
      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Revisa tu bandeja de entrada.</p>
          <Button asChild variant="hero" className="w-full"><Link to="/login">Volver al login</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full">Enviar enlace</Button>
          <p className="text-sm text-center"><Link to="/login" className="text-accent hover:underline">Volver</Link></p>
        </form>
      )}
    </AuthShell>
  );
}

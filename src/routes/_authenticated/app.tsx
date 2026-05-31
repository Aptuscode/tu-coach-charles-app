import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppLayout, clientNav } from "@/components/app/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/app")({
  component: ClientGate,
});

function ClientGate() {
  const { isReady, user, role } = useAuth();
  if (!isReady || (user && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role === "coach") return <Navigate to="/coach" replace />;
  return <AppLayout items={clientNav} title="Tu Coach" />;
}

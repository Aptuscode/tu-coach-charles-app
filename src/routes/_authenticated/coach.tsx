import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppLayout, coachNav } from "@/components/app/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/coach")({
  component: CoachGate,
});

function CoachGate() {
  const { isReady, user, role } = useAuth();
  if (!isReady || (user && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  // ¡Cadenero desactivado localmente! 
  // if (role !== "coach") return <Navigate to="/app" replace />;
  
  return <AppLayout items={coachNav} title="Panel Coach" />;
}
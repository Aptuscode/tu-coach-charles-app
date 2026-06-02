import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Dumbbell, Apple, CreditCard, MessageSquare, LogOut, Users, ListPlus, Megaphone, Send, BookOpen, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

export function AppLayout({ items, title }: { items: NavItem[]; title: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, user } = useAuth();
  const nav = useNavigate();

  // 🛡️ EL GUARDIA DE SEGURIDAD: Consultamos si el usuario está bloqueado/pendiente
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("blocked")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    await signOut();
    nav({ to: "/" });
  };

  // Pantalla de carga mientras el guardia revisa
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 🔒 LA SALA DE ESPERA: Si está bloqueado, no renderiza el contenido de la app
  if (profile?.blocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <img src={logo} alt="Logo Tu Coach" className="h-20 mb-8 drop-shadow-md" width={80} height={80} />
        <div className="bg-card p-8 rounded-2xl shadow-deep max-w-md w-full border border-border/60">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Cuenta en Revisión</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Tu registro se ha completado. Un administrador de <strong>Tu Coach Charles Isaac</strong> está revisando tu solicitud. Te daremos acceso en cuanto tu cuenta sea aprobada.
          </p>
          <Button onClick={handleLogout} variant="default" className="w-full font-semibold">
            <LogOut className="h-4 w-4 mr-2" /> Salir por ahora
          </Button>
        </div>
      </div>
    );
  }

  // Si no está bloqueado, lo dejamos pasar a la app normal
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border/60 bg-card">
        <div className="p-5 flex items-center gap-2 border-b border-border/60">
          <img src={logo} alt="Logo" className="h-9 w-auto" width={36} height={36} />
          <div className="text-sm font-semibold text-primary leading-tight">{title}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/app" && it.to !== "/coach" && path.startsWith(it.to));
            return (
              <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-gradient-cta text-primary-foreground shadow-glow" : "text-foreground hover:bg-secondary"}`}>
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="px-2 pb-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button onClick={handleLogout} variant="outline" className="w-full"><LogOut className="h-4 w-4" />Salir</Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-gradient-header text-primary-foreground shadow-deep">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-auto" width={32} height={32} />
            <span className="font-semibold">{title}</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="flex-1 min-w-0 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border/60">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/app" && it.to !== "/coach" && path.startsWith(it.to));
            return (
              <Link key={it.to} to={it.to} className={`flex flex-col items-center justify-center py-2 text-[10px] font-medium ${active ? "text-accent" : "text-muted-foreground"}`}>
                <it.icon className="h-5 w-5 mb-0.5" />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const clientNav: NavItem[] = [
  { to: "/app", label: "Inicio", icon: Home },
  { to: "/app/training", label: "Entreno", icon: Dumbbell },
  { to: "/app/nutrition", label: "Nutrición", icon: Apple },
  { to: "/app/subscription", label: "Plan", icon: CreditCard },
  { to: "/app/support", label: "Soporte", icon: MessageSquare },
];

export const coachNav: NavItem[] = [
  { to: "/coach", label: "Inicio", icon: Home },
  { to: "/coach/users", label: "Usuarios", icon: Users },
  { to: "/coach/routines", label: "Rutinas", icon: BookOpen },
  { to: "/coach/nutrition", label: "Nutrición", icon: Apple },
  { to: "/coach/announcements", label: "Muro", icon: Megaphone },
  { to: "/coach/assignments", label: "Asignar", icon: Send },
];
import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";
import poster1 from "@/assets/poster-disciplina.jpg";
import poster2 from "@/assets/poster-excusas.jpg";
import poster3 from "@/assets/poster-fuerte.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Apple, MessageSquare, Trophy, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tu Coach Charles Isaac — Entrenamiento y Nutrición" },
      { name: "description", content: "Transforma tu cuerpo con planes de entrenamiento y nutrición personalizados, seguimiento en tiempo real y soporte directo de Charles Isaac." },
      { property: "og:title", content: "Tu Coach Charles Isaac" },
      { property: "og:description", content: "Entrenamiento y nutrición personalizados — instala la app y empieza hoy." },
      { property: "og:image", content: hero },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Tu Coach Charles Isaac" className="h-10 w-auto" width={40} height={40} />
            <span className="hidden sm:block font-bold text-primary">Tu Coach Charles Isaac</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Iniciar sesión</Link></Button>
            <Button asChild variant="hero" size="sm"><Link to="/register">Registrarse</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <img src={hero} alt="Atleta entrenando con kettlebell" className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-50" width={1536} height={1024} />
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-primary-foreground">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs uppercase tracking-widest mb-5">Personal trainer · Nutrition coach</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Entrena con <span className="text-gradient bg-gradient-to-r from-white via-cyan-200 to-white">disciplina</span>. Transforma tu vida.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/85">
              Planes de entrenamiento y nutrición 100% personalizados, accesibles desde tu móvil como una app instalable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl"><Link to="/register">Empezar ahora</Link></Button>
              <Button asChild variant="ice" size="xl"><Link to="/login">Ya tengo cuenta</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Todo lo que necesitas, en un solo lugar</h2>
          <p className="mt-3 text-muted-foreground">Rutinas, dietas, seguimiento y soporte directo con tu coach.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Dumbbell, title: "Rutinas semanales", desc: "Planificador L–D con videos y archivos descargables." },
            { icon: Apple, title: "Plan nutricional", desc: "Dietas en PDF, IMC automático e historia clínica." },
            { icon: Trophy, title: "Retos del mes", desc: "Desafíos para mantener la motivación al máximo." },
            { icon: MessageSquare, title: "Soporte 1 a 1", desc: "Mensajería directa con Charles Isaac." },
          ].map((s) => (
            <Card key={s.title} className="bg-gradient-card p-6 shadow-soft hover:shadow-glow transition-all border-border/60">
              <div className="h-12 w-12 rounded-xl bg-gradient-cta flex items-center justify-center text-primary-foreground shadow-glow mb-4">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-primary">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Video */}
      <section className="container mx-auto px-4 py-12">
        <Card className="overflow-hidden bg-gradient-header text-primary-foreground p-0 shadow-deep">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold">Conoce el método Charles Isaac</h2>
              <p className="mt-3 text-white/85">Mira el video de presentación y descubre cómo funciona el programa.</p>
              <div className="mt-6">
                <Button asChild variant="hero" size="lg"><Link to="/register">Crear mi cuenta</Link></Button>
              </div>
            </div>
            <div className="aspect-video md:aspect-auto bg-black/40 flex items-center justify-center relative">
              <video controls poster={hero} className="w-full h-full object-cover">
                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />                Tu navegador no soporta el video.
              </video>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/80">
                <PlayCircle className="h-16 w-16 drop-shadow-lg" />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Posters */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Mentalidad de campeón</h2>
          <p className="mt-3 text-muted-foreground">Inspiración diaria que tus clientes verán dentro de la app.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[poster1, poster2, poster3].map((p, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-soft hover:shadow-glow transition-all">
              <img src={p} alt={`Poster motivacional ${i + 1}`} loading="lazy" className="w-full h-full object-cover" width={1024} height={1280} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <Card className="bg-gradient-cta text-primary-foreground p-10 text-center shadow-glow border-0">
          <h2 className="text-3xl md:text-4xl font-bold">¿Listo para empezar?</h2>
          <p className="mt-3 max-w-xl mx-auto text-white/90">Crea tu cuenta gratis e instala la app en tu teléfono.</p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Button asChild variant="ice" size="xl"><Link to="/register">Registrarme</Link></Button>
            <Button asChild variant="deep" size="xl"><Link to="/login">Iniciar sesión</Link></Button>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Tu Coach Charles Isaac
      </footer>
    </div>
  );
}

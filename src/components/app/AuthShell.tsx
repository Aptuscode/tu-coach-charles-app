import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-hero">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <img src={logo} alt="Tu Coach Charles Isaac" className="h-14 w-auto" width={56} height={56} />
        </Link>
        <div className="bg-card rounded-2xl shadow-deep p-8 border border-border/60">
          <h1 className="text-2xl font-bold text-primary text-center">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground text-center mt-1">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

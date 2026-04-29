import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn, Printer, Laptop, Network, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Giseveral e Services" },
      { name: "description", content: "Aceda à sua conta Giseveral e Services para pedir serviços e acompanhar o histórico." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const benefits = [
  { icon: Printer, text: "Impressão, cópias e encadernação profissional" },
  { icon: Laptop, text: "Assistência informática rápida e de confiança" },
  { icon: Network, text: "Instalação de redes Wi-Fi e cabeamento" },
  { icon: ShieldCheck, text: "Acompanhe os seus pedidos em tempo real" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email ou palavra-passe incorretos"
          : error.message
      );
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/conta" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between bg-gradient-hero text-brand-foreground p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-brand-glow/30 blur-3xl pointer-events-none" />

        <Link to="/" className="flex items-center gap-3 relative z-10">
          <img src={logo} alt="Giseveral" className="h-12 w-12 rounded-lg object-cover shadow-card" />
          <div>
            <p className="text-lg font-bold tracking-wide">GISEVERAL</p>
            <p className="text-xs tracking-[0.2em] text-gold">E SERVICES</p>
          </div>
        </Link>

        <div className="relative z-10 my-auto">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
            Bem-vindo de<br />
            <span className="text-gold">volta!</span>
          </h1>
          <p className="mt-4 text-brand-foreground/75 text-lg leading-relaxed max-w-sm">
            Aceda à sua conta para pedir serviços, acompanhar pedidos e muito mais.
          </p>

          <ul className="mt-10 space-y-4">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <span className="text-sm text-brand-foreground/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-foreground/40 relative z-10">
          © {new Date().getFullYear()} Giseveral e Services · Beira, Moçambique
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-8">
          <img src={logo} alt="Giseveral" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="text-sm font-bold text-brand">GISEVERAL</p>
            <p className="text-[10px] tracking-widest text-gold">E SERVICES</p>
          </div>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Iniciar sessão</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/registo" className="font-semibold text-gold hover:underline">
                Criar conta
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="exemplo@email.com"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-smooth"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Palavra-passe
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-brand"
                  tabIndex={-1}
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 pr-11 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-smooth"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-brand py-3 text-sm font-semibold text-brand-foreground shadow-card transition-smooth hover:shadow-elegant disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-brand-foreground/30 border-t-brand-foreground animate-spin" />
                  A entrar...
                </span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-brand transition-smooth">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

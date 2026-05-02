import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/logo.jpeg";
import stationery from "@/assets/stationery.jpg";

export const Route = createFileRoute("/registo")({
  head: () => ({
    meta: [
      { title: "Criar Conta — Giseveral e Services" },
      { name: "description", content: "Crie a sua conta para pedir serviços de impressão, informática e redes mais rapidamente." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignupPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Nome muito curto").max(100),
    phone: z.string().trim().min(6, "Telefone inválido").max(20),
    email: z.string().trim().email("Email inválido").max(255),
    password: z.string().min(6, "Mínimo 6 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As palavras-passe não coincidem",
    path: ["confirm"],
  });

const perks = [
  "Acompanhe os seus pedidos em tempo real",
  "Histórico de serviços e compras",
  "Entrega ao domicílio na Beira",
  "Atendimento personalizado",
];

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", password: "", confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/conta`,
        data: { full_name: form.fullName, phone: form.phone },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Bem-vindo à Giseveral.");
    navigate({ to: "/conta" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – brand image */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between relative overflow-hidden">
        <img
          src={stationery}
          alt="Papelaria Giseveral"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/80 via-brand/60 to-brand/90" />

        <Link to="/" className="relative z-10 flex items-center gap-3 p-10">
          <img src={logo} alt="Giseveral" className="h-11 w-11 rounded-lg object-cover shadow-card" />
          <div>
            <p className="text-base font-bold tracking-wide text-white">GISEVERAL</p>
            <p className="text-[10px] tracking-[0.2em] text-gold">E SERVICES</p>
          </div>
        </Link>

        <div className="relative z-10 p-10 pb-12">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Junte-se a nós e<br />
            <span className="text-gold">poupe tempo.</span>
          </h2>
          <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-xs">
            Crie a sua conta gratuita e comece a pedir serviços com apenas alguns cliques.
          </p>
          <ul className="mt-6 space-y-2.5">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-white/85">
                <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 bg-background overflow-y-auto">
        {/* Mobile logo */}
        <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-7">
          <img src={logo} alt="Giseveral" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="text-sm font-bold text-brand">GISEVERAL</p>
            <p className="text-[10px] tracking-widest text-gold">E SERVICES</p>
          </div>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-foreground">Criar conta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-semibold text-gold hover:underline">
                Entrar
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={update("fullName")}
                required
                placeholder="João Silva"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-smooth"
              />
            </div>

            {/* Phone + Email side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                  placeholder="84 000 0000"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-smooth"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update("email")}
                  required
                  placeholder="ex@email.com"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-smooth"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update("password")}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 pr-11 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-smooth"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1.5">
                Confirmar palavra-passe
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  required
                  placeholder="Repita a palavra-passe"
                  className={`w-full rounded-lg border bg-background px-3.5 py-2.5 pr-11 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-smooth ${form.confirm && form.confirm !== form.password ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-brand/30 focus:border-brand/50"}`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="mt-1 text-xs text-destructive">As palavras-passe não coincidem</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-elegant disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-gold-foreground/30 border-t-gold-foreground animate-spin" />
                  A criar conta...
                </span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Criar conta grátis
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ao criar conta, aceita os nossos termos de serviço.
          </p>

          <div className="mt-7 pt-5 border-t border-border text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-brand transition-smooth">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

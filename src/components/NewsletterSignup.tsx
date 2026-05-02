import { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  variant?: "footer" | "inline";
}

export function NewsletterSignup({ variant = "footer" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Introduza um email válido.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .insert({ email: trimmed });
      if (error) {
        if (error.code === "23505") {
          setStatus("success");
          return;
        }
        throw error;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Erro ao subscrever. Tente mais tarde.");
    }
  }

  if (status === "success") {
    return (
      <div className={`flex items-center gap-2 text-sm font-medium ${variant === "footer" ? "text-brand-foreground/80" : "text-emerald-600"}`}>
        <CheckCircle2 className="h-4 w-4 text-gold" />
        Subscrito! Obrigado por se juntar à nossa newsletter.
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="rounded-2xl bg-gradient-hero text-brand-foreground p-8 md:p-10 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-gold">Newsletter</span>
        <h3 className="mt-2 text-2xl font-bold">Fique a par das promoções</h3>
        <p className="mt-2 text-brand-foreground/75 text-sm max-w-md mx-auto">
          Receba as melhores ofertas da Giseveral Services directamente no seu email.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="o.seu.email@exemplo.com"
            className="flex-1 rounded-lg border border-brand-foreground/30 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-bold text-gold-foreground disabled:opacity-60"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Subscrever
          </button>
        </form>
        {errorMsg && <p className="mt-2 text-xs text-destructive">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <p className="text-xs text-brand-foreground/60 mb-2">Receba promoções exclusivas por email:</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="o-seu-email@exemplo.com"
          className="flex-1 min-w-0 rounded-md border border-brand-foreground/20 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-gold px-3 py-2 text-xs font-bold text-gold-foreground disabled:opacity-60 shrink-0"
        >
          {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "OK"}
        </button>
      </div>
      {errorMsg && <p className="mt-1 text-xs text-destructive/80">{errorMsg}</p>}
    </form>
  );
}

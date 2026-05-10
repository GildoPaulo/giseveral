import { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  variant?: "footer" | "inline";
}

function welcomeEmailHtml(email: string): string {
  return `
<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <tr><td style="background:linear-gradient(135deg,#1a365d 0%,#2a4a7f 100%);padding:40px 30px;text-align:center">
    <h1 style="color:#d4af37;margin:0;font-size:28px;letter-spacing:2px">GISEVERAL</h1>
    <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:11px;letter-spacing:4px;text-transform:uppercase">E Services</p>
  </td></tr>
  <tr><td style="padding:40px 36px">
    <h2 style="color:#1a365d;margin:0 0 16px;font-size:22px">Bem-vindo à nossa newsletter! 🎉</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 20px">Obrigado por se subscrever. A partir de agora vai receber em primeira mão:</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><span style="color:#d4af37;font-size:16px">🎓</span>&nbsp; <span style="color:#333;font-size:14px">Alertas de bolsas de estudo e prazos</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><span style="color:#d4af37;font-size:16px">🛒</span>&nbsp; <span style="color:#333;font-size:14px">Promoções exclusivas e descontos especiais</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><span style="color:#d4af37;font-size:16px">📰</span>&nbsp; <span style="color:#333;font-size:14px">Novidades e oportunidades para estudantes</span></td></tr>
      <tr><td style="padding:10px 0"><span style="color:#d4af37;font-size:16px">📚</span>&nbsp; <span style="color:#333;font-size:14px">Artigos e recursos académicos gratuitos</span></td></tr>
    </table>
    <div style="text-align:center;margin:32px 0">
      <a href="https://giseveral.com/hub" style="display:inline-block;background:linear-gradient(135deg,#1a365d,#2a4a7f);color:#d4af37;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:bold;font-size:14px">Explorar o Hub Académico →</a>
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
    <p style="color:#999;font-size:11px;line-height:1.6;margin:0">
      Recebeu este email porque ${email} se subscreveu em giseveral.com.<br>
      Para cancelar a subscrição, <a href="https://giseveral.com/newsletter-unsubscribe?email=${encodeURIComponent(email)}" style="color:#1a365d">clique aqui</a>.
    </p>
  </td></tr>
  <tr><td style="background:#f9f9f9;padding:16px 36px;text-align:center">
    <p style="color:#bbb;font-size:11px;margin:0">© ${new Date().getFullYear()} Giseveral e Services · Beira, Moçambique</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`.trim();
}

async function sendWelcomeEmail(email: string) {
  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Bem-vindo à newsletter da Giseveral! 🎉",
        html: welcomeEmailHtml(email),
      }),
    });
  } catch {
    // Welcome email failure is non-critical — subscription is already saved
  }
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
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmed });
      if (error) {
        if (error.code === "23505") {
          // Already subscribed — silently succeed, no welcome email
          setStatus("success");
          return;
        }
        throw error;
      }
      setStatus("success");
      setEmail("");
      // Send welcome email (fire-and-forget, non-blocking)
      sendWelcomeEmail(trimmed);
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

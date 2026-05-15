import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Coins, ChevronLeft, ChevronRight, CheckCircle2, Copy, UploadCloud,
  Loader2, LogIn, Infinity, ShieldCheck, Clock, ArrowRight, Smartphone, X,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserCredits } from "@/lib/hub";
import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKAGES, type CreditPackage } from "@/config/creditPackages";
import { PAYMENT_METHOD_LIST, PAYMENT_NUMBERS, type PaymentMethod } from "@/config/paymentNumbers";
import { formatMZN } from "@/lib/format";

export const Route = createFileRoute("/hub/creditos")({
  head: () => ({
    meta: [
      { title: "Créditos — Giseveral Hub" },
      { name: "description", content: "Compra créditos para descarregar documentos no Giseveral Hub via M-Pesa, Mkesh ou E-Mola." },
    ],
  }),
  component: HubCreditosPage,
});

type Step = 1 | 2 | 3 | 4;

function HubCreditosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [premium, setPremium] = useState(false);

  const [step, setStep] = useState<Step>(1);
  const [pkg, setPkg] = useState<CreditPackage | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [reference] = useState(() => {
    const uid = (user?.id ?? crypto.randomUUID()).replace(/-/g, "").slice(0, 6).toUpperCase();
    return `GIS-${uid}-${Date.now().toString(36).toUpperCase()}`;
  });

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setCredits(null); setPremium(false); return; }
    fetchUserCredits(user.id).then(({ hub_credits, hub_premium }) => {
      setCredits(hub_credits);
      setPremium(hub_premium);
    });
  }, [user]);

  useEffect(() => {
    if (!proofFile) { setProofPreview(null); return; }
    if (!proofFile.type.startsWith("image/")) { setProofPreview(null); return; }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const methodInfo = method ? PAYMENT_NUMBERS[method] : null;

  function selectPackage(p: CreditPackage) {
    setPkg(p);
    setStep(2);
  }

  function selectMethod(m: PaymentMethod) {
    setMethod(m);
    setStep(3);
  }

  function copy(text: string, label: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
    }
  }

  function handleFile(file: File) {
    const max = 5 * 1024 * 1024;
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType) { toast.error("Aceita apenas JPG, PNG ou PDF."); return; }
    if (file.size > max) { toast.error("Ficheiro demasiado grande. Máximo 5 MB."); return; }
    setProofFile(file);
  }

  async function submitProof() {
    if (!user) { toast.error("Inicia sessão primeiro."); return; }
    if (!pkg || !method || !proofFile) return;
    setSubmitting(true);

    try {
      const ext = proofFile.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${user.id}/${reference}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile, { upsert: false });
      if (upErr) throw new Error(upErr.message);

      const { error: insErr } = await (supabase as unknown as {
        from: (t: string) => {
          insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
        };
      })
        .from("credit_purchases")
        .insert({
          user_id: user.id,
          credits_amount: pkg.credits,
          price_mzn: pkg.price,
          payment_method: method,
          reference_code: reference,
          proof_url: path,
        });
      if (insErr) throw new Error(insErr.message);

      toast.success("Comprovativo enviado!", {
        description: "Os teus créditos serão activados em até 2 horas úteis.",
      });
      setStep(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setPkg(null);
    setMethod(null);
    setProofFile(null);
    setProofPreview(null);
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/hub" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-smooth mb-6">
          <ChevronLeft className="h-4 w-4" /> Giseveral Hub
        </Link>

        {/* Header + balance */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Coins className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-brand">Comprar créditos</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Paga via M-Pesa, Mkesh ou E-Mola. Os créditos são activados em até 2 horas úteis após validação do comprovativo.
          </p>
        </div>

        {user && credits !== null && (
          <div className="rounded-2xl bg-gradient-hero text-brand-foreground p-4 flex items-center gap-3 mb-8">
            {premium ? <Infinity className="h-7 w-7 text-gold flex-shrink-0" /> : <Coins className="h-7 w-7 text-gold flex-shrink-0" />}
            <div>
              <p className="text-xs opacity-75">Saldo actual</p>
              <p className="text-lg font-bold">
                {premium ? "Premium — ilimitado" : `${credits} crédito${credits !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        )}

        {!user ? (
          <div className="rounded-2xl bg-card border border-border p-8 text-center">
            <p className="text-muted-foreground mb-4">Inicia sessão para comprar créditos.</p>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth">
              <LogIn className="h-4 w-4" /> Entrar / Criar conta
            </Link>
          </div>
        ) : premium ? (
          <div className="rounded-2xl bg-card border border-border p-8 text-center">
            <Infinity className="mx-auto mb-3 h-10 w-10 text-gold" />
            <p className="font-bold text-foreground">Já és Premium — downloads ilimitados.</p>
            <p className="mt-1 text-sm text-muted-foreground">Não precisas comprar créditos.</p>
            <Link to="/hub" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-gold transition-smooth">
              Voltar ao Hub <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {([1, 2, 3, 4] as Step[]).map((n) => (
                <div key={n} className="flex items-center">
                  <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors ${
                    step >= n
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
                  </div>
                  {n < 4 && <div className={`h-0.5 w-8 ${step > n ? "bg-brand" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ── STEP 1 — pick package ───────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-lg font-bold text-foreground mb-1 text-center">1. Escolhe o pacote</h2>
                  <p className="text-xs text-muted-foreground text-center mb-5">Cada crédito vale 1 download.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CREDIT_PACKAGES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPackage(p)}
                        className={`group relative rounded-2xl border bg-card p-5 text-left transition-smooth hover:-translate-y-1 hover:shadow-elegant ${
                          p.popular
                            ? "border-brand ring-2 ring-brand/30"
                            : "border-border hover:border-brand/40"
                        }`}
                      >
                        {p.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase text-gold-foreground">
                            Mais popular
                          </span>
                        )}
                        <Coins className="h-6 w-6 text-gold mb-2" />
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{p.label}</p>
                        <p className="mt-1 text-3xl font-extrabold text-foreground tabular-nums">{p.credits}</p>
                        <p className="text-xs text-muted-foreground">créditos</p>
                        <p className="mt-3 text-base font-bold text-brand">{formatMZN(p.price)}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.pitch}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2 — pick payment method ────────────────────────────── */}
              {step === 2 && pkg && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand">
                      <ChevronLeft className="h-4 w-4" /> Mudar pacote
                    </button>
                    <span className="text-xs font-bold text-foreground">
                      {pkg.credits} créditos · {formatMZN(pkg.price)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-foreground mb-1 text-center">2. Como vais pagar?</h2>
                  <p className="text-xs text-muted-foreground text-center mb-5">Escolhe o método de pagamento móvel.</p>

                  <div className="space-y-2.5">
                    {PAYMENT_METHOD_LIST.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectMethod(m.id)}
                        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 hover:border-brand/40 hover:shadow-card transition-smooth text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{m.label}</p>
                            <p className="text-xs text-muted-foreground">{m.number}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3 — instructions + upload proof ────────────────────── */}
              {step === 3 && pkg && methodInfo && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand">
                      <ChevronLeft className="h-4 w-4" /> Mudar método
                    </button>
                    <span className="text-xs font-bold text-foreground">{methodInfo.label}</span>
                  </div>

                  <h2 className="text-lg font-bold text-foreground mb-1 text-center">3. Transfere e anexa o comprovativo</h2>
                  <p className="text-xs text-muted-foreground text-center mb-5">{methodInfo.instructions}</p>

                  {/* Payment card */}
                  <div className="rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-brand/5 to-card p-5 mb-5">
                    <Row label="Valor a transferir" value={formatMZN(pkg.price)} onCopy={() => copy(pkg.price.toString(), "Valor")} bold />
                    <Row label="Número" value={methodInfo.number} onCopy={() => copy(methodInfo.number, "Número")} bold />
                    <Row label="Nome do destinatário" value={methodInfo.name} />
                    <Row label="Referência única" value={reference} onCopy={() => copy(reference, "Referência")} mono />
                  </div>

                  {/* Upload */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                    className="rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-brand/40 transition-smooth p-6 text-center cursor-pointer"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                    {proofFile ? (
                      <div>
                        {proofPreview ? (
                          <img src={proofPreview} alt="Comprovativo" className="mx-auto h-32 w-auto rounded-xl object-cover border border-border" />
                        ) : (
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                        <p className="mt-3 text-sm font-semibold text-foreground truncate">{proofFile.name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setProofFile(null); }}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" /> Trocar ficheiro
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">Já transferi — enviar comprovativo</p>
                        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou PDF até 5 MB</p>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={submitProof}
                    disabled={!proofFile || submitting}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {submitting ? "A enviar…" : "Já transferi — submeter comprovativo"}
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4 — success ────────────────────────────────────────── */}
              {step === 4 && pkg && methodInfo && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-8 text-center"
                >
                  <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Comprovativo enviado!</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    Os teus <strong>{pkg.credits} créditos</strong> serão activados em até <strong>2 horas úteis</strong> após validação.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Referência: <span className="font-mono font-bold">{reference}</span>
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onClick={reset} className="rounded-xl bg-card border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-smooth">
                      Comprar mais
                    </button>
                    <Link to="/hub" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth">
                      Voltar ao Hub <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Trust signals */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: "Pagamento seguro" },
            { icon: Clock,       label: "Activação em 2 h" },
            { icon: Coins,       label: "Sem subscrições" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border p-3 text-center">
              <Icon className="h-4 w-4 text-brand" />
              <p className="text-[11px] font-semibold text-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent purchases */}
        {user && <RecentPurchases userId={user.id} />}
      </div>
    </Layout>
  );
}

function Row({
  label, value, onCopy, mono, bold,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`truncate ${mono ? "font-mono" : ""} ${bold ? "text-base font-extrabold text-foreground" : "text-sm font-semibold text-foreground"}`}>
          {value}
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-background hover:bg-muted transition-smooth flex-shrink-0"
            aria-label={`Copiar ${label}`}
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

type Purchase = {
  id: string;
  credits_amount: number;
  price_mzn: number;
  payment_method: string;
  reference_code: string;
  status: string;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  approved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-rose-500/15 text-rose-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

function RecentPurchases({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: Purchase[] | null }>;
            };
          };
        };
      };
    })
      .from("credit_purchases")
      .select("id, credits_amount, price_mzn, payment_method, reference_code, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => { setRows(data ?? []); setLoading(false); });
  }, [userId]);

  if (loading || rows.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Os teus pedidos</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="font-bold text-foreground">{r.credits_amount} créditos · {formatMZN(r.price_mzn)}</p>
              <p className="text-muted-foreground truncate">{r.payment_method.toUpperCase()} · {r.reference_code}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 font-bold ${STATUS_COLOR[r.status] ?? "bg-muted text-muted-foreground"}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, Sparkles, Wand2, UserCheck, MessageCircle,
  Loader2, Check, X, Send, Smartphone, Copy, UploadCloud, Printer, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PAYMENT_METHOD_LIST, PAYMENT_NUMBERS, type PaymentMethod } from "@/config/paymentNumbers";
import { formatMZN } from "@/lib/format";

type SourceType = "cv" | "letter" | "ats" | "scholarship" | "news" | "blog" | "chat" | "document" | "other";

export type FeedbackAction =
  | { kind: "ai_improve" }
  | { kind: "ai_regenerate" }
  | { kind: "human_review"; reason?: string }
  | { kind: "contact"; reason?: string };

interface Props {
  source: SourceType;
  sourceRef?: string;
  sourceTitle?: string;
  output: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
  compact?: boolean;
  /** When true, shows a Print/Imprimir button alongside the feedback. */
  enablePrint?: boolean;
  onAction?: (action: FeedbackAction) => void | Promise<void>;
}

type PricingRow = {
  id: string;
  source_type: string;
  tier: string;
  label: string;
  description: string | null;
  price_mzn: number;
  turnaround_hours: number;
};

type Step = "options" | "tier" | "details" | "payment" | "success";

export function FeedbackWidget({
  source, sourceRef, sourceTitle, output, prompt, metadata,
  compact = false, enablePrint = false, onAction,
}: Props) {
  const { user } = useAuth();
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("options");
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [selectedTier, setSelectedTier] = useState<PricingRow | null>(null);
  const [reason, setReason] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reference] = useState(() => {
    const uid = (user?.id ?? crypto.randomUUID()).replace(/-/g, "").slice(0, 6).toUpperCase();
    return `REV-${uid}-${Date.now().toString(36).toUpperCase()}`;
  });
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  // Load pricing for this source.
  useEffect(() => {
    if (!open || pricing.length > 0) return;
    (async () => {
      // map source aliases that don't exist in pricing table
      const tableSource = source === "ats" || source === "chat" ? "other" : source;
      const { data } = await (supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            eq: (k: string, v: unknown) => {
              eq: (k: string, v: unknown) => {
                order: (col: string, opts: { ascending: boolean }) => Promise<{ data: PricingRow[] | null }>;
              };
            };
          };
        };
      })
        .from("revision_pricing")
        .select("*")
        .eq("source_type", tableSource)
        .eq("active", true)
        .order("sort_order", { ascending: true });
      // Filter out "free" since human review is paid.
      setPricing((data ?? []).filter((r) => r.tier !== "free"));
    })();
  }, [open, source, pricing.length]);

  useEffect(() => {
    if (!proofFile) { setProofPreview(null); return; }
    if (!proofFile.type.startsWith("image/")) { setProofPreview(null); return; }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  async function logFeedback(rating: "up" | "down") {
    try {
      await (supabase as unknown as {
        from: (t: string) => {
          insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
        };
      }).from("ai_feedback").insert({
        user_id: user?.id ?? null,
        source_type: source,
        source_ref: sourceRef ?? null,
        rating,
        prompt_sample: prompt?.slice(0, 2000) ?? null,
        output_sample: output?.slice(0, 4000) ?? null,
      });
    } catch { /* best-effort */ }
  }

  async function handleUp() {
    setVoted("up");
    await logFeedback("up");
    toast.success("Obrigado pelo feedback!");
  }

  function handleDown() {
    setVoted("down");
    setOpen(true);
    setStep("options");
    logFeedback("down");
  }

  async function doAiAction(kind: "ai_improve" | "ai_regenerate") {
    if (!onAction) return;
    setBusy(kind);
    try { await Promise.resolve(onAction({ kind })); }
    finally { setBusy(null); setOpen(false); }
  }

  async function createRequest(): Promise<string | null> {
    if (!user) { toast.error("Inicia sessão para pedir revisão humana"); return null; }
    if (!selectedTier) return null;

    setBusy("create_request");
    try {
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          insert: (payload: unknown) => {
            select: (cols: string) => {
              single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
            };
          };
        };
      })
        .from("revision_requests")
        .insert({
          user_id: user.id,
          source_type: source === "ats" || source === "chat" ? "other" : source,
          source_ref: sourceRef ?? null,
          source_title: sourceTitle ?? `${source} — revisão`,
          original_content: output,
          prompt_snapshot: prompt ?? null,
          metadata: metadata ?? {},
          feedback_reason: reason || null,
          contact_phone: contactPhone || null,
          contact_email: user.email ?? null,
          plan_tier: selectedTier.tier,
          price_mzn: selectedTier.price_mzn,
          priority: selectedTier.tier === "premium" ? 10 : 5,
          status: selectedTier.price_mzn > 0 ? "pending_payment" : "pending",
          payment_status: selectedTier.price_mzn > 0 ? "unpaid" : "waived",
          payment_reference: reference,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data?.id ?? null;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar pedido");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function submitDetails() {
    if (!selectedTier) return;
    const id = await createRequest();
    if (!id) return;
    setCreatedRequestId(id);
    if (selectedTier.price_mzn > 0) {
      setStep("payment");
    } else {
      setStep("success");
    }
  }

  function handleProofFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5 MB."); return; }
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType) { toast.error("JPG, PNG ou PDF."); return; }
    setProofFile(file);
  }

  async function submitProof() {
    if (!user || !createdRequestId || !proofFile || !paymentMethod) return;
    setBusy("submit_proof");
    try {
      const ext = proofFile.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${user.id}/revisions/${reference}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile, { upsert: false });
      if (upErr) throw new Error(upErr.message);

      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          update: (payload: unknown) => {
            eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
          };
        };
      })
        .from("revision_requests")
        .update({
          payment_method: paymentMethod,
          payment_proof_url: path,
          payment_status: "pending",
        })
        .eq("id", createdRequestId);
      if (error) throw new Error(error.message);

      setStep("success");
      onAction?.({ kind: "human_review", reason });
      toast.success("Comprovativo enviado! Vamos validar e começar a revisão.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar comprovativo");
    } finally {
      setBusy(null);
    }
  }

  function copy(text: string, label: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
    }
  }

  function printOutput() {
    const escaped = (output ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${sourceTitle ?? "Documento"}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff}.page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}p{margin:0 0 0.5em}@page{margin:2cm}@media print{body{-webkit-print-color-adjust:exact}}</style>
</head><body><div class="page"><p>${escaped}</p></div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permite popups para imprimir"); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  const methodInfo = paymentMethod ? PAYMENT_NUMBERS[paymentMethod] : null;

  return (
    <div className="inline-flex flex-col gap-2">
      {/* Thumbs + print row */}
      <div className={`inline-flex items-center gap-1.5 ${compact ? "" : "rounded-xl border border-border bg-card px-2 py-1.5"}`}>
        {!compact && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Feedback</span>
        )}
        <button
          type="button"
          onClick={handleUp}
          disabled={voted === "up"}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
            voted === "up" ? "bg-emerald-500/15 text-emerald-600" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-label="Gostei"
          title="Gostei"
        >
          {voted === "up" ? <Check className="h-3.5 w-3.5" /> : <ThumbsUp className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleDown}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
            voted === "down" ? "bg-rose-500/15 text-rose-600" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-label="Não era isso"
          title="Não era isso que eu queria"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
        {enablePrint && (
          <button
            type="button"
            onClick={printOutput}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Imprimir"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed left-1/2 top-1/2 z-[81] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 shrink-0">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {step === "options"  && "Não ficou como esperavas?"}
                    {step === "tier"     && "Escolhe o plano de revisão"}
                    {step === "details"  && "Detalhes do pedido"}
                    {step === "payment"  && "Pagamento da revisão"}
                    {step === "success"  && "Pedido enviado!"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {step === "options"  && "Escolhe como queres melhorar."}
                    {step === "tier"     && "Define o nível e o preço."}
                    {step === "details"  && "Conta-nos o que correu mal."}
                    {step === "payment"  && `Referência: ${reference}`}
                    {step === "success"  && "Vamos contactar-te em breve."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* STEP 1: options */}
                {step === "options" && (
                  <div className="p-3 space-y-2">
                    {onAction && (
                      <>
                        <Option
                          icon={Wand2}
                          title="Corrigir com IA"
                          desc="A IA reescreve mantendo o contexto."
                          onClick={() => doAiAction("ai_improve")}
                          busy={busy === "ai_improve"}
                        />
                        <Option
                          icon={Sparkles}
                          title="Regenerar do zero"
                          desc="Nova tentativa com a IA."
                          onClick={() => doAiAction("ai_regenerate")}
                          busy={busy === "ai_regenerate"}
                        />
                      </>
                    )}
                    <Option
                      icon={UserCheck}
                      title="Pedir revisão humana"
                      desc="Um especialista Giseveral melhora o teu documento."
                      onClick={() => setStep("tier")}
                      highlight
                    />
                    <a
                      href="https://wa.me/258874383621?text=Olá,%20preciso%20de%20ajuda"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 w-full rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors px-3 py-2.5 text-left"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Falar no WhatsApp</p>
                        <p className="text-xs text-muted-foreground">Conversa directa com a equipa.</p>
                      </div>
                    </a>
                  </div>
                )}

                {/* STEP 2: pick tier */}
                {step === "tier" && (
                  <div className="p-5 space-y-3">
                    {pricing.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-xs text-muted-foreground">A carregar planos…</p>
                      </div>
                    ) : (
                      pricing.map((p) => {
                        const active = selectedTier?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedTier(p)}
                            className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                              active
                                ? "border-foreground bg-foreground/5"
                                : "border-border bg-card hover:border-brand/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground">{p.label}</p>
                                {p.description && (
                                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-lg font-extrabold tabular-nums text-foreground">
                                  {p.price_mzn === 0 ? "Grátis" : formatMZN(p.price_mzn)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">~ {p.turnaround_hours}h</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* STEP 3: details */}
                {step === "details" && selectedTier && (
                  <div className="p-5 space-y-4">
                    <div className="rounded-xl bg-foreground/5 border border-border p-3">
                      <p className="text-xs text-muted-foreground">Plano escolhido</p>
                      <p className="text-sm font-bold text-foreground">{selectedTier.label} · {formatMZN(selectedTier.price_mzn)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        O que correu mal? (opcional)
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Ex: o tom está demasiado informal, falta mencionar X…"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+258 …"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: payment */}
                {step === "payment" && selectedTier && (
                  <div className="p-5 space-y-4">
                    {!paymentMethod ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">Escolhe o método de pagamento</p>
                        <p className="text-xs text-muted-foreground -mt-2">
                          Valor a pagar: <span className="font-bold text-foreground">{formatMZN(selectedTier.price_mzn)}</span>
                        </p>
                        <div className="space-y-2">
                          {PAYMENT_METHOD_LIST.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPaymentMethod(m.id)}
                              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 hover:border-brand/40 hover:shadow-card transition-smooth text-left"
                            >
                              <div className="flex items-center gap-2">
                                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
                                  <Smartphone className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-foreground">{m.label}</p>
                                  <p className="text-[11px] text-muted-foreground">{m.number}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : methodInfo ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(null)}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          ← Mudar método
                        </button>
                        <div className="rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-brand/5 to-card p-4">
                          <PayRow label="Valor a transferir" value={formatMZN(selectedTier.price_mzn)} bold onCopy={() => copy(String(selectedTier.price_mzn), "Valor")} />
                          <PayRow label="Número" value={methodInfo.number} bold onCopy={() => copy(methodInfo.number, "Número")} />
                          <PayRow label="Nome destinatário" value={methodInfo.name} />
                          <PayRow label="Referência" value={reference} mono onCopy={() => copy(reference, "Referência")} />
                        </div>

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-brand/40 transition-smooth p-5 text-center cursor-pointer"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProofFile(f); }}
                          />
                          {proofFile ? (
                            <div>
                              {proofPreview ? (
                                <img src={proofPreview} alt="" className="mx-auto h-28 rounded-lg object-cover border border-border" />
                              ) : (
                                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                              <p className="mt-2 text-sm font-semibold text-foreground truncate">{proofFile.name}</p>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setProofFile(null); }}
                                className="mt-1 text-[10px] text-muted-foreground hover:text-destructive"
                              >
                                Trocar
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
                                <UploadCloud className="h-4 w-4" />
                              </div>
                              <p className="mt-2 text-sm font-semibold text-foreground">Já transferi — enviar comprovativo</p>
                              <p className="text-[10px] text-muted-foreground">JPG, PNG ou PDF até 5 MB</p>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={submitProof}
                          disabled={!proofFile || busy === "submit_proof"}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-5 py-3 text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                        >
                          {busy === "submit_proof" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Submeter comprovativo
                        </button>
                      </>
                    ) : null}
                  </div>
                )}

                {/* STEP 5: success */}
                {step === "success" && (
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
                      <Check className="h-7 w-7" />
                    </div>
                    <p className="text-base font-bold text-foreground">Pedido enviado</p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                      Um especialista Giseveral vai contactar-te em até <span className="font-bold">{selectedTier?.turnaround_hours ?? 24}h</span>.
                      Referência: <span className="font-mono font-bold">{reference}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-5 rounded-xl bg-foreground text-background px-5 py-2 text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>

              {/* Footer nav */}
              {(step === "tier" || step === "details") && (
                <div className="border-t border-border bg-background p-3 flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(step === "details" ? "tier" : "options")}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (step === "tier") {
                        if (!selectedTier) { toast.error("Escolhe um plano"); return; }
                        setStep("details");
                      } else if (step === "details") {
                        submitDetails();
                      }
                    }}
                    disabled={busy === "create_request"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-5 py-2 text-xs font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {busy === "create_request" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {step === "tier" ? "Continuar" : "Enviar pedido"}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Option({
  icon: Icon, title, desc, onClick, busy, highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
  busy?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex items-start gap-3 w-full rounded-xl border transition-colors px-3 py-2.5 text-left disabled:opacity-50 ${
        highlight ? "border-brand/40 bg-brand/5 hover:bg-brand/10" : "border-border bg-background hover:bg-muted/60"
      }`}
    >
      <div className={`grid h-9 w-9 place-items-center rounded-full ${highlight ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function PayRow({
  label, value, onCopy, mono, bold,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`truncate ${mono ? "font-mono" : ""} ${bold ? "text-sm font-extrabold text-foreground" : "text-sm font-semibold text-foreground"}`}>
          {value}
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="grid h-6 w-6 place-items-center rounded-md border border-border bg-card hover:bg-muted transition-smooth shrink-0"
            aria-label={`Copiar ${label}`}
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

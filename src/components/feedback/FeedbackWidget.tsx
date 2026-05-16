import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, Sparkles, Wand2, UserCheck, MessageCircle,
  Loader2, Check, X, Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SourceType = "cv" | "letter" | "ats" | "scholarship" | "news" | "blog" | "chat" | "document" | "other";

export type FeedbackAction =
  | { kind: "ai_improve" }
  | { kind: "ai_regenerate" }
  | { kind: "human_review"; reason?: string }
  | { kind: "contact"; reason?: string };

interface Props {
  /** Where the feedback came from — used for filtering/analytics. */
  source: SourceType;
  /** Optional reference (e.g. document id, template id). */
  sourceRef?: string;
  /** Human label shown to admin reviewers. */
  sourceTitle?: string;
  /** The AI output the user is rating. Required for human-review requests. */
  output: string;
  /** Optional prompt that produced the output (helps reviewers + learning). */
  prompt?: string;
  /** Extra metadata to persist with the revision (tone, template, etc.). */
  metadata?: Record<string, unknown>;
  /** Compact mode renders just the icons. */
  compact?: boolean;
  /**
   * Called when the user picks an in-app AI action (improve/regenerate).
   * Returning a promise keeps the spinner alive until done.
   */
  onAction?: (action: FeedbackAction) => void | Promise<void>;
}

const PRICING_TIERS = [
  { id: "free",         label: "IA Free",              price: "Grátis",   highlight: false },
  { id: "professional", label: "Revisão Profissional", price: "350 MZN",  highlight: true },
  { id: "premium",      label: "Premium CV/Carta",     price: "750 MZN",  highlight: false },
] as const;

export function FeedbackWidget({
  source, sourceRef, sourceTitle, output, prompt, metadata,
  compact = false, onAction,
}: Props) {
  const { user } = useAuth();
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [tier, setTier] = useState<"free" | "professional" | "premium">("professional");

  async function logFeedback(rating: "up" | "down", commentText?: string) {
    try {
      await (supabase as unknown as {
        from: (t: string) => {
          insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
        };
      })
        .from("ai_feedback")
        .insert({
          user_id: user?.id ?? null,
          source_type: source,
          source_ref: sourceRef ?? null,
          rating,
          comment: commentText ?? null,
          prompt_sample: prompt?.slice(0, 2000) ?? null,
          output_sample: output?.slice(0, 4000) ?? null,
        });
    } catch { /* swallow — feedback is best-effort */ }
  }

  async function handleUp() {
    setVoted("up");
    await logFeedback("up");
    toast.success("Obrigado pelo feedback!");
  }

  function handleDown() {
    setVoted("down");
    setOpen(true);
    logFeedback("down");
  }

  async function doAiAction(kind: "ai_improve" | "ai_regenerate") {
    if (!onAction) return;
    setBusy(kind);
    try {
      await Promise.resolve(onAction({ kind }));
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  async function submitHumanReview(plan: "professional" | "premium") {
    if (!user) {
      toast.error("Inicia sessão para pedir revisão humana");
      return;
    }
    setBusy("human_review");
    try {
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
        };
      })
        .from("revision_requests")
        .insert({
          user_id: user.id,
          source_type: source === "ats" || source === "chat" ? "other" : source,
          source_ref: sourceRef ?? null,
          source_title: sourceTitle ?? `${source} — revisão pedida`,
          original_content: output,
          prompt_snapshot: prompt ?? null,
          metadata: metadata ?? {},
          feedback_reason: reason || null,
          contact_phone: contactPhone || null,
          contact_email: user.email ?? null,
          plan_tier: plan,
          priority: plan === "premium" ? 10 : 5,
        });
      if (error) throw new Error(error.message);
      toast.success("Pedido enviado", {
        description: "Um especialista Giseveral vai contactar-te em breve.",
      });
      onAction?.({ kind: "human_review", reason });
      setOpen(false);
      setReasonOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar pedido");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      {/* Thumbs row */}
      <div className={`inline-flex items-center gap-1.5 ${compact ? "" : "rounded-xl border border-border bg-card px-2 py-1.5"}`}>
        {!compact && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Feedback
          </span>
        )}
        <button
          type="button"
          onClick={handleUp}
          disabled={voted === "up"}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
            voted === "up"
              ? "bg-emerald-500/15 text-emerald-600"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
            voted === "down"
              ? "bg-rose-500/15 text-rose-600"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-label="Não era isso"
          title="Não era isso que eu queria"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Improvement options modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed left-1/2 top-1/2 z-[81] w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card shadow-2xl border border-border overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">Não ficou como esperavas?</p>
                  <p className="text-[11px] text-muted-foreground">Escolhe como queres melhorar.</p>
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

              {!reasonOpen ? (
                <div className="p-3 space-y-2">
                  {onAction && (
                    <>
                      <Option
                        icon={Wand2}
                        title="Corrigir com IA"
                        desc="A IA reescreve a versão actual mantendo o contexto."
                        onClick={() => doAiAction("ai_improve")}
                        busy={busy === "ai_improve"}
                      />
                      <Option
                        icon={Sparkles}
                        title="Regenerar do zero"
                        desc="Nova tentativa com a IA — pode dar resultado bem diferente."
                        onClick={() => doAiAction("ai_regenerate")}
                        busy={busy === "ai_regenerate"}
                      />
                    </>
                  )}
                  <Option
                    icon={UserCheck}
                    title="Pedir revisão humana"
                    desc="Um especialista Giseveral revê e melhora — resposta em 24h úteis."
                    onClick={() => setReasonOpen(true)}
                    highlight
                  />
                  <a
                    href="https://wa.me/258874383621?text=Olá,%20preciso%20de%20ajuda%20com%20a%20minha%20carta%2Fcv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 w-full rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors px-3 py-2.5 text-left"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">Falar no WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Conversa directa com a equipa Giseveral.</p>
                    </div>
                  </a>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      O que correu mal? (opcional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Ex: O tom está demasiado informal, falta mencionar X, …"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Telefone / WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+258 …"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Plano</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRICING_TIERS.filter((t) => t.id !== "free").map((t) => {
                        const active = tier === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTier(t.id as "professional" | "premium")}
                            className={`rounded-xl border p-2.5 text-left transition-colors ${
                              active
                                ? "bg-foreground text-background border-foreground"
                                : "bg-card border-border text-foreground hover:border-brand/40"
                            }`}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t.label}</p>
                            <p className="text-sm font-extrabold mt-0.5">{t.price}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Pagas após receber a revisão. Aceitamos M-Pesa, e-Mola, Mkesh.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReasonOpen(false)}
                      className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => submitHumanReview(tier === "premium" ? "premium" : "professional")}
                      disabled={busy === "human_review"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-5 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {busy === "human_review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Enviar pedido
                    </button>
                  </div>
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
        highlight
          ? "border-brand/40 bg-brand/5 hover:bg-brand/10"
          : "border-border bg-background hover:bg-muted/60"
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

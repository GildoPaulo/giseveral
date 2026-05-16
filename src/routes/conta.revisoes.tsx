import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, Clock, CheckCircle2, X, AlertCircle, Loader2, ChevronRight,
  Download, Printer, FileText, Copy, Check, MessageCircle, LogIn,
  CreditCard, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatMZN } from "@/lib/format";

export const Route = createFileRoute("/conta/revisoes")({
  head: () => ({
    meta: [
      { title: "As minhas revisões — Giseveral Hub" },
      { name: "description", content: "Acompanha o estado das tuas revisões humanas Giseveral." },
    ],
  }),
  component: ContaRevisoes,
});

type Revision = {
  id: string;
  source_type: string;
  source_title: string | null;
  original_content: string;
  revised_content: string | null;
  reviewer_notes: string | null;
  status: string;
  plan_tier: string;
  price_mzn: number;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  feedback_reason: string | null;
  created_at: string;
  completed_at: string | null;
};

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending_payment: { label: "Aguarda pagamento", cls: "bg-amber-500/15 text-amber-700",  icon: CreditCard },
  pending:         { label: "Em fila",           cls: "bg-amber-500/15 text-amber-700",  icon: Clock },
  in_review:       { label: "Em revisão",        cls: "bg-blue-500/15 text-blue-700",    icon: Loader2 },
  completed:       { label: "Concluída",         cls: "bg-emerald-500/15 text-emerald-700", icon: CheckCircle2 },
  cancelled:       { label: "Cancelada",         cls: "bg-rose-500/15 text-rose-700",    icon: X },
};

const PAYMENT_META: Record<string, { label: string; cls: string }> = {
  unpaid:   { label: "Por pagar",     cls: "bg-rose-500/15 text-rose-700" },
  pending:  { label: "Por validar",   cls: "bg-amber-500/15 text-amber-700" },
  approved: { label: "Pago",          cls: "bg-emerald-500/15 text-emerald-700" },
  rejected: { label: "Rejeitado",     cls: "bg-rose-500/15 text-rose-700" },
  waived:   { label: "Grátis",        cls: "bg-muted text-muted-foreground" },
};

const SOURCE_LABELS: Record<string, string> = {
  cv: "Curriculum", letter: "Carta", scholarship: "Bolsa", news: "Notícia",
  blog: "Blog", document: "Documento", other: "Outro",
};

function ContaRevisoes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Revision | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Revision[] | null }>;
          };
        };
      };
    })
      .from("revision_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    open:      rows.filter((r) => r.status === "pending" || r.status === "in_review" || r.status === "pending_payment").length,
    completed: rows.filter((r) => r.status === "completed").length,
    total:     rows.length,
  }), [rows]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-md text-center">
          <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h1 className="text-xl font-bold text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">Inicia sessão para ver os teus pedidos de revisão.</p>
          <Link to="/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth">
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground inline-flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-brand" /> As minhas revisões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos de revisão humana Giseveral — pendentes, em revisão e concluídas.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Em curso"    value={counts.open}      cls="text-amber-600" />
          <Stat label="Concluídas"  value={counts.completed} cls="text-emerald-600" />
          <Stat label="Total"       value={counts.total}     cls="text-foreground" />
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Ainda não tens pedidos de revisão.</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Quando gerares uma carta ou CV com IA, podes clicar em 👎 e pedir revisão humana — os pedidos vão aparecer aqui.
            </p>
            <Link
              to="/hub/cv"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Ir para o CV Builder <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const status = STATUS_META[r.status] ?? STATUS_META.pending;
              const payment = PAYMENT_META[r.payment_status] ?? PAYMENT_META.unpaid;
              const sourceLabel = SOURCE_LABELS[r.source_type] ?? r.source_type;
              const Icon = status.icon;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full text-left rounded-2xl border bg-card p-5 hover:shadow-card transition-shadow ${
                    r.status === "completed" ? "border-emerald-200" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl ${
                        r.status === "completed" ? "bg-emerald-500/15 text-emerald-700"
                        : r.status === "in_review" ? "bg-blue-500/15 text-blue-700"
                        : "bg-muted text-foreground"
                      }`}>
                        <Icon className={`h-5 w-5 ${r.status === "in_review" ? "animate-spin" : ""}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {r.source_title ?? `${sourceLabel} — revisão`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {sourceLabel} · {new Date(r.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                        {r.payment_reference && (
                          <p className="mt-1 text-[10px] text-muted-foreground/80 font-mono">{r.payment_reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {r.price_mzn > 0 && (
                          <span className="text-xs font-bold text-foreground tabular-nums">{formatMZN(r.price_mzn)}</span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
                      </div>
                      {r.price_mzn > 0 && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${payment.cls}`}>
                          {payment.label}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {active && (
          <DetailDrawer rev={active} onClose={() => setActive(null)} onUpdated={load} />
        )}
      </AnimatePresence>
    </Layout>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-extrabold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}

function DetailDrawer({ rev, onClose, onUpdated }: { rev: Revision; onClose: () => void; onUpdated: () => void }) {
  const [copied, setCopied] = useState<"original" | "revised" | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const status = STATUS_META[rev.status] ?? STATUS_META.pending;
  const payment = PAYMENT_META[rev.payment_status] ?? PAYMENT_META.unpaid;
  const sourceLabel = SOURCE_LABELS[rev.source_type] ?? rev.source_type;
  const hasRevised = rev.status === "completed" && rev.revised_content;
  const showContent = hasRevised ? rev.revised_content! : rev.original_content;
  const title = rev.source_title ?? `${sourceLabel}-revisao`;

  function copyText(text: string, which: "original" | "revised") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  function printContent() {
    const escaped = showContent
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff}.page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}p{margin:0 0 0.5em}@page{margin:2cm}</style>
</head><body><div class="page"><p>${escaped}</p></div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permite popups para imprimir"); return; }
    w.document.write(html); w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  function downloadAs(format: "txt" | "rtf" | "doc" | "html") {
    const safe = title.toLowerCase().replace(/\s+/g, "-");
    let blob: Blob;
    if (format === "txt") {
      blob = new Blob([showContent], { type: "text/plain;charset=utf-8" });
    } else if (format === "rtf") {
      const lines = showContent.split("\n").map((line) => {
        const e = line.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
        return `${e}\\par`;
      }).join("\n");
      const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\n{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}\n\\f0\\fs24\\sl480\\slmult1\n${lines}\n}`;
      blob = new Blob([rtf], { type: "application/rtf" });
    } else {
      const escaped = showContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      if (format === "doc") {
        const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>${title}</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8}@page WordSection1{size:21cm 29.7cm;margin:2.5cm 2.5cm 3cm}div.WordSection1{page:WordSection1}</style></head><body><div class='WordSection1'><p>${escaped}</p></div></body></html>`;
        blob = new Blob([doc], { type: "application/msword" });
      } else {
        const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff}.page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}</style></head><body><div class="page"><p>${escaped}</p></div></body></html>`;
        blob = new Blob([html], { type: "text/html;charset=utf-8" });
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safe}.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Descarregado .${format}`);
  }

  async function cancelRequest() {
    if (!window.confirm("Cancelar este pedido?")) return;
    setCancelling(true);
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (payload: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    }).from("revision_requests").update({ status: "cancelled" }).eq("id", rev.id);
    setCancelling(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido cancelado");
    onUpdated();
    onClose();
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-2xl bg-background shadow-2xl flex flex-col overflow-hidden"
        role="dialog" aria-modal="true"
      >
        <div className="border-b border-border bg-card px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{title}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(rev.created_at).toLocaleString("pt-PT")}
              {rev.completed_at && <> · concluído {new Date(rev.completed_at).toLocaleDateString("pt-PT")}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Pricing/payment block */}
          {rev.price_mzn > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Valor</p>
                <p className="font-bold text-foreground tabular-nums">{formatMZN(rev.price_mzn)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pagamento</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${payment.cls}`}>{payment.label}</span>
              </div>
              {rev.payment_method && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Método</p>
                  <p className="font-bold text-foreground">{rev.payment_method.toUpperCase()}</p>
                </div>
              )}
              {rev.payment_reference && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Referência</p>
                  <p className="font-mono text-foreground">{rev.payment_reference}</p>
                </div>
              )}
            </div>
          )}

          {rev.status === "pending_payment" && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100">Aguarda pagamento</p>
                <p className="text-amber-800 dark:text-amber-200 mt-0.5">
                  O teu pedido só entra na fila depois de confirmarmos o pagamento. Se já transferiste e ainda não validamos, contacta-nos via WhatsApp com a referência.
                </p>
              </div>
            </div>
          )}

          {rev.feedback_reason && (
            <section>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">A tua razão</p>
              <p className="rounded-xl bg-muted/30 border border-border p-3 text-xs italic text-foreground">"{rev.feedback_reason}"</p>
            </section>
          )}

          {hasRevised && (
            <section>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Versão revista pelo especialista
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => copyText(rev.revised_content!, "revised")} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold hover:bg-muted transition-colors">
                    {copied === "revised" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "revised" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
              <pre className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3 text-xs whitespace-pre-wrap font-mono text-foreground max-h-72 overflow-auto">
                {rev.revised_content}
              </pre>
              {rev.reviewer_notes && (
                <p className="mt-2 text-[11px] text-muted-foreground italic">Nota do revisor: {rev.reviewer_notes}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => downloadAs("doc")}
                  className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-2.5 py-1 text-[11px] font-bold hover:opacity-90 transition-opacity">
                  <FileText className="h-3 w-3" /> Word (.doc)
                </button>
                <button type="button" onClick={() => downloadAs("rtf")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold hover:bg-muted transition-colors">
                  <FileText className="h-3 w-3" /> .rtf
                </button>
                <button type="button" onClick={() => downloadAs("html")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold hover:bg-muted transition-colors">
                  <Download className="h-3 w-3" /> .html
                </button>
                <button type="button" onClick={() => downloadAs("txt")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold hover:bg-muted transition-colors">
                  <Download className="h-3 w-3" /> .txt
                </button>
                <button type="button" onClick={printContent}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold hover:bg-muted transition-colors">
                  <Printer className="h-3 w-3" /> Imprimir
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                {hasRevised ? "Versão original (IA)" : "Versão actual"}
              </p>
              <button type="button" onClick={() => copyText(rev.original_content, "original")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold hover:bg-muted transition-colors">
                {copied === "original" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === "original" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono text-foreground max-h-72 overflow-auto">
              {rev.original_content}
            </pre>
          </section>
        </div>

        <div className="border-t border-border bg-background px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
          <a
            href={`https://wa.me/258874383621?text=Olá,%20referência%20do%20meu%20pedido%20${encodeURIComponent(rev.payment_reference ?? rev.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> Falar no WhatsApp
          </a>
          {(rev.status === "pending" || rev.status === "pending_payment") && (
            <button
              type="button"
              onClick={cancelRequest}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 px-3 py-2 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors"
            >
              {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Cancelar pedido
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

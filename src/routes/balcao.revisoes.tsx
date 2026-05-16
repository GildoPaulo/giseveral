import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, Clock, CheckCircle2, X, Phone, Mail, Loader2,
  MessageCircle, AlertCircle, ShieldCheck, ChevronRight, Copy, Check, Printer, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/balcao/revisoes")({
  head: () => ({ meta: [{ title: "Revisões — Balcão Giseveral" }] }),
  component: BalcaoRevisoes,
});

type Revision = {
  id: string;
  user_id: string | null;
  source_type: string;
  source_ref: string | null;
  source_title: string | null;
  original_content: string;
  prompt_snapshot: string | null;
  metadata: Record<string, unknown>;
  feedback_reason: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  status: string;
  plan_tier: string;
  priority: number;
  assigned_to: string | null;
  revised_content: string | null;
  reviewer_notes: string | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
};

type ProfileLite = { id: string; full_name: string | null; email: string | null };

type FilterValue = "pending" | "in_review" | "completed" | "all";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pendente",     cls: "bg-amber-500/15 text-amber-700" },
  in_review:  { label: "Em revisão",   cls: "bg-blue-500/15 text-blue-700" },
  completed:  { label: "Concluída",    cls: "bg-emerald-500/15 text-emerald-700" },
  cancelled:  { label: "Cancelada",    cls: "bg-rose-500/15 text-rose-700" },
};

const TIER_META: Record<string, { label: string; cls: string }> = {
  free:         { label: "Free",         cls: "bg-muted text-muted-foreground" },
  professional: { label: "Pro · 350 MZN",cls: "bg-brand/10 text-brand" },
  premium:      { label: "Premium · 750 MZN", cls: "bg-gold/15 text-gold" },
};

function BalcaoRevisoes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Revision[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [active, setActive] = useState<Revision | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const op = supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Revision[] | null }>;
          };
        };
      };
    };
    const { data } = await op
      .from("revision_requests")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    setRows(data ?? []);

    const ids = Array.from(new Set((data ?? []).map((r) => r.user_id).filter((v): v is string => !!v)));
    if (ids.length > 0) {
      const op2 = supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            in: (k: string, vals: string[]) => Promise<{ data: ProfileLite[] | null }>;
          };
        };
      };
      const { data: profs } = await op2.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      for (const p of profs ?? []) map[p.id] = p;
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const counts = useMemo(() => ({
    pending:   rows.filter((r) => r.status === "pending").length,
    in_review: rows.filter((r) => r.status === "in_review").length,
    completed: rows.filter((r) => r.status === "completed").length,
    all:       rows.length,
  }), [rows]);

  async function takeOver(r: Revision) {
    if (!user) return;
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (payload: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    }).from("revision_requests").update({
      status: "in_review",
      assigned_to: user.id,
      assigned_at: new Date().toISOString(),
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Atribuído a ti");
    refresh();
    setActive({ ...r, status: "in_review", assigned_to: user.id });
  }

  async function complete(r: Revision, revisedContent: string, reviewerNotes: string) {
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (payload: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    }).from("revision_requests").update({
      status: "completed",
      revised_content: revisedContent,
      reviewer_notes: reviewerNotes,
      completed_at: new Date().toISOString(),
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Revisão concluída");
    refresh();
    setActive(null);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground inline-flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-brand" /> Pedidos de Revisão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cartas, CVs e documentos onde o utilizador pediu revisão humana.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-xl bg-card border border-border p-1">
          {(["pending", "in_review", "completed", "all"] as FilterValue[]).map((f) => {
            const labels: Record<FilterValue, string> = { pending: "Pendentes", in_review: "Em revisão", completed: "Concluídas", all: "Todas" };
            const isActive = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive ? "bg-brand text-brand-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {labels[f]}
                <span className={`ml-1.5 text-[10px] ${isActive ? "text-brand-foreground/80" : "text-muted-foreground"}`}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Sem pedidos {filter !== "all" ? `(${filter})` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const prof = r.user_id ? profiles[r.user_id] : undefined;
            const name = prof?.full_name || prof?.email || (r.user_id?.slice(0, 8) ?? "Anónimo");
            const statusMeta = STATUS_META[r.status] ?? STATUS_META.pending;
            const tierMeta = TIER_META[r.plan_tier] ?? TIER_META.free;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(r)}
                className={`w-full text-left rounded-2xl border bg-card p-5 hover:shadow-card transition-shadow ${
                  r.priority >= 10 ? "border-gold/40" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-foreground">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {r.source_title ?? `${r.source_type} — revisão pedida`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {name} · {new Date(r.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      {r.feedback_reason && (
                        <p className="mt-1.5 text-[11px] italic text-muted-foreground line-clamp-2">"{r.feedback_reason}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tierMeta.cls}`}>{tierMeta.label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.cls}`}>{statusMeta.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {active && (
          <DetailDrawer
            rev={active}
            customerName={(active.user_id && profiles[active.user_id]?.full_name) || profiles[active.user_id ?? ""]?.email || "Anónimo"}
            onClose={() => setActive(null)}
            onTakeOver={() => takeOver(active)}
            onComplete={(revised, notes) => complete(active, revised, notes)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailDrawer({
  rev, customerName, onClose, onTakeOver, onComplete,
}: {
  rev: Revision;
  customerName: string;
  onClose: () => void;
  onTakeOver: () => void;
  onComplete: (revised: string, notes: string) => void;
}) {
  const [revised, setRevised] = useState(rev.revised_content ?? rev.original_content);
  const [notes, setNotes] = useState(rev.reviewer_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusMeta = STATUS_META[rev.status] ?? STATUS_META.pending;

  function copyOriginal() {
    navigator.clipboard.writeText(rev.original_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function printContent(text: string, title: string) {
    const escaped = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff}.page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}p{margin:0 0 0.5em}@page{margin:2cm}@media print{body{-webkit-print-color-adjust:exact}}</style>
</head><body><div class="page"><p>${escaped}</p></div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permite popups para imprimir"); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  function downloadRtf(text: string, title: string) {
    const lines = text.split("\n").map((line) => {
      const escaped = line
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
      return `${escaped}\\par`;
    }).join("\n");
    const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}
{\\*\\generator Giseveral Revisões;}
\\f0\\fs24\\sl480\\slmult1
${lines}
}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rtf], { type: "application/rtf" }));
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.rtf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/50"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-3xl bg-background shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b border-border bg-card px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {rev.source_title ?? `${rev.source_type} — revisão`}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {customerName} · pedido em {new Date(rev.created_at).toLocaleString("pt-PT")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.cls}`}>{statusMeta.label}</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Contact + meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {rev.contact_phone && (
              <a href={`tel:${rev.contact_phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-semibold hover:bg-muted transition-colors">
                <Phone className="h-3 w-3" /> {rev.contact_phone}
              </a>
            )}
            {rev.contact_email && (
              <a href={`mailto:${rev.contact_email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-semibold hover:bg-muted transition-colors truncate">
                <Mail className="h-3 w-3" /> {rev.contact_email}
              </a>
            )}
            {rev.contact_phone && (
              <a href={`https://wa.me/${rev.contact_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] text-white px-2.5 py-1.5 font-semibold hover:opacity-90 transition-opacity">
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </div>

          {rev.feedback_reason && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-300/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Razão do utilizador
              </p>
              <p className="text-xs text-foreground italic">"{rev.feedback_reason}"</p>
            </div>
          )}

          {/* Original */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Versão original (IA)</p>
              <button
                type="button"
                onClick={copyOriginal}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-semibold hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono text-foreground max-h-64 overflow-auto">
              {rev.original_content}
            </pre>
          </section>

          {/* Revised editor */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Versão revista (tua)</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => downloadRtf(revised, rev.source_title ?? "carta-revista")}
                  disabled={!revised.trim()}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
                  title="Descarregar Word/RTF"
                >
                  <FileText className="h-3 w-3" /> .rtf
                </button>
                <button
                  type="button"
                  onClick={() => printContent(revised, rev.source_title ?? "carta")}
                  disabled={!revised.trim()}
                  className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-2 py-1 text-[10px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  title="Imprimir / PDF"
                >
                  <Printer className="h-3 w-3" /> Imprimir
                </button>
              </div>
            </div>
            <textarea
              value={revised}
              onChange={(e) => setRevised(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
              placeholder="Reescreve aqui a versão melhorada…"
            />
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Notas para o utilizador</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
              placeholder="Ex: Reforcei o tom executivo, adicionei métricas e simplifiquei o parágrafo 2."
            />
          </section>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border bg-background px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] text-muted-foreground">
            Plano: <span className="font-bold uppercase">{TIER_META[rev.plan_tier]?.label}</span>
          </p>
          <div className="flex items-center gap-2">
            {rev.status === "pending" && (
              <button
                type="button"
                onClick={onTakeOver}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
              >
                <Clock className="h-3.5 w-3.5" /> Assumir
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                setSaving(true);
                try { await onComplete(revised, notes); } finally { setSaving(false); }
              }}
              disabled={saving || rev.status === "completed"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {rev.status === "completed" ? "Concluída" : "Marcar concluída"}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

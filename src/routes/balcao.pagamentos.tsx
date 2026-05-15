import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins, Check, X, Eye, Loader2, FileText, Image as ImageIcon,
  ShieldCheck, AlertCircle, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMZN } from "@/lib/format";

export const Route = createFileRoute("/balcao/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Balcão Giseveral" }] }),
  component: BalcaoPagamentos,
});

type Purchase = {
  id: string;
  user_id: string;
  credits_amount: number;
  price_mzn: number;
  payment_method: string;
  reference_code: string;
  proof_url: string | null;
  status: string;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
};

type ProfileLite = { id: string; full_name: string | null; email: string | null };

type FilterValue = "pending" | "approved" | "rejected" | "all";

function BalcaoPagamentos() {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [activeProof, setActiveProof] = useState<{ url: string; isImage: boolean } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    const op = supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Purchase[] | null }>;
        };
      };
    };
    const { data } = await op.from("credit_purchases").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);

    const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
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

  async function openProof(p: Purchase) {
    if (!p.proof_url) return;
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(p.proof_url, 600);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível abrir o comprovativo");
      return;
    }
    const ext = p.proof_url.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
    setActiveProof({ url: data.signedUrl, isImage });
  }

  async function approve(p: Purchase) {
    setActioning(p.id);
    const { error } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    }).rpc("approve_credit_purchase", { p_purchase_id: p.id, p_notes: notes[p.id] ?? null });
    setActioning(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Créditos adicionados com sucesso");
    refresh();
  }

  async function reject(p: Purchase) {
    if (!notes[p.id]) { toast.error("Adiciona uma nota antes de rejeitar"); return; }
    setActioning(p.id);
    const { error } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    }).rpc("reject_credit_purchase", { p_purchase_id: p.id, p_notes: notes[p.id] });
    setActioning(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido rejeitado");
    refresh();
  }

  const counts = useMemo(() => ({
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    all: rows.length,
  }), [rows]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Pagamentos de créditos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Valida comprovativos e adiciona créditos às contas dos utilizadores.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-card border border-border p-1">
          {(["pending", "approved", "rejected", "all"] as FilterValue[]).map((f) => {
            const active = filter === f;
            const label: Record<FilterValue, string> = { pending: "Pendentes", approved: "Aprovados", rejected: "Rejeitados", all: "Todos" };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth ${
                  active ? "bg-brand text-brand-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {label[f]}
                <span className={`ml-1.5 text-[10px] ${active ? "text-brand-foreground/80" : "text-muted-foreground"}`}>{counts[f]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse">
              <div className="h-4 w-1/3 bg-muted rounded mb-3" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Sem pedidos {filter !== "all" ? `(${filter})` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const prof = profiles[p.user_id];
            const customerName = prof?.full_name || prof?.email || p.user_id.slice(0, 8);
            return (
              <div key={p.id} className={`rounded-2xl border bg-card p-5 ${p.status === "pending" ? "border-amber-300 shadow-card" : "border-border"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${
                      p.status === "pending" ? "bg-amber-100 text-amber-700"
                      : p.status === "approved" ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                    }`}>
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{customerName}</p>
                      {prof?.email && prof.full_name && (
                        <p className="text-[11px] text-muted-foreground">{prof.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(p.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs">
                  <Stat label="Créditos" value={`${p.credits_amount}`} />
                  <Stat label="Valor" value={formatMZN(p.price_mzn)} />
                  <Stat label="Método" value={p.payment_method.toUpperCase()} icon={Smartphone} />
                  <Stat label="Referência" value={p.reference_code} mono />
                </div>

                {p.admin_notes && (
                  <div className="rounded-xl bg-muted/40 p-3 mb-4 text-xs">
                    <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Nota admin</p>
                    <p className="text-foreground">{p.admin_notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {p.proof_url ? (
                    <button
                      type="button"
                      onClick={() => openProof(p)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-smooth"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver comprovativo
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" /> Sem comprovativo
                    </span>
                  )}

                  {p.status === "pending" && (
                    <>
                      <input
                        type="text"
                        value={notes[p.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                        placeholder="Nota (opcional p/ aprovar — obrigatória p/ rejeitar)"
                        className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <button
                        type="button"
                        onClick={() => approve(p)}
                        disabled={actioning === p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-smooth"
                      >
                        {actioning === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(p)}
                        disabled={actioning === p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-smooth"
                      >
                        <X className="h-3.5 w-3.5" /> Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof modal */}
      <AnimatePresence>
        {activeProof && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[70]"
              onClick={() => setActiveProof(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-[71] w-[90vw] max-w-3xl h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-foreground inline-flex items-center gap-2">
                  {activeProof.isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  Comprovativo
                </p>
                <button
                  type="button"
                  onClick={() => setActiveProof(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-black/5">
                {activeProof.isImage ? (
                  <img src={activeProof.url} alt="Comprovativo" className="mx-auto max-w-full max-h-full" />
                ) : (
                  <iframe src={activeProof.url} className="w-full h-full" title="Comprovativo PDF" />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending:  { label: "Pendente",  cls: "bg-amber-500/15 text-amber-700" },
    approved: { label: "Aprovado",  cls: "bg-emerald-500/15 text-emerald-700" },
    rejected: { label: "Rejeitado", cls: "bg-rose-500/15 text-rose-700" },
  };
  const c = cfg[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c.cls}`}>{c.label}</span>;
}

function Stat({ label, value, mono, icon: Icon }: { label: string; value: string; mono?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-bold text-foreground inline-flex items-center gap-1.5 ${mono ? "font-mono" : ""}`}>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value}
      </p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins, Plus, Save, Trash2, Loader2, Eye, EyeOff, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMZN } from "@/lib/format";

export const Route = createFileRoute("/balcao/revisoes-precos")({
  head: () => ({ meta: [{ title: "Preços de revisão — Balcão" }] }),
  component: BalcaoRevisoesPrecos,
});

type Row = {
  id: string;
  source_type: string;
  tier: string;
  label: string;
  description: string | null;
  price_mzn: number;
  turnaround_hours: number;
  active: boolean;
  sort_order: number;
};

const SOURCE_LABELS: Record<string, string> = {
  cv:          "Curriculum Vitae",
  letter:      "Cartas",
  scholarship: "Bolsas",
  news:        "Notícias",
  blog:        "Blog",
  document:    "Documentos",
  other:       "Outros",
};

const TIER_LABELS: Record<string, string> = {
  free:         "Free",
  professional: "Profissional",
  premium:      "Premium",
};

const TIER_COLORS: Record<string, string> = {
  free:         "bg-muted text-muted-foreground",
  professional: "bg-brand/10 text-brand",
  premium:      "bg-gold/15 text-gold",
};

function BalcaoRevisoesPrecos() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<Partial<Row> | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Row[] | null }>;
          };
        };
      };
    })
      .from("revision_pricing")
      .select("*")
      .order("source_type", { ascending: true })
      .order("sort_order", { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function patch(id: string, patchRow: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patchRow } : r)));
  }

  async function save(row: Row) {
    setSavingId(row.id);
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (payload: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from("revision_pricing")
      .update({
        label: row.label,
        description: row.description,
        price_mzn: row.price_mzn,
        turnaround_hours: row.turnaround_hours,
        active: row.active,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Preço actualizado");
  }

  async function remove(id: string) {
    if (!window.confirm("Remover este preço?")) return;
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        delete: () => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from("revision_pricing")
      .delete()
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido");
    refresh();
  }

  async function create() {
    if (!newRow?.source_type || !newRow?.tier || !newRow.label) {
      toast.error("Serviço, plano e nome são obrigatórios");
      return;
    }
    setCreating(true);
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("revision_pricing")
      .insert({
        source_type: newRow.source_type,
        tier: newRow.tier,
        label: newRow.label,
        description: newRow.description ?? null,
        price_mzn: newRow.price_mzn ?? 0,
        turnaround_hours: newRow.turnaround_hours ?? 24,
        active: newRow.active ?? true,
        sort_order: newRow.sort_order ?? 0,
      });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Preço criado");
    setNewRow(null);
    refresh();
  }

  // Group by source_type for the UI.
  const groups = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.source_type] = acc[r.source_type] ?? []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground inline-flex items-center gap-2">
            <Coins className="h-6 w-6 text-gold" /> Preços de revisão humana
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define quanto cobras por revisão profissional ou premium em cada serviço.
            Estes preços aparecem automaticamente no widget de feedback quando o utilizador pede revisão humana.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewRow({ active: true, price_mzn: 0, turnaround_hours: 24, sort_order: 0 })}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Novo preço
        </button>
      </div>

      {/* New row form */}
      {newRow && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-brand/30 bg-brand/5 p-5 space-y-3"
        >
          <p className="text-sm font-bold text-foreground">Novo preço de revisão</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={newRow.source_type ?? ""}
              onChange={(e) => setNewRow({ ...newRow, source_type: e.target.value })}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Serviço…</option>
              {Object.entries(SOURCE_LABELS).map(([id, lbl]) => (
                <option key={id} value={id}>{lbl}</option>
              ))}
            </select>
            <select
              value={newRow.tier ?? ""}
              onChange={(e) => setNewRow({ ...newRow, tier: e.target.value })}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Plano…</option>
              {Object.entries(TIER_LABELS).map(([id, lbl]) => (
                <option key={id} value={id}>{lbl}</option>
              ))}
            </select>
            <input
              type="text"
              value={newRow.label ?? ""}
              onChange={(e) => setNewRow({ ...newRow, label: e.target.value })}
              placeholder="Nome (ex: CV Premium)"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={newRow.price_mzn ?? 0}
              onChange={(e) => setNewRow({ ...newRow, price_mzn: Number(e.target.value) })}
              placeholder="Preço MZN"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <textarea
            value={newRow.description ?? ""}
            onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
            placeholder="Descrição do que está incluído neste plano"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-y"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={newRow.turnaround_hours ?? 24}
              onChange={(e) => setNewRow({ ...newRow, turnaround_hours: Number(e.target.value) })}
              placeholder="Prazo (horas)"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums"
            />
            <input
              type="number"
              value={newRow.sort_order ?? 0}
              onChange={(e) => setNewRow({ ...newRow, sort_order: Number(e.target.value) })}
              placeholder="Ordem"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewRow(null)}
              className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={create}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-brand-foreground px-4 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Criar
            </button>
          </div>
        </motion.div>
      )}

      {/* Pricing groups */}
      {loading ? (
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <Coins className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Sem preços definidos.</p>
          <p className="mt-1 text-xs text-muted-foreground">Aplica a migration 20260517000002_revision_pricing.sql para semear defaults.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(groups).map(([source, list]) => (
            <section key={source}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand">
                {SOURCE_LABELS[source] ?? source}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-2xl border bg-card p-4 transition-opacity ${
                      row.active ? "border-border" : "border-dashed border-muted opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${TIER_COLORS[row.tier] ?? ""}`}>
                        {TIER_LABELS[row.tier] ?? row.tier}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { patch(row.id, { active: !row.active }); save({ ...row, active: !row.active }); }}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title={row.active ? "Ocultar" : "Activar"}
                        >
                          {row.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row.id)}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => patch(row.id, { label: e.target.value })}
                      className="w-full mb-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <textarea
                      value={row.description ?? ""}
                      onChange={(e) => patch(row.id, { description: e.target.value })}
                      rows={2}
                      placeholder="Descrição do que está incluído"
                      className="w-full mb-3 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                    />

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Preço MZN
                        <input
                          type="number"
                          value={row.price_mzn}
                          onChange={(e) => patch(row.id, { price_mzn: Number(e.target.value) })}
                          className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </label>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Prazo (horas)
                        <input
                          type="number"
                          value={row.turnaround_hours}
                          onChange={(e) => patch(row.id, { turnaround_hours: Number(e.target.value) })}
                          className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        Mostrado como: <span className="font-bold text-foreground">{formatMZN(row.price_mzn)}</span> · {row.turnaround_hours}h
                      </p>
                      <button
                        type="button"
                        onClick={() => save(row)}
                        disabled={savingId === row.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-foreground text-background px-3 py-1.5 text-[11px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {savingId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Guardar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

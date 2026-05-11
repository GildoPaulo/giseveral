import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Coins, Users, Crown, TrendingUp, Plus, Pencil, Trash2,
  Loader2, X, Save, Check, Gift, Tag, RefreshCw, Send,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/creditos")({
  component: BalcaoCreditos,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  hub_credits: number;
  hub_premium: boolean;
  premium_expires_at: string | null;
  total_downloads: number;
  role: string;
  created_at: string;
};

type Promotion = {
  id: string;
  title: string;
  type: string;
  value: number;
  code: string | null;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
};

type CreditModal = {
  user: UserProfile;
  delta: number;
  reason: string;
};

type PromoForm = {
  title: string;
  type: string;
  value: number;
  code: string;
  expires_at: string;
  max_uses: string;
  is_active: boolean;
};

const BLANK_PROMO: PromoForm = {
  title: "",
  type: "credits",
  value: 5,
  code: "",
  expires_at: "",
  max_uses: "",
  is_active: true,
};

const PROMO_TYPES: { value: string; label: string }[] = [
  { value: "credits", label: "Créditos grátis" },
  { value: "premium", label: "Premium grátis" },
  { value: "discount", label: "Desconto %" },
  { value: "referral", label: "Indicação de amigo" },
];

// ── Component ──────────────────────────────────────────────────────────────────

function BalcaoCreditos() {
  const [tab, setTab] = useState<"users" | "promos">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [search, setSearch] = useState("");
  const [creditModal, setCreditModal] = useState<CreditModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [promoModal, setPromoModal] = useState<{ open: boolean; editing: Promotion | null }>({ open: false, editing: null });
  const [promoForm, setPromoForm] = useState<PromoForm>(BLANK_PROMO);

  // Stats
  const premiumCount = users.filter((u) => u.hub_premium).length;
  const totalCredits = users.reduce((s, u) => s + (u.hub_credits ?? 0), 0);

  useEffect(() => { loadUsers(); loadPromos(); }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, email, full_name, hub_credits, hub_premium, premium_expires_at, total_downloads, role, created_at")
      .order("hub_credits", { ascending: false })
      .limit(200);

    if (error) {
      toast.error("Erro ao carregar utilizadores");
    } else {
      setUsers((data as UserProfile[]) ?? []);
    }
    setLoadingUsers(false);
  }

  async function loadPromos() {
    setLoadingPromos(true);
    const { data } = await (supabase as any)
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    setPromos((data as Promotion[]) ?? []);
    setLoadingPromos(false);
  }

  // ── Credit adjustment ──────────────────────────────────────────────────────

  async function applyCredits() {
    if (!creditModal) return;
    const { user, delta, reason } = creditModal;
    if (delta === 0) { toast.error("Delta não pode ser zero"); return; }
    setSaving(true);

    const newCredits = Math.max(0, (user.hub_credits ?? 0) + delta);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ hub_credits: newCredits })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao actualizar créditos");
    } else {
      // Log transaction
      await (supabase as any).from("credits_transactions").insert({
        user_id: user.id,
        amount: delta,
        type: "admin",
        description: reason || `Ajuste manual (${delta > 0 ? "+" : ""}${delta})`,
      });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, hub_credits: newCredits } : u));
      toast.success(`Créditos actualizados: ${newCredits}`);
      setCreditModal(null);
    }
    setSaving(false);
  }

  // ── Premium toggle ─────────────────────────────────────────────────────────

  async function togglePremium(user: UserProfile) {
    const next = !user.hub_premium;
    const expiresAt = next
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await (supabase as any)
      .from("profiles")
      .update({ hub_premium: next, premium_expires_at: expiresAt })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao actualizar Premium");
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, hub_premium: next, premium_expires_at: expiresAt } : u
        )
      );
      toast.success(next ? "Premium activado (30 dias)" : "Premium removido");
    }
  }

  // ── Promotions CRUD ────────────────────────────────────────────────────────

  function openPromo(p?: Promotion) {
    if (p) {
      setPromoForm({
        title: p.title,
        type: p.type,
        value: p.value,
        code: p.code ?? "",
        expires_at: p.expires_at ? p.expires_at.slice(0, 10) : "",
        max_uses: p.max_uses != null ? String(p.max_uses) : "",
        is_active: p.is_active,
      });
    } else {
      setPromoForm(BLANK_PROMO);
    }
    setPromoModal({ open: true, editing: p ?? null });
  }

  async function savePromo() {
    if (!promoForm.title.trim()) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const payload = {
      title: promoForm.title.trim(),
      type: promoForm.type,
      value: promoForm.value,
      code: promoForm.code.trim() || null,
      expires_at: promoForm.expires_at || null,
      max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
      is_active: promoForm.is_active,
    };

    if (promoModal.editing) {
      const { error } = await (supabase as any)
        .from("promotions").update(payload).eq("id", promoModal.editing.id);
      if (error) toast.error("Erro ao guardar");
      else { toast.success("Promoção actualizada!"); await loadPromos(); setPromoModal({ open: false, editing: null }); }
    } else {
      const { error } = await (supabase as any).from("promotions").insert(payload);
      if (error) toast.error("Erro ao criar");
      else { toast.success("Promoção criada!"); await loadPromos(); setPromoModal({ open: false, editing: null }); }
    }
    setSaving(false);
  }

  async function deletePromo(id: string) {
    if (!confirm("Eliminar esta promoção?")) return;
    const { error } = await (supabase as any).from("promotions").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar");
    else { setPromos((p) => p.filter((x) => x.id !== id)); toast.success("Promoção eliminada"); }
  }

  async function togglePromo(p: Promotion) {
    const { error } = await (supabase as any)
      .from("promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    if (!error) setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
  }

  // ── Filtered users ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(s) || (u.full_name ?? "").toLowerCase().includes(s);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
          <Coins className="h-6 w-6 text-gold" /> Créditos & Premium
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerir créditos, assinaturas premium e promoções</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Utilizadores", value: users.length, color: "text-brand" },
          { icon: Crown, label: "Premium activos", value: premiumCount, color: "text-gold" },
          { icon: Coins, label: "Créditos totais", value: totalCredits, color: "text-green-500" },
          { icon: Gift, label: "Promoções activas", value: promos.filter((p) => p.is_active).length, color: "text-purple-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(["users", "promos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-smooth ${
              tab === t ? "bg-brand text-brand-foreground border-brand" : "border-border text-foreground/70 hover:border-brand/50"
            }`}
          >
            {t === "users" ? "Utilizadores" : "Promoções"}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por email ou nome..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button onClick={loadUsers} title="Actualizar" className="rounded-xl border border-border p-2.5 hover:bg-muted transition-colors">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">Utilizador</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">Créditos</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">Premium</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Downloads</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">Acções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[200px]">
                              {u.full_name || u.email || "Sem nome"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-brand">{u.hub_credits ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-xs font-bold ${u.hub_premium ? "text-gold" : "text-muted-foreground"}`}>
                              {u.hub_premium ? "✓ Sim" : "Não"}
                            </span>
                            {u.hub_premium && u.premium_expires_at && (
                              <span className="text-[10px] text-muted-foreground">
                                até {new Date(u.premium_expires_at).toLocaleDateString("pt")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="text-muted-foreground">{u.total_downloads ?? 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit credits */}
                            <button
                              onClick={() => setCreditModal({ user: u, delta: 5, reason: "" })}
                              title="Ajustar créditos"
                              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-brand hover:border-brand/50 transition-colors"
                            >
                              <Coins className="h-3.5 w-3.5" />
                            </button>
                            {/* Toggle premium */}
                            <button
                              onClick={() => togglePremium(u)}
                              title={u.hub_premium ? "Remover Premium" : "Dar Premium (30 dias)"}
                              className={`rounded-md border p-1.5 transition-colors ${
                                u.hub_premium
                                  ? "border-gold/40 text-gold hover:bg-gold/10"
                                  : "border-border text-muted-foreground hover:text-gold hover:border-gold/50"
                              }`}
                            >
                              <Crown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Nenhum utilizador encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PROMOS TAB ────────────────────────────────────────────────────── */}
      {tab === "promos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openPromo()}
              className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
            >
              <Plus className="h-4 w-4" /> Nova promoção
            </button>
          </div>

          {loadingPromos ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : promos.length === 0 ? (
            <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-border">
              <Gift className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground font-medium">Sem promoções ainda</p>
              <button onClick={() => openPromo()} className="mt-3 text-sm text-brand hover:underline">
                + Criar primeira promoção
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {promos.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-card transition-smooth ${
                    p.is_active ? "border-border" : "border-border opacity-60"
                  }`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                    p.type === "premium" ? "bg-gold/10 text-gold" : "bg-brand/10 text-brand"
                  }`}>
                    {p.type === "premium" ? <Crown className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                        p.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                      }`}>
                        {p.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {PROMO_TYPES.find((t) => t.value === p.type)?.label} · +{p.value}
                      {p.code && ` · Código: ${p.code}`}
                      {p.expires_at && ` · Expira: ${new Date(p.expires_at).toLocaleDateString("pt")}`}
                      {p.max_uses != null && ` · ${p.uses_count}/${p.max_uses} usos`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => togglePromo(p)}
                      title={p.is_active ? "Desactivar" : "Activar"}
                      className="rounded-md border border-border p-1.5 hover:bg-muted transition-colors"
                    >
                      {p.is_active ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => openPromo(p)}
                      className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-brand hover:border-brand/50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deletePromo(p.id)}
                      className="rounded-md border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREDIT MODAL ──────────────────────────────────────────────────── */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCreditModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-background border border-border shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-gold" /> Ajustar créditos
              </h3>
              <button onClick={() => setCreditModal(null)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {creditModal.user.email} · <span className="font-bold text-brand">{creditModal.user.hub_credits} créditos actuais</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Variação (+ ou −)</label>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => setCreditModal((m) => m ? { ...m, delta: Math.min(m.delta - 1, -1) } : m)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={creditModal.delta}
                  onChange={(e) => setCreditModal((m) => m ? { ...m, delta: parseInt(e.target.value) || 0 } : m)}
                  className="flex-1 text-center rounded-xl border border-border bg-background px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button
                  onClick={() => setCreditModal((m) => m ? { ...m, delta: Math.max(m.delta + 1, 1) } : m)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resultado: {Math.max(0, (creditModal.user.hub_credits ?? 0) + creditModal.delta)} créditos
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Motivo (opcional)</label>
              <input
                value={creditModal.reason}
                onChange={(e) => setCreditModal((m) => m ? { ...m, reason: e.target.value } : m)}
                placeholder="Ex: Bónus de upload, correcção manual..."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setCreditModal(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button
                onClick={applyCredits}
                disabled={saving || creditModal.delta === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMO MODAL ───────────────────────────────────────────────────── */}
      {promoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPromoModal({ open: false, editing: null })}>
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-brand" />
                {promoModal.editing ? "Editar promoção" : "Nova promoção"}
              </h3>
              <button onClick={() => setPromoModal({ open: false, editing: null })}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Título *</label>
                <input
                  value={promoForm.title}
                  onChange={(e) => setPromoForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Natal 2025 — +5 créditos"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tipo</label>
                  <select
                    value={promoForm.type}
                    onChange={(e) => setPromoForm((p) => ({ ...p, type: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
                  >
                    {PROMO_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {promoForm.type === "discount" ? "Desconto %" : "Créditos"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={promoForm.value}
                    onChange={(e) => setPromoForm((p) => ({ ...p, value: parseInt(e.target.value) || 0 }))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Código (opcional)</label>
                  <input
                    value={promoForm.code}
                    onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="PROMO10"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Máx. usos</label>
                  <input
                    type="number"
                    min={1}
                    value={promoForm.max_uses}
                    onChange={(e) => setPromoForm((p) => ({ ...p, max_uses: e.target.value }))}
                    placeholder="Ilimitado"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Data de expiração</label>
                <input
                  type="date"
                  value={promoForm.expires_at}
                  onChange={(e) => setPromoForm((p) => ({ ...p, expires_at: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoForm.is_active}
                  onChange={(e) => setPromoForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded"
                />
                Promoção activa
              </label>
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button
                onClick={() => setPromoModal({ open: false, editing: null })}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={savePromo}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {promoModal.editing ? "Guardar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

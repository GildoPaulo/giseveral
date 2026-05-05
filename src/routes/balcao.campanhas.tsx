import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Megaphone, Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
  Check, X, Upload, Image, Timer, Package, Tag, Calendar,
  Monitor, Rows3, LayoutGrid, Maximize2, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type Campaign, type CampaignType, type UrgencyType,
  loadCampaigns, createCampaign, updateCampaign, deleteCampaign,
  toggleCampaignActive, getCampaignStatus,
} from "@/lib/campaigns";

export const Route = createFileRoute("/balcao/campanhas")({
  component: BalcaoCampanhas,
});

type FormDraft = Omit<Campaign, "id" | "createdAt">;

const emptyDraft = (): FormDraft => ({
  active: true,
  type: "banner",
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  ctaText: "Ver promoção",
  ctaUrl: "/orcamento",
  urgency: "none",
  urgencyValue: "",
  socialProof: "",
  originalPrice: "",
  newPrice: "",
  savingsText: "",
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: "",
});

const TYPE_CONFIG: Record<CampaignType, { label: string; desc: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  banner: { label: "Banner Principal", desc: "Secção de destaque na página inicial",  cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400", icon: Maximize2 },
  slider: { label: "Slider",           desc: "Carrossel (máx 3, oculto no móvel)",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",         icon: Monitor },
  mini:   { label: "Mini Banner",      desc: "Faixa entre secções de conteúdo",       cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",     icon: Rows3 },
  popup:  { label: "Pop-up",           desc: "Janela flutuante (só desktop, 1×/visita)", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",     icon: LayoutGrid },
};

const STATUS_CONFIG = {
  live:      { label: "Ativa",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  scheduled: { label: "Agendada", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  expired:   { label: "Expirada", cls: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
  inactive:  { label: "Inativa",  cls: "bg-muted text-muted-foreground" },
};

const URGENCY_OPTS: { id: UrgencyType; label: string; placeholder: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "none",   label: "Nenhuma",          placeholder: "",                   icon: X },
  { id: "timer",  label: "Contagem regressiva", placeholder: "Ex: 2025-12-31T23:59", icon: Timer },
  { id: "stock",  label: "Stock limitado",   placeholder: "Ex: 5",              icon: Package },
  { id: "coupon", label: "Cupão exclusivo",  placeholder: "Ex: GISE20",         icon: Tag },
];

function BalcaoCampanhas() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraft>(emptyDraft());
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCampaigns()
      .then(setCampaigns)
      .catch(() => toast.error("Erro ao carregar campanhas"))
      .finally(() => setLoading(false));
  }, []);

  const liveCount      = campaigns.filter((c) => getCampaignStatus(c) === "live").length;
  const scheduledCount = campaigns.filter((c) => getCampaignStatus(c) === "scheduled").length;
  const expiredCount   = campaigns.filter((c) => getCampaignStatus(c) === "expired").length;

  function openCreate() { setEditId(null); setDraft(emptyDraft()); setShowForm(true); }
  function openEdit(c: Campaign) {
    setEditId(c.id);
    setDraft({ active: c.active, type: c.type, title: c.title, subtitle: c.subtitle, description: c.description, imageUrl: c.imageUrl, ctaText: c.ctaText, ctaUrl: c.ctaUrl, urgency: c.urgency, urgencyValue: c.urgencyValue, socialProof: c.socialProof, originalPrice: c.originalPrice, newPrice: c.newPrice, savingsText: c.savingsText, startsAt: c.startsAt.slice(0, 16), endsAt: c.endsAt.slice(0, 16) });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() { setShowForm(false); setEditId(null); setDraft(emptyDraft()); }

  async function saveDraft() {
    if (!draft.title.trim()) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateCampaign(editId, draft);
        setCampaigns((prev) => prev.map((c) => c.id === editId ? { ...c, ...draft } : c));
        toast.success("Campanha actualizada!");
      } else {
        const created = await createCampaign(draft);
        setCampaigns((prev) => [created, ...prev]);
        toast.success("Campanha criada!");
      }
      cancelForm();
    } catch (e) {
      toast.error("Erro ao guardar campanha");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta campanha?")) return;
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campanha removida");
    } catch {
      toast.error("Erro ao remover");
    }
  }

  async function handleToggle(id: string) {
    const c = campaigns.find((x) => x.id === id)!;
    const next = !c.active;
    try {
      await toggleCampaignActive(id, next);
      setCampaigns((prev) => prev.map((x) => x.id === id ? { ...x, active: next } : x));
      toast.success(next ? "Campanha activada" : "Campanha desactivada");
    } catch {
      toast.error("Erro ao actualizar");
    }
  }

  async function uploadImage(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem demasiado grande (máx 5 MB)"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `campanhas/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("service-uploads").upload(path, file, { upsert: false });
    if (error) { toast.error("Erro ao carregar imagem"); setUploading(false); return; }
    const { data } = supabase.storage.from("service-uploads").getPublicUrl(path);
    setDraft((d) => ({ ...d, imageUrl: data.publicUrl }));
    setUploading(false);
    toast.success("Imagem carregada!");
  }

  const set = (patch: Partial<FormDraft>) => setDraft((d) => ({ ...d, ...patch }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">Campanhas & Promoções</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {campaigns.length} campanhas · <span className="text-emerald-600">{liveCount} ativas</span>
            {scheduledCount > 0 && <> · <span className="text-blue-600">{scheduledCount} agendadas</span></>}
            {expiredCount > 0 && <> · <span className="text-red-500">{expiredCount} expiradas</span></>}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
          >
            <Plus className="h-4 w-4" /> Nova campanha
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-gold" />
              {editId ? "Editar campanha" : "Nova campanha"}
            </h2>
            <button onClick={cancelForm} className="rounded-lg border border-border p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tipo de campanha *</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.entries(TYPE_CONFIG) as [CampaignType, typeof TYPE_CONFIG[CampaignType]][]).map(([t, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set({ type: t })}
                    className={`rounded-xl border-2 p-3 text-left transition-smooth ${draft.type === t ? "border-brand bg-brand/5" : "border-border hover:border-brand/30"}`}
                  >
                    <Icon className={`h-4 w-4 mb-1.5 ${draft.type === t ? "text-brand" : "text-muted-foreground"}`} />
                    <p className={`text-xs font-semibold ${draft.type === t ? "text-brand" : "text-foreground"}`}>{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Título *</label>
              <input value={draft.title} onChange={(e) => set({ title: e.target.value })}
                placeholder="Ex: -20% em impressões esta semana"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Subtítulo / Tag</label>
              <input value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })}
                placeholder="Ex: Promoção especial"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })}
                rows={2} placeholder="Breve descrição da promoção..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Imagem de fundo</label>
            <div className="flex gap-3">
              <input value={draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })}
                placeholder="https://... ou carrega um ficheiro →"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-smooth"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Carregar
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
            </div>
            {draft.imageUrl && (
              <div className="mt-2 relative rounded-lg overflow-hidden aspect-video w-40 border border-border bg-muted">
                <img src={draft.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <button onClick={() => set({ imageUrl: "" })} className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Prices + CTA */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Preço original</label>
              <input value={draft.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })}
                placeholder="Ex: 200 MZN"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Novo preço / oferta</label>
              <input value={draft.newPrice} onChange={(e) => set({ newPrice: e.target.value })}
                placeholder="Ex: 150 MZN"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Poupança</label>
              <input value={draft.savingsText} onChange={(e) => set({ savingsText: e.target.value })}
                placeholder="Ex: Poupe 50 MZN"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Texto do botão CTA</label>
              <input value={draft.ctaText} onChange={(e) => set({ ctaText: e.target.value })}
                placeholder="Ex: Aproveitar agora"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Link do botão CTA</label>
              <input value={draft.ctaUrl} onChange={(e) => set({ ctaUrl: e.target.value })}
                placeholder="Ex: /orcamento ou /loja"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Gatilho de urgência</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {URGENCY_OPTS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set({ urgency: id, urgencyValue: "" })}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-smooth ${draft.urgency === id ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            {draft.urgency !== "none" && (
              <input
                value={draft.urgencyValue}
                onChange={(e) => set({ urgencyValue: e.target.value })}
                placeholder={URGENCY_OPTS.find((o) => o.id === draft.urgency)?.placeholder}
                type={draft.urgency === "timer" ? "datetime-local" : "text"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            )}
          </div>

          {/* Social proof */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Prova social</label>
            <input value={draft.socialProof} onChange={(e) => set({ socialProof: e.target.value })}
              placeholder='"147 pessoas viram esta oferta hoje" ou "Restam 4 unidades"'
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>

          {/* Schedule */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Início
              </label>
              <input type="datetime-local" value={draft.startsAt} onChange={(e) => set({ startsAt: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Fim <span className="text-muted-foreground font-normal">(deixa vazio = sem fim)</span>
              </label>
              <input type="datetime-local" value={draft.endsAt} onChange={(e) => set({ endsAt: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set({ active: !draft.active })} className="flex items-center gap-2 text-sm font-medium">
              {draft.active
                ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              <span className={draft.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                {draft.active ? "Activa ao guardar" : "Inactiva (rascunho)"}
              </span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={saveDraft} disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground hover:shadow-elegant transition-smooth disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editId ? "Guardar alterações" : "Criar campanha"}
            </button>
            <button onClick={cancelForm} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-smooth">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 && !showForm && (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Sem campanhas</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Cria a primeira campanha para começar.</p>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => {
          const status = getCampaignStatus(c);
          const typeM = TYPE_CONFIG[c.type];
          const statusM = STATUS_CONFIG[status];
          const TypeIcon = typeM.icon;
          return (
            <div
              key={c.id}
              className={`rounded-2xl border bg-card shadow-card overflow-hidden transition-smooth ${c.active && status === "live" ? "border-border" : "border-dashed border-muted-foreground/25 opacity-70"}`}
            >
              <div className="flex items-start gap-4 p-5">
                <div className="flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden bg-muted border border-border">
                  {c.imageUrl
                    ? <img src={c.imageUrl} alt={c.title} className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center"><Image className="h-5 w-5 text-muted-foreground/30" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeM.cls}`}>{typeM.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusM.cls}`}>{statusM.label}</span>
                      {c.urgency !== "none" && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{c.urgency}</span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-brand mt-1 leading-snug truncate">{c.title}</h3>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                    {c.newPrice && (
                      <span className="font-semibold text-gold">{c.newPrice}
                        {c.originalPrice && <span className="line-through text-muted-foreground ml-1">{c.originalPrice}</span>}
                      </span>
                    )}
                    {c.startsAt && <span>Início: {new Date(c.startsAt).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                    {c.endsAt && <span>Fim: {new Date(c.endsAt).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
                <button
                  onClick={() => handleToggle(c.id)}
                  className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium hover:bg-muted transition-colors ${c.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                >
                  {c.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {c.active ? "Activa" : "Inactiva"}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-brand transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

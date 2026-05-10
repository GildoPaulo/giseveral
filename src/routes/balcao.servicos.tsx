import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Wrench, Plus, Pencil, Trash2, Loader2, Save, X, Check,
  ChevronDown, ToggleLeft, ToggleRight, Star, GripVertical,
  Printer, BookOpen, Palette, Laptop, Network, Camera, Cpu,
  Phone, FileText, ShoppingBag, Monitor, Wifi, Globe, Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

export const Route = createFileRoute("/balcao/servicos")({
  component: BalcaoServicos,
});

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon_name: string;
  price_from: string;
  description: string;
  features: string[];
  badge: string | null;
  active: boolean;
  pedir_enabled: boolean;
  sort_order: number;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  printer: Printer,
  "book-open": BookOpen,
  palette: Palette,
  laptop: Laptop,
  network: Network,
  wrench: Wrench,
  camera: Camera,
  cpu: Cpu,
  phone: Phone,
  "file-text": FileText,
  "shopping-bag": ShoppingBag,
  monitor: Monitor,
  wifi: Wifi,
  globe: Globe,
  settings: Settings,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const EMPTY_FORM: Omit<ServiceRow, "id"> = {
  slug: "",
  title: "",
  subtitle: "",
  icon_name: "wrench",
  price_from: "",
  description: "",
  features: [""],
  badge: null,
  active: true,
  pedir_enabled: true,
  sort_order: 0,
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function BalcaoServicos() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<Omit<ServiceRow, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterState, setFilterState] = useState<"todos" | "activos" | "inactivos">("todos");
  const { addItem } = useCart();

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("services")
      .select("*")
      .order("sort_order");
    setServices((data as ServiceRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ ...EMPTY_FORM, sort_order: services.length + 1 });
    setSelected(null);
    setModal("add");
  }

  function openEdit(s: ServiceRow) {
    setForm({
      slug: s.slug,
      title: s.title,
      subtitle: s.subtitle,
      icon_name: s.icon_name,
      price_from: s.price_from,
      description: s.description,
      features: s.features.length ? s.features : [""],
      badge: s.badge,
      active: s.active,
      pedir_enabled: s.pedir_enabled,
      sort_order: s.sort_order,
    });
    setSelected(s);
    setModal("edit");
  }

  function closeModal() { setModal(null); setSelected(null); }

  function field<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function addFeature() {
    setForm((p) => ({ ...p, features: [...p.features, ""] }));
  }

  function updateFeature(i: number, val: string) {
    setForm((p) => {
      const f = [...p.features];
      f[i] = val;
      return { ...p, features: f };
    });
  }

  function removeFeature(i: number) {
    setForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    if (!form.slug.trim()) { toast.error("Slug obrigatório"); return; }
    setSaving(true);

    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      features: form.features.map((f) => f.trim()).filter(Boolean),
      badge: form.badge?.trim() || null,
      price_from: form.price_from.trim() || "Orçamento",
    };

    if (modal === "add") {
      const { data, error } = await (supabase as any).from("services").insert(payload).select().single();
      if (error) { toast.error("Erro ao criar: " + error.message); }
      else { setServices((prev) => [...prev, data as ServiceRow].sort((a, b) => a.sort_order - b.sort_order)); toast.success("Serviço criado!"); closeModal(); }
    } else if (selected) {
      const { error } = await (supabase as any).from("services").update(payload).eq("id", selected.id);
      if (error) { toast.error("Erro ao guardar: " + error.message); }
      else {
        setServices((prev) =>
          prev.map((s) => s.id === selected.id ? { ...s, ...payload } : s)
        );
        toast.success("Serviço actualizado!");
        closeModal();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este serviço permanentemente?")) return;
    const { error } = await (supabase as any).from("services").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); return; }
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success("Serviço eliminado.");
  }

  async function toggleActive(s: ServiceRow) {
    const { error } = await (supabase as any).from("services").update({ active: !s.active }).eq("id", s.id);
    if (!error) {
      setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, active: !x.active } : x));
      toast.success(!s.active ? "Serviço activado" : "Serviço desactivado");
    }
  }

  async function togglePedir(s: ServiceRow) {
    const { error } = await (supabase as any).from("services").update({ pedir_enabled: !s.pedir_enabled }).eq("id", s.id);
    if (!error) {
      setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, pedir_enabled: !x.pedir_enabled } : x));
      toast.success(!s.pedir_enabled ? "Botão 'Pedir' activado" : "Botão 'Pedir' desactivado");
    }
  }

  function testCart(s: ServiceRow) {
    addItem({
      id: `service-${s.slug}`,
      name: s.title,
      price: 0,
      quantity: 1,
      type: "servico",
      serviceDetails: { category: s.slug, description: s.description },
    });
    toast.success(`${s.title} adicionado ao carrinho (teste)`);
  }

  const filtered = services.filter((s) =>
    filterState === "todos" ? true : filterState === "activos" ? s.active : !s.active
  );

  const activeCount = services.filter((s) => s.active).length;
  const pedirCount = services.filter((s) => s.pedir_enabled).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-brand" /> Gestão de Serviços
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCount} activos · {pedirCount} com botão "Pedir" · {services.length} total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-card"
        >
          <Plus className="h-4 w-4" /> Novo serviço
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(["todos", "activos", "inactivos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterState(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth border capitalize ${
              filterState === f ? "bg-brand text-brand-foreground border-brand" : "border-border text-foreground/70 hover:border-brand/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center py-20 rounded-2xl border-2 border-dashed border-border">
          <Wrench className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-medium">Sem serviços ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            Corre a migration SQL para popular com os serviços padrão
          </p>
          <button onClick={openAdd} className="text-sm text-brand hover:underline">
            + Adicionar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((s) => {
              const Icon = ICON_MAP[s.icon_name] ?? Wrench;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-smooth hover:bg-muted/20 ${!s.active ? "opacity-55" : ""}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />

                  {/* Icon */}
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${s.active ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{s.title}</span>
                      {s.badge && (
                        <span className="rounded-full bg-gold/15 text-gold text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                          {s.badge}
                        </span>
                      )}
                      {!s.active && (
                        <span className="rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5">
                          inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.subtitle}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {s.features.length} item(s) · slug: /{s.slug}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-brand">
                      {s.price_from || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">a partir de</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(s)}
                      title={s.active ? "Desactivar" : "Activar"}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      {s.active
                        ? <ToggleRight className="h-5 w-5 text-green-500" />
                        : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    </button>

                    {/* Pedir toggle */}
                    <button
                      onClick={() => togglePedir(s)}
                      title={s.pedir_enabled ? "Desligar botão Pedir" : "Ligar botão Pedir"}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <ShoppingBag className={`h-4 w-4 ${s.pedir_enabled ? "text-brand" : "text-muted-foreground/40"}`} />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="rounded p-1.5 hover:bg-red-50 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-background border border-border shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-lg">
                {modal === "add" ? "Novo serviço" : `Editar — ${selected?.title}`}
              </h2>
              <button onClick={closeModal}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Title + Slug row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Título *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => {
                      const t = e.target.value;
                      field("title", t);
                      if (modal === "add") field("slug", slugify(t));
                    }}
                    placeholder="Ex: Reprografia"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Slug (URL) *
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => field("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="reprografia"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">/servicos/<span className="text-brand">{form.slug || "slug"}</span></p>
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtítulo</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => field("subtitle", e.target.value)}
                  placeholder="Ex: Impressão, fotocópias e digitalização"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {/* Icon + Price + Badge row */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ícone</label>
                  <div className="relative mt-1">
                    <select
                      value={form.icon_name}
                      onChange={(e) => field("icon_name", e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  {/* Icon preview */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {(() => {
                      const Icon = ICON_MAP[form.icon_name] ?? Wrench;
                      return <Icon className="h-4 w-4 text-brand" />;
                    })()}
                    <span className="text-[10px] text-muted-foreground">preview</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preço a partir de
                  </label>
                  <input
                    value={form.price_from}
                    onChange={(e) => field("price_from", e.target.value)}
                    placeholder="Ex: 300 MZN"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Badge (opcional)
                  </label>
                  <input
                    value={form.badge ?? ""}
                    onChange={(e) => field("badge", e.target.value || null)}
                    placeholder="Ex: Mais popular"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Descrição curta
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => field("description", e.target.value)}
                  rows={2}
                  placeholder="Descrição do serviço para a página pública"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {/* Features list */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Itens incluídos
                </label>
                <div className="mt-2 space-y-2">
                  {form.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
                      <input
                        value={feat}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        placeholder="Item do serviço"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <button
                        onClick={() => removeFeature(i)}
                        className="rounded p-1 hover:bg-red-50 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addFeature}
                  className="mt-2 text-xs text-brand hover:underline"
                >
                  + Adicionar item
                </button>
              </div>

              {/* Sort order + Toggles */}
              <div className="flex items-center gap-6 flex-wrap pt-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ordem
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => field("sort_order", parseInt(e.target.value) || 0)}
                    className="mt-1 w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => field("active", e.target.checked)}
                    className="accent-green-500"
                  />
                  Activo
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={form.pedir_enabled}
                    onChange={(e) => field("pedir_enabled", e.target.checked)}
                    className="accent-blue-500"
                  />
                  Botão "Pedir" visível
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-between items-center gap-3 flex-shrink-0">
              {modal === "edit" && selected && (
                <button
                  onClick={() => { closeModal(); testCart(selected); }}
                  className="text-xs text-muted-foreground hover:text-brand flex items-center gap-1"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Testar carrinho
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {modal === "add" ? "Criar serviço" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

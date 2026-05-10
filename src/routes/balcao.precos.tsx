import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  DollarSign, Plus, Pencil, Trash2, Star, Loader2, Save, X,
  Check, ChevronDown, GripVertical, ToggleLeft, ToggleRight, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/precos")({
  component: BalcaoPrecos,
});

type PriceRow = {
  id: string;
  category: string;
  name: string;
  price: number | null;
  price_label: string;
  unit: string;
  description: string | null;
  highlight: boolean;
  active: boolean;
  sort_order: number;
};

const EMPTY: Omit<PriceRow, "id"> = {
  category: "Reprografia & Impressão",
  name: "",
  price: null,
  price_label: "Orçamento",
  unit: "por página",
  description: null,
  highlight: false,
  active: true,
  sort_order: 0,
};

const CATEGORIES = [
  "Reprografia & Impressão",
  "Assistência Informática",
  "Redes & Tecnologia",
  "Design Gráfico",
  "Papelaria",
  "Hub / Créditos",
  "Outros",
];

const DEFAULT_PRICES: Omit<PriceRow, "id">[] = [
  { category: "Reprografia & Impressão", name: "Impressão Preto & Branco", price: 5, price_label: "5 MZN", unit: "por página", description: null, highlight: false, active: true, sort_order: 0 },
  { category: "Reprografia & Impressão", name: "Impressão a Cores", price: 15, price_label: "15 MZN", unit: "por página", description: null, highlight: false, active: true, sort_order: 1 },
  { category: "Reprografia & Impressão", name: "Fotocópias", price: 3, price_label: "3 MZN", unit: "por página", description: null, highlight: false, active: true, sort_order: 2 },
  { category: "Reprografia & Impressão", name: "Digitalização de documentos", price: 5, price_label: "5 MZN", unit: "por página", description: null, highlight: false, active: true, sort_order: 3 },
  { category: "Reprografia & Impressão", name: "Encadernação simples", price: 50, price_label: "50 MZN", unit: "por trabalho", description: null, highlight: false, active: true, sort_order: 4 },
  { category: "Reprografia & Impressão", name: "Encadernação com capa dura", price: 150, price_label: "150 MZN", unit: "por trabalho", description: null, highlight: true, active: true, sort_order: 5 },
  { category: "Reprografia & Impressão", name: "Plastificação A4", price: 30, price_label: "30 MZN", unit: "por folha", description: null, highlight: false, active: true, sort_order: 6 },
  { category: "Reprografia & Impressão", name: "Impressão de banners / cartazes", price: null, price_label: "Orçamento", unit: "sob consulta", description: null, highlight: false, active: true, sort_order: 7 },
  { category: "Assistência Informática", name: "Formatação de PC / Laptop", price: 500, price_label: "500 MZN", unit: "inclui backup", description: null, highlight: true, active: true, sort_order: 0 },
  { category: "Assistência Informática", name: "Instalação de Windows", price: 700, price_label: "700 MZN", unit: "com drivers", description: null, highlight: false, active: true, sort_order: 1 },
  { category: "Assistência Informática", name: "Remoção de vírus / malware", price: 400, price_label: "400 MZN", unit: "diagnóstico incl.", description: null, highlight: false, active: true, sort_order: 2 },
  { category: "Assistência Informática", name: "Instalação de programas", price: 200, price_label: "200 MZN", unit: "pacote básico", description: null, highlight: false, active: true, sort_order: 3 },
  { category: "Assistência Informática", name: "Recuperação de dados", price: null, price_label: "Orçamento", unit: "sob consulta", description: null, highlight: false, active: true, sort_order: 4 },
  { category: "Assistência Informática", name: "Reparação de hardware", price: null, price_label: "Orçamento", unit: "avaliação grátis", description: null, highlight: false, active: true, sort_order: 5 },
  { category: "Redes & Tecnologia", name: "Configuração de router/Wi-Fi", price: 1500, price_label: "1.500 MZN", unit: "residencial", description: null, highlight: false, active: true, sort_order: 0 },
  { category: "Redes & Tecnologia", name: "Instalação de rede empresarial", price: null, price_label: "Orçamento", unit: "sob consulta", description: null, highlight: false, active: true, sort_order: 1 },
  { category: "Redes & Tecnologia", name: "Cabeamento estruturado", price: 200, price_label: "200 MZN", unit: "por ponto", description: null, highlight: true, active: true, sort_order: 2 },
  { category: "Redes & Tecnologia", name: "Extensão de sinal Wi-Fi", price: 800, price_label: "800 MZN", unit: "por repetidor", description: null, highlight: false, active: true, sort_order: 3 },
  { category: "Redes & Tecnologia", name: "Assistência técnica no local", price: 300, price_label: "300 MZN", unit: "deslocação incl.", description: null, highlight: false, active: true, sort_order: 4 },
  { category: "Design Gráfico", name: "Logotipo / identidade visual", price: 1500, price_label: "1.500 MZN", unit: "inclui ficheiros", description: null, highlight: true, active: true, sort_order: 0 },
  { category: "Design Gráfico", name: "Cartão de visita (design)", price: 300, price_label: "300 MZN", unit: "frente e verso", description: null, highlight: false, active: true, sort_order: 1 },
  { category: "Design Gráfico", name: "Panfleto / flyer A5", price: 400, price_label: "400 MZN", unit: "design + impressão", description: null, highlight: false, active: true, sort_order: 2 },
  { category: "Design Gráfico", name: "Banner digital para redes", price: 250, price_label: "250 MZN", unit: "por peça", description: null, highlight: false, active: true, sort_order: 3 },
  { category: "Design Gráfico", name: "Edição de documentos / PDF", price: 200, price_label: "200 MZN", unit: "por trabalho", description: null, highlight: false, active: true, sort_order: 4 },
  { category: "Hub / Créditos", name: "Pacote Starter (10 créditos)", price: 100, price_label: "100 MZN", unit: "válido 90 dias", description: "10 downloads de documentos académicos", highlight: false, active: true, sort_order: 0 },
  { category: "Hub / Créditos", name: "Pacote Standard (25 créditos)", price: 200, price_label: "200 MZN", unit: "válido 6 meses", description: "25 downloads + suporte prioritário", highlight: true, active: true, sort_order: 1 },
  { category: "Hub / Créditos", name: "Premium (ilimitado)", price: 350, price_label: "350 MZN/mês", unit: "por mês", description: "Downloads ilimitados + acesso antecipado", highlight: true, active: true, sort_order: 2 },
];

function BalcaoPrecos() {
  const [items, setItems] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<PriceRow | null>(null);
  const [form, setForm] = useState<Omit<PriceRow, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("Todas");
  const [importing, setImporting] = useState(false);

  async function handleImportDefaults() {
    if (!confirm(`Importar ${DEFAULT_PRICES.length} preços padrão? Serão adicionados à lista actual (sem apagar os existentes).`)) return;
    setImporting(true);
    const { data, error } = await (supabase as any).from("prices").insert(DEFAULT_PRICES).select();
    if (error) { toast.error("Erro ao importar: " + error.message); }
    else { setItems((prev) => [...prev, ...(data as PriceRow[])]); toast.success(`${DEFAULT_PRICES.length} preços importados com sucesso!`); }
    setImporting(false);
  }

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("prices")
      .select("*")
      .order("category")
      .order("sort_order");
    setItems((data as PriceRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ ...EMPTY, sort_order: items.length });
    setSelected(null);
    setModal("add");
  }

  function openEdit(p: PriceRow) {
    setForm({
      category: p.category, name: p.name, price: p.price,
      price_label: p.price_label, unit: p.unit, description: p.description,
      highlight: p.highlight, active: p.active, sort_order: p.sort_order,
    });
    setSelected(p);
    setModal("edit");
  }

  function closeModal() { setModal(null); setSelected(null); }

  function field<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);

    const payload = {
      ...form,
      name: form.name.trim(),
      price: form.price !== null && form.price !== undefined ? Number(form.price) : null,
      price_label: form.price !== null && form.price !== undefined
        ? `${Number(form.price).toLocaleString("pt-MZ")} MZN`
        : form.price_label || "Orçamento",
      description: form.description?.trim() || null,
    };

    if (modal === "add") {
      const { data, error } = await (supabase as any).from("prices").insert(payload).select().single();
      if (error) { toast.error("Erro ao criar: " + error.message); }
      else { setItems((prev) => [...prev, data as PriceRow]); toast.success("Preço criado!"); closeModal(); }
    } else if (selected) {
      const { error } = await (supabase as any).from("prices").update(payload).eq("id", selected.id);
      if (error) { toast.error("Erro ao guardar: " + error.message); }
      else {
        setItems((prev) => prev.map((p) => p.id === selected.id ? { ...p, ...payload } : p));
        toast.success("Preço actualizado!");
        closeModal();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este preço?")) return;
    const { error } = await (supabase as any).from("prices").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); return; }
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Preço eliminado.");
  }

  async function toggleActive(p: PriceRow) {
    const { error } = await (supabase as any).from("prices").update({ active: !p.active }).eq("id", p.id);
    if (!error) setItems((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x));
  }

  async function toggleHighlight(p: PriceRow) {
    const { error } = await (supabase as any).from("prices").update({ highlight: !p.highlight }).eq("id", p.id);
    if (!error) setItems((prev) => prev.map((x) => x.id === p.id ? { ...x, highlight: !x.highlight } : x));
  }

  const allCategories = ["Todas", ...Array.from(new Set(items.map((p) => p.category)))];
  const filtered = filterCat === "Todas" ? items : items.filter((p) => p.category === filterCat);

  // Group by category for display
  const groups = filtered.reduce<Record<string, PriceRow[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-gold" /> Gestão de Preços
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.filter((p) => p.active).length} activos · {items.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <button
              onClick={handleImportDefaults}
              disabled={importing}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Importar preços padrão
            </button>
          )}
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-card"
          >
            <Plus className="h-4 w-4" /> Novo preço
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {allCategories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth border ${
              filterCat === c ? "bg-brand text-brand-foreground border-brand" : "border-border text-foreground/70 hover:border-brand/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 rounded-2xl border-2 border-dashed border-border">
          <DollarSign className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-medium">Sem preços ainda</p>
          <button onClick={openAdd} className="mt-3 text-sm text-brand hover:underline">+ Adicionar primeiro preço</button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([cat, rows]) => (
            <div key={cat} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-brand">{cat}</h3>
                <span className="text-xs text-muted-foreground">{rows.length} item(s)</span>
              </div>
              <div className="divide-y divide-border">
                {rows.map((p) => (
                  <div key={p.id} className={`flex items-center gap-4 px-5 py-3 transition-smooth hover:bg-muted/20 ${!p.active ? "opacity-50" : ""}`}>
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{p.name}</span>
                        {p.highlight && <Star className="h-3.5 w-3.5 text-gold fill-gold" />}
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-brand text-sm">
                        {p.price !== null ? `${Number(p.price).toLocaleString("pt-MZ")} MZN` : "Orçamento"}
                      </p>
                      {p.unit && <p className="text-[10px] text-muted-foreground">{p.unit}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleActive(p)} title={p.active ? "Desactivar" : "Activar"}>
                        {p.active
                          ? <ToggleRight className="h-5 w-5 text-green-500" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => toggleHighlight(p)}>
                        <Star className={`h-4 w-4 ${p.highlight ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-brand">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="rounded p-1.5 hover:bg-red-50 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg">{modal === "add" ? "Novo preço" : "Editar preço"}</h2>
              <button onClick={closeModal}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</label>
                <div className="relative mt-1">
                  <select value={form.category} onChange={(e) => field("category", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome do serviço *</label>
                <input value={form.name} onChange={(e) => field("name", e.target.value)}
                  placeholder="Ex: Impressão Preto & Branco"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>

              {/* Price + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preço (MZN)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.price ?? ""}
                    onChange={(e) => field("price", e.target.value === "" ? null : parseFloat(e.target.value))}
                    placeholder="Deixar vazio = Orçamento"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Vazio = "Sob orçamento"</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unidade</label>
                  <input value={form.unit} onChange={(e) => field("unit", e.target.value)}
                    placeholder="por página, por trabalho..."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota / descrição</label>
                <textarea value={form.description ?? ""} onChange={(e) => field("description", e.target.value || null)}
                  rows={2} placeholder="Informação adicional (opcional)"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.highlight} onChange={(e) => field("highlight", e.target.checked)} className="accent-yellow-500" />
                  <Star className="h-3.5 w-3.5 text-gold" /> Destaque
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => field("active", e.target.checked)} className="accent-green-500" />
                  Activo
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {modal === "add" ? "Criar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

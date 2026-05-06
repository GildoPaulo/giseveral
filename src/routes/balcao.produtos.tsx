import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Star, Tag, Search,
  X, Loader2, Package, ImageOff, ToggleLeft, ToggleRight, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/balcao/produtos")({
  component: BalcaoProdutos,
});

type Category = { id: string; name: string; type: string };

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  unit: string;
  brand: string | null;
  image_url: string | null;
  featured: boolean;
  active: boolean;
  category_id: string | null;
  specs: Record<string, unknown>;
  product_categories: { name: string; type: string } | null;
};

type ProductForm = {
  name: string;
  category_id: string;
  description: string;
  price: string;
  compare_price: string;
  stock: string;
  unit: string;
  brand: string;
  image_url: string;
  featured: boolean;
  active: boolean;
};

const emptyForm: ProductForm = {
  name: "", category_id: "", description: "", price: "",
  compare_price: "", stock: "0", unit: "un", brand: "",
  image_url: "", featured: false, active: true,
};

function discount(price: number, comparePrice: number | null) {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function BalcaoProdutos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  // Modal state
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase
        .from("products")
        .select("*, product_categories(name, type)")
        .order("name"),
      supabase.from("product_categories").select("id, name, type").order("sort_order"),
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts((prods ?? []) as Product[]);
      setCategories(cats ?? []);
      setLoading(false);
    });
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setSelected(null);
    setModal("add");
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      category_id: p.category_id ?? "",
      description: p.description ?? "",
      price: String(p.price),
      compare_price: p.compare_price ? String(p.compare_price) : "",
      stock: String(p.stock),
      unit: p.unit,
      brand: p.brand ?? "",
      image_url: p.image_url ?? "",
      featured: p.featured,
      active: p.active,
    });
    setSelected(p);
    setModal("edit");
  }

  function openDelete(p: Product) {
    setSelected(p);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
  }

  function fieldChange(key: keyof ProductForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error("Preço inválido"); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      stock: parseInt(form.stock) || 0,
      unit: form.unit.trim() || "un",
      brand: form.brand.trim() || null,
      image_url: form.image_url.trim() || null,
      featured: form.featured,
      active: form.active,
    };

    if (modal === "add") {
      const { data, error } = await supabase.from("products").insert(payload).select("*, product_categories(name, type)").single();
      if (error) { toast.error("Erro ao criar produto"); }
      else {
        toast.success("Produto criado");
        setProducts((prev) => [...prev, data as Product].sort((a, b) => a.name.localeCompare(b.name)));
        closeModal();
      }
    } else if (modal === "edit" && selected) {
      const { error } = await supabase.from("products").update(payload).eq("id", selected.id);
      if (error) { toast.error("Erro ao guardar"); }
      else {
        toast.success("Produto actualizado");
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selected.id
              ? { ...p, ...payload, product_categories: categories.find((c) => c.id === payload.category_id) ? { name: categories.find((c) => c.id === payload.category_id)!.name, type: categories.find((c) => c.id === payload.category_id)!.type } : p.product_categories }
              : p
          )
        );
        closeModal();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("products").update({ active: false }).eq("id", selected.id);
    if (error) { toast.error("Erro ao desactivar"); }
    else {
      toast.success("Produto desactivado");
      setProducts((prev) => prev.map((p) => p.id === selected.id ? { ...p, active: false } : p));
      closeModal();
    }
    setSaving(false);
  }

  async function toggleFeatured(p: Product) {
    const { error } = await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id);
    if (!error) {
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, featured: !x.featured } : x));
      toast.success(p.featured ? "Destaque removido" : "Produto em destaque!");
    }
  }


  async function toggleActive(p: Product) {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (!error) {
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x));
    }
  }

  const filtered = products.filter((p) => {
    const matchQ = !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(q.toLowerCase());
    const matchCat = filterCat === "all" || p.category_id === filterCat;
    return matchQ && matchCat;
  });

  const featuredCount = products.filter((p) => p.featured && p.active).length;
  const promoCount = products.filter((p) => p.compare_price && p.compare_price > p.price && p.active).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {products.filter((p) => p.active).length} activos · {featuredCount} em destaque · {promoCount} em promoção
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-card"
        >
          <Plus className="h-4 w-4" /> Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div className="relative">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="appearance-none rounded-md border border-border bg-background px-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 w-28 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const disc = discount(p.price, p.compare_price);
                  return (
                    <tr key={p.id} className={`transition-smooth hover:bg-muted/20 ${!p.active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{p.name}</span>
                              {p.featured && (
                                <Star className="h-3.5 w-3.5 text-gold fill-gold flex-shrink-0" title="Em destaque" />
                              )}
                            </div>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {p.product_categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <span className="font-bold text-brand">
                            {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                          </span>
                          {p.compare_price && p.compare_price > p.price && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-xs text-muted-foreground line-through">
                                {p.compare_price.toLocaleString("pt-MZ")}
                              </span>
                              {disc && (
                                <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1">-{disc}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock <= 5 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Active toggle */}
                          <button onClick={() => toggleActive(p)} title={p.active ? "Desactivar" : "Activar"}>
                            {p.active
                              ? <ToggleRight className="h-5 w-5 text-green-500" />
                              : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                          </button>
                          {/* Featured toggle */}
                          <button onClick={() => toggleFeatured(p)} title={p.featured ? "Remover destaque" : "Colocar em destaque"}>
                            <Star className={`h-4 w-4 ${p.featured ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-brand transition-smooth"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDelete(p)}
                            className="rounded p-1.5 hover:bg-red-50 text-muted-foreground hover:text-destructive transition-smooth"
                            title="Desactivar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 flex flex-col items-center">
              <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-lg text-foreground">
                {modal === "add" ? "Novo Produto" : "Editar Produto"}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Row 1: Name + Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => fieldChange("name", e.target.value)}
                    placeholder="Caderno Universitário 96 fls"
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Categoria</label>
                  <div className="relative mt-1">
                    <select
                      value={form.category_id}
                      onChange={(e) => fieldChange("category_id", e.target.value)}
                      className="w-full appearance-none rounded-md border border-border bg-muted/30 px-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => fieldChange("description", html)}
                  label="Descrição"
                  hint="Adicione texto rico, imagens e links à descrição do produto."
                  placeholder="Descreva o produto com mais detalhes..."
                  bucket="images"
                  folder="produtos"
                />
              </div>

              {/* Row 3: Price + Promo price */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Preço (MZN) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => fieldChange("price", e.target.value)}
                    placeholder="120.00"
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1">
                    <Tag className="h-3 w-3 text-red-500" /> Preço Promo (MZN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compare_price}
                    onChange={(e) => fieldChange("compare_price", e.target.value)}
                    placeholder="150.00 (preço original)"
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Preço original antes do desconto</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => fieldChange("stock", e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              {/* Row 4: Brand + Unit */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Marca</label>
                  <input
                    value={form.brand}
                    onChange={(e) => fieldChange("brand", e.target.value)}
                    placeholder="BIC, Unilux, Chamex..."
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Unidade</label>
                  <input
                    value={form.unit}
                    onChange={(e) => fieldChange("unit", e.target.value)}
                    placeholder="un, cx, rs..."
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              {/* Row 5: Image */}
              <ImageUpload
                label="Imagem do Produto"
                value={form.image_url}
                onChange={(url) => fieldChange("image_url", url)}
                bucket="images"
                folder="products"
              />

              {/* Row 6: Toggles */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => fieldChange("featured", e.target.checked)}
                    className="h-4 w-4 accent-yellow-500"
                  />
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-gold" /> Produto em Destaque
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => fieldChange("active", e.target.checked)}
                    className="h-4 w-4 accent-green-500"
                  />
                  <span className="text-sm font-medium text-foreground">Produto Activo (visível na loja)</span>
                </label>
              </div>

              {/* Promo preview */}
              {form.price && form.compare_price && parseFloat(form.compare_price) > parseFloat(form.price) && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-4 py-3 flex items-center gap-3">
                  <Tag className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Promoção: -{discount(parseFloat(form.price), parseFloat(form.compare_price))}% de desconto
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      De {parseFloat(form.compare_price).toLocaleString("pt-MZ")} MZN para {parseFloat(form.price).toLocaleString("pt-MZ")} MZN
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={closeModal} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {modal === "add" ? "Criar Produto" : "Guardar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {modal === "delete" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-2xl bg-background border border-border shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-destructive mx-auto mb-4">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-center font-bold text-foreground">Desactivar produto?</h3>
            <p className="mt-2 text-sm text-center text-muted-foreground">
              "<strong>{selected.name}</strong>" ficará invisível na loja. Podes reactivá-lo mais tarde.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={closeModal} className="flex-1 rounded-md border border-border py-2 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 rounded-md bg-destructive text-destructive-foreground py-2 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "..." : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

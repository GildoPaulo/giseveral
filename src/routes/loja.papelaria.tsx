import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Search, SlidersHorizontal, X, ShoppingCart, GitCompare,
  ChevronDown, ShoppingBag, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, PageHero } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const searchSchema = z.object({
  categoria: z.string().optional(),
  tipo: z.string().optional(),
  q: z.string().optional(),
  ordem: z.string().optional(),
});

export const Route = createFileRoute("/loja/papelaria")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Papelaria – Loja Giseveral" },
      { name: "description", content: "Compre cadernos, canetas, pastas e muito mais. Compare produtos e escolha a melhor opção." },
    ],
  }),
  component: Papelaria,
});

type Product = Tables<"products"> & {
  product_categories: { name: string; slug: string; type: string } | null;
};

type Category = Tables<"product_categories">;

function stockLabel(stock: number) {
  if (stock > 5) return { text: "Em stock", cls: "bg-green-100 text-green-700" };
  if (stock > 0) return { text: "Pouco stock", cls: "bg-yellow-100 text-yellow-700" };
  return { text: "Esgotado", cls: "bg-red-100 text-red-600" };
}

function Papelaria() {
  const { categoria, tipo, q: qParam, ordem: ordemParam } = Route.useSearch();
  const { addItem, compareIds, addToCompare, removeFromCompare } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(qParam ?? "");
  const [selectedCat, setSelectedCat] = useState<string>(categoria ?? "all");
  const [selectedType, setSelectedType] = useState<string>(tipo ?? "all");
  const [ordem, setOrdem] = useState<string>(ordemParam ?? "default");
  const [showCompare, setShowCompare] = useState(false);
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      supabase
        .from("products")
        .select("*, product_categories(name, slug, type)")
        .eq("active", true),
      supabase
        .from("product_categories")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts((prods as Product[]) ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (compareIds.length === 0) {
      setShowCompare(false);
      setCompareProducts([]);
      return;
    }
    setCompareProducts(products.filter((p) => compareIds.includes(p.id)));
  }, [compareIds, products]);

  const filtered = useMemo(() => {
    let result = products;

    if (selectedType !== "all") {
      result = result.filter((p) => p.product_categories?.type === selectedType);
    }
    if (selectedCat !== "all") {
      result = result.filter((p) => p.product_categories?.slug === selectedCat);
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.brand?.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }
    if (ordem === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (ordem === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    if (ordem === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, selectedCat, selectedType, q, ordem]);

  const handleAdd = (p: Product) => {
    addItem({ id: p.id, type: "produto", productId: p.id, name: p.name, price: p.price, unit: p.unit, brand: p.brand ?? undefined, image: p.image_url ?? undefined });
    toast.success(`"${p.name}" adicionado ao carrinho`);
  };

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      removeFromCompare(id);
    } else {
      if (compareIds.length >= 3) {
        toast.error("Podes comparar no máximo 3 produtos");
        return;
      }
      addToCompare(id);
      if (compareIds.length + 1 >= 2) setShowCompare(true);
    }
  };

  const productCats = categories.filter((c) => c.type === "produto");
  const serviceCats = categories.filter((c) => c.type === "servico");
  const activeCats = selectedType === "servico" ? serviceCats : selectedType === "produto" ? productCats : categories;

  return (
    <Layout>
      <PageHero title="Papelaria & Serviços" subtitle="Pesquise, compare e adicione ao carrinho." />

      <div className="container mx-auto px-4 py-8">
        {/* Filters bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar produto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setSelectedCat("all"); }}
              className="appearance-none rounded-md border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
            >
              <option value="all">Todos os tipos</option>
              <option value="produto">Produtos</option>
              <option value="servico">Serviços</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="appearance-none rounded-md border border-border bg-background px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
            >
              <option value="all">Todas as categorias</option>
              {activeCats.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="appearance-none rounded-md border border-border bg-background px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
            >
              <option value="default">Ordenar por</option>
              <option value="price-asc">Preço: menor primeiro</option>
              <option value="price-desc">Preço: maior primeiro</option>
              <option value="name">Nome A–Z</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Compare bar */}
        {compareIds.length >= 2 && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3">
            <GitCompare className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">{compareIds.length} produtos selecionados para comparar</span>
            <button
              onClick={() => setShowCompare(true)}
              className="ml-auto rounded-md bg-gradient-gold px-4 py-1.5 text-xs font-semibold text-gold-foreground"
            >
              Comparar agora
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="mb-4 text-sm text-muted-foreground">
          {loading ? "A carregar..." : `${filtered.length} produto${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                <div className="aspect-square bg-muted rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado com esses filtros.</p>
            <button
              onClick={() => { setQ(""); setSelectedCat("all"); setSelectedType("all"); }}
              className="mt-4 text-sm font-medium text-brand hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const { text: stockText, cls: stockCls } = stockLabel(p.stock);
              const inCompare = compareIds.includes(p.id);
              const specs = p.specs as Record<string, string | number>;

              return (
                <div
                  key={p.id}
                  className={`group rounded-xl border bg-card shadow-card transition-smooth hover:shadow-elegant flex flex-col ${inCompare ? "border-gold/60 ring-1 ring-gold/30" : "border-border"}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-xl bg-muted flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                    )}
                    {/* Compare checkbox */}
                    <button
                      onClick={() => toggleCompare(p.id)}
                      title={inCompare ? "Remover da comparação" : "Adicionar à comparação"}
                      className={`absolute top-2 right-2 rounded-md p-1.5 text-xs font-medium transition-smooth ${inCompare ? "bg-gold text-gold-foreground" : "bg-background/80 text-foreground hover:bg-gold/20"}`}
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {p.product_categories && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                        {p.product_categories.name}
                      </span>
                    )}
                    <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-2 flex-1">{p.name}</h3>
                    {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}

                    {/* Key specs */}
                    {Object.keys(specs).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(specs).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-brand">
                          {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/{p.unit}</span>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${stockCls}`}>
                        {stockText}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAdd(p)}
                      disabled={p.stock === 0}
                      className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-md bg-gradient-brand py-2 text-xs font-semibold text-brand-foreground transition-smooth hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison modal */}
      {showCompare && compareProducts.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-background shadow-2xl overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-brand flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-gold" /> Comparação de Produtos
              </h2>
              <button onClick={() => setShowCompare(false)} className="rounded-md p-1.5 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-32">Característica</th>
                    {compareProducts.map((p) => (
                      <th key={p.id} className="text-left py-2 px-4">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        {p.brand && <div className="text-xs text-muted-foreground font-normal">{p.brand}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 pr-4 text-muted-foreground">Preço</td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4 font-bold text-brand">
                        {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-muted-foreground">Stock</td>
                    {compareProducts.map((p) => {
                      const { text, cls } = stockLabel(p.stock);
                      return (
                        <td key={p.id} className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{text}</span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-muted-foreground">Unidade</td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.unit}</td>
                    ))}
                  </tr>
                  {/* Dynamic specs comparison */}
                  {(() => {
                    const allKeys = new Set<string>();
                    compareProducts.forEach((p) => {
                      Object.keys(p.specs as object).forEach((k) => allKeys.add(k));
                    });
                    return Array.from(allKeys).map((key) => (
                      <tr key={key}>
                        <td className="py-3 pr-4 text-muted-foreground capitalize">{key}</td>
                        {compareProducts.map((p) => {
                          const val = (p.specs as Record<string, unknown>)[key];
                          return (
                            <td key={p.id} className="py-3 px-4">
                              {val !== undefined ? String(val) : <span className="text-muted-foreground/40">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                  <tr>
                    <td className="py-3 pr-4" />
                    {compareProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        <button
                          onClick={() => { handleAdd(p); setShowCompare(false); }}
                          disabled={p.stock === 0}
                          className="flex items-center gap-1.5 rounded-md bg-gradient-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Escolher
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

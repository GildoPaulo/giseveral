import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Search, X, ShoppingCart, GitCompare,
  ShoppingBag, CheckCircle2, Eye, SlidersHorizontal, ArrowUpDown,
} from "lucide-react";
import { PedidoRapidoButton } from "@/components/PedidoRapido";
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
  if (stock > 5) return { text: "Em stock", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  if (stock > 0) return { text: "Pouco stock", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  return { text: "Esgotado", cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" };
}

const SORT_OPTIONS = [
  { value: "default",    label: "Relevância" },
  { value: "price-asc",  label: "Preço: menor" },
  { value: "price-desc", label: "Preço: maior" },
  { value: "name",       label: "Nome A–Z" },
];

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-smooth whitespace-nowrap ${
        active
          ? "bg-gradient-brand text-brand-foreground shadow-card"
          : "border border-border bg-background text-muted-foreground hover:border-gold/50 hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
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
      supabase.from("products").select("*, product_categories(name, slug, type)").eq("active", true),
      supabase.from("product_categories").select("*").eq("active", true).order("sort_order"),
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts((prods as Product[]) ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (compareIds.length === 0) { setShowCompare(false); setCompareProducts([]); return; }
    setCompareProducts(products.filter((p) => compareIds.includes(p.id)));
  }, [compareIds, products]);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedType !== "all") result = result.filter((p) => p.product_categories?.type === selectedType);
    if (selectedCat !== "all") result = result.filter((p) => p.product_categories?.slug === selectedCat);
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter((p) =>
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
    if (compareIds.includes(id)) { removeFromCompare(id); return; }
    if (compareIds.length >= 3) { toast.error("Podes comparar no máximo 3 produtos"); return; }
    addToCompare(id);
    if (compareIds.length + 1 >= 2) setShowCompare(true);
  };

  const productCats = categories.filter((c) => c.type === "produto");
  const serviceCats = categories.filter((c) => c.type === "servico");
  const activeCats = selectedType === "servico" ? serviceCats : selectedType === "produto" ? productCats : categories;

  const typePills = [
    { value: "all",     label: "Todos" },
    { value: "produto", label: "Produtos" },
    { value: "servico", label: "Serviços" },
  ];

  return (
    <Layout>
      <PageHero title="Papelaria & Serviços" subtitle="Pesquise, compare e adicione ao carrinho." />

      <div className="container mx-auto px-4 py-8">

        {/* Search + sort row */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar produto ou serviço..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Sort */}
          <div className="relative flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm cursor-pointer">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="appearance-none bg-transparent text-sm focus:outline-none cursor-pointer pr-1"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground mt-1.5 flex-shrink-0" />
          {typePills.map((p) => (
            <Pill
              key={p.value}
              active={selectedType === p.value}
              onClick={() => { setSelectedType(p.value); setSelectedCat("all"); }}
            >
              {p.label}
            </Pill>
          ))}
        </div>

        {/* Category pills */}
        {activeCats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="w-4 flex-shrink-0" />
            <Pill active={selectedCat === "all"} onClick={() => setSelectedCat("all")}>
              Todas as categorias
            </Pill>
            {activeCats.map((c) => (
              <Pill
                key={c.id}
                active={selectedCat === c.slug}
                onClick={() => setSelectedCat(c.slug)}
              >
                {c.name}
              </Pill>
            ))}
          </div>
        )}

        {/* Compare bar */}
        {compareIds.length >= 2 && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3">
            <GitCompare className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">{compareIds.length} produtos para comparar</span>
            <button
              onClick={() => setShowCompare(true)}
              className="ml-auto rounded-md bg-gradient-gold px-4 py-1.5 text-xs font-semibold text-gold-foreground"
            >
              Comparar agora
            </button>
          </div>
        )}

        {/* Results count + clear */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {loading ? "A carregar..." : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
          </p>
          {(selectedCat !== "all" || selectedType !== "all" || q) && (
            <button
              onClick={() => { setQ(""); setSelectedCat("all"); setSelectedType("all"); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card animate-pulse">
                <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <p className="font-semibold text-foreground">Nenhum resultado encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tenta outros filtros ou pesquisa.</p>
            <button
              onClick={() => { setQ(""); setSelectedCat("all"); setSelectedType("all"); }}
              className="mt-4 text-sm font-medium text-brand hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const { text: stockText, cls: stockCls } = stockLabel(p.stock);
              const inCompare = compareIds.includes(p.id);
              const specs = p.specs as Record<string, string | number>;

              return (
                <div
                  key={p.id}
                  className={`group rounded-2xl border bg-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant flex flex-col ${inCompare ? "border-gold/60 ring-1 ring-gold/30" : "border-border"}`}
                >
                  {/* Image */}
                  <Link
                    to="/loja/produto/$id"
                    params={{ id: p.id }}
                    className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-muted flex items-center justify-center"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-smooth duration-500" />
                    ) : (
                      <ShoppingBag className="h-14 w-14 text-muted-foreground/20" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-smooth flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-smooth flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow">
                        <Eye className="h-3.5 w-3.5" /> Ver produto
                      </span>
                    </div>
                    {/* Stock badge */}
                    <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${stockCls}`}>
                      {stockText}
                    </span>
                    {/* Compare button */}
                    <button
                      onClick={(e) => { e.preventDefault(); toggleCompare(p.id); }}
                      title={inCompare ? "Remover" : "Comparar"}
                      className={`absolute top-3 right-3 rounded-lg p-1.5 transition-smooth z-10 ${inCompare ? "bg-gold text-gold-foreground" : "bg-background/80 text-foreground hover:bg-gold/20"}`}
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                    </button>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    {p.product_categories && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                        {p.product_categories.name}
                      </span>
                    )}
                    <Link to="/loja/produto/$id" params={{ id: p.id }}>
                      <h3 className="mt-1 font-semibold text-foreground line-clamp-2 hover:text-brand transition-colors leading-snug">
                        {p.name}
                      </h3>
                    </Link>
                    {p.brand && <p className="mt-0.5 text-xs text-muted-foreground">{p.brand}</p>}

                    {/* Specs */}
                    {Object.keys(specs).length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {Object.entries(specs).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        {p.compare_price && p.compare_price > p.price && (
                          <span className="block text-xs line-through text-muted-foreground">
                            {p.compare_price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                          </span>
                        )}
                        <span className="text-xl font-bold text-brand">
                          {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">MZN/{p.unit}</span>
                      </div>
                      {p.compare_price && p.compare_price > p.price && (
                        <span className="text-xs font-bold rounded-md bg-red-100 text-red-600 px-2 py-0.5">
                          -{Math.round(((p.compare_price - p.price) / p.compare_price) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={p.stock === 0}
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-brand-foreground transition-smooth hover:shadow-card disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {p.stock === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
                      </button>
                      <PedidoRapidoButton productName={p.name} productId={p.id} productPrice={p.price} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison modal */}
      {showCompare && compareProducts.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowCompare(false)}>
          <div className="w-full max-w-4xl rounded-2xl bg-background shadow-2xl overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
                  {[
                    { label: "Preço", render: (p: Product) => <span className="font-bold text-brand">{p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span> },
                    { label: "Stock", render: (p: Product) => { const { text, cls } = stockLabel(p.stock); return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{text}</span>; } },
                    { label: "Unidade", render: (p: Product) => p.unit },
                  ].map(({ label, render }) => (
                    <tr key={label}>
                      <td className="py-3 pr-4 text-muted-foreground">{label}</td>
                      {compareProducts.map((p) => <td key={p.id} className="py-3 px-4">{render(p)}</td>)}
                    </tr>
                  ))}
                  {(() => {
                    const allKeys = new Set<string>();
                    compareProducts.forEach((p) => Object.keys(p.specs as object).forEach((k) => allKeys.add(k)));
                    return Array.from(allKeys).map((key) => (
                      <tr key={key}>
                        <td className="py-3 pr-4 text-muted-foreground capitalize">{key}</td>
                        {compareProducts.map((p) => {
                          const val = (p.specs as Record<string, unknown>)[key];
                          return <td key={p.id} className="py-3 px-4">{val !== undefined ? String(val) : <span className="text-muted-foreground/40">—</span>}</td>;
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
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-50"
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

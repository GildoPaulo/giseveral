import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Minus, Save, Search, AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/stock")({
  component: BalcaoStock,
});

type Product = {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  unit: string;
  active: boolean;
  product_categories: { name: string } | null;
};

function BalcaoStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, brand, price, stock, unit, active, product_categories(name)")
      .order("name")
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter((p) =>
    !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase())
  );

  const getStock = (id: string, original: number) => edits[id] ?? original;

  const adjust = (id: string, original: number, delta: number) => {
    const current = getStock(id, original);
    setEdits((prev) => ({ ...prev, [id]: Math.max(0, current + delta) }));
  };

  const setDirect = (id: string, value: string) => {
    const n = parseInt(value);
    if (!isNaN(n) && n >= 0) setEdits((prev) => ({ ...prev, [id]: n }));
  };

  const save = async (id: string, original: number) => {
    const newStock = getStock(id, original);
    if (newStock === original) return;
    setSaving(id);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id);
    if (error) { toast.error("Erro ao guardar stock"); }
    else {
      toast.success("Stock actualizado");
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p));
      setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
    setSaving(null);
  };

  const hasChanges = Object.keys(edits).length > 0;

  const saveAll = async () => {
    const ids = Object.keys(edits);
    for (const id of ids) {
      const product = products.find((p) => p.id === id);
      if (!product) continue;
      await save(id, product.stock);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Stock</h1>
        {hasChanges && (
          <button
            onClick={saveAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground"
          >
            <Save className="h-4 w-4" /> Guardar tudo ({Object.keys(edits).length})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar produto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {/* Low stock notice */}
      {products.filter((p) => p.stock <= 5 && p.stock > 0).length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {products.filter((p) => p.stock <= 5 && p.stock > 0).length} produto(s) com stock baixo (≤5 unidades)
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">Ajustar</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const currentStock = getStock(p.id, p.stock);
                  const changed = edits[p.id] !== undefined && edits[p.id] !== p.stock;
                  return (
                    <tr key={p.id} className={`hover:bg-muted/20 transition-smooth ${currentStock === 0 ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {p.product_categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block font-bold rounded px-2 py-0.5 text-xs ${currentStock === 0 ? "bg-red-100 text-red-600" : currentStock <= 5 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {currentStock} {p.unit}
                        </span>
                        {changed && (
                          <span className="block text-[10px] text-muted-foreground">era {p.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => adjust(p.id, p.stock, -1)}
                            className="rounded p-1 hover:bg-muted border border-border"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => setDirect(p.id, e.target.value)}
                            className="w-14 rounded border border-border bg-background px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand/30"
                          />
                          <button
                            onClick={() => adjust(p.id, p.stock, 1)}
                            className="rounded p-1 hover:bg-muted border border-border"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {changed && (
                          <button
                            onClick={() => save(p.id, p.stock)}
                            disabled={saving === p.id}
                            className="rounded-md bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-50"
                          >
                            {saving === p.id ? "..." : <Save className="h-3 w-3" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 flex flex-col items-center text-center">
              <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

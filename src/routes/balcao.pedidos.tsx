import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Search, RefreshCw, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/pedidos")({
  component: BalcaoPedidos,
});

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  neighborhood: string;
  delivery_type: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  order_items: { name: string; quantity: number; unit_price: number }[];
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pendente",      cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed:  { label: "Confirmado",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
  preparing:  { label: "Em preparação", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  delivering: { label: "Em entrega",    cls: "bg-purple-100 text-purple-700 border-purple-200" },
  delivered:  { label: "Entregue",      cls: "bg-green-100 text-green-700 border-green-200" },
  cancelled:  { label: "Cancelado",     cls: "bg-red-100 text-red-600 border-red-200" },
};

const nextStatus: Record<string, string> = {
  pending:    "confirmed",
  confirmed:  "preparing",
  preparing:  "delivering",
  delivering: "delivered",
};

function BalcaoPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    supabase
      .from("orders")
      .select("*, order_items(name, quantity, unit_price)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setOrders((data ?? []) as Order[]);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (q.trim()) {
      const lower = q.toLowerCase();
      return o.order_number.toLowerCase().includes(lower) || o.customer_name.toLowerCase().includes(lower) || o.customer_phone.includes(q);
    }
    return true;
  });

  const advanceStatus = async (order: Order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    setUpdating(order.id);
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", order.id);
    if (error) { toast.error("Erro ao actualizar status"); }
    else {
      toast.success(`Pedido ${order.order_number} → ${statusConfig[next]?.label}`);
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: next } : o));
    }
    setUpdating(null);
  };

  const cancelOrder = async (id: string, orderNumber: string) => {
    if (!confirm(`Cancelar pedido ${orderNumber}?`)) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast.error("Erro ao cancelar"); }
    else {
      toast.success("Pedido cancelado");
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" } : o));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar pedido, cliente..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-md border border-border bg-background px-3 pr-8 py-2 text-sm focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os estados</option>
            {Object.entries(statusConfig).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const st = statusConfig[order.status] ?? statusConfig.pending;
            const isExpanded = expanded === order.id;
            const canAdvance = !!nextStatus[order.status];

            return (
              <div key={order.id} className={`rounded-xl border bg-card shadow-card overflow-hidden ${st.cls.split(" ").find((c) => c.startsWith("border")) ?? "border-border"}`}>
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-brand text-sm">{order.order_number}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${st.cls}`}>{st.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {order.delivery_type === "delivery" ? "Entrega" : "Levantamento"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{order.customer_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{order.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${order.customer_phone}`} className="hover:text-brand">{order.customer_phone}</a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {order.neighborhood}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Itens:</p>
                      <div className="space-y-1">
                        {order.order_items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span>{item.name} × {item.quantity}</span>
                            <span>{(item.unit_price * item.quantity).toLocaleString("pt-MZ")} MZN</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {canAdvance && (
                        <button
                          onClick={() => advanceStatus(order)}
                          disabled={updating === order.id}
                          className="rounded-md bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-50"
                        >
                          {updating === order.id ? "A actualizar..." : `→ ${statusConfig[nextStatus[order.status]]?.label}`}
                        </button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <button
                          onClick={() => cancelOrder(order.id, order.order_number)}
                          className="rounded-md border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      )}
                      <a
                        href={`https://wa.me/258${order.customer_phone.replace(/\D/g, "")}?text=Olá ${order.customer_name}, o seu pedido ${order.order_number} está ${statusConfig[order.status]?.label?.toLowerCase()}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

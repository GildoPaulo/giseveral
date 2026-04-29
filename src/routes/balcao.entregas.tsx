import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, MapPin, Phone, Clock, CheckCircle2, Package, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/entregas")({
  component: BalcaoEntregas,
});

type DeliveryOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  neighborhood: string;
  address: string | null;
  reference_point: string | null;
  status: string;
  total: number;
  delivery_fee: number;
  created_at: string;
  delivery_zones: { name: string; estimated_time: string | null } | null;
  order_items: { name: string; quantity: number }[];
};

const statusConfig: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  confirmed:  { label: "Confirmado",    cls: "bg-blue-100 text-blue-700",   icon: Package },
  preparing:  { label: "Em preparação", cls: "bg-orange-100 text-orange-700", icon: Clock },
  delivering: { label: "Em entrega",    cls: "bg-purple-100 text-purple-700", icon: Truck },
  delivered:  { label: "Entregue",      cls: "bg-green-100 text-green-700",   icon: CheckCircle2 },
};

function BalcaoEntregas() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "delivered">("active");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, neighborhood, address, reference_point, status, total, delivery_fee, created_at, delivery_zones(name, estimated_time), order_items(name, quantity)")
      .eq("delivery_type", "delivery")
      .not("status", "in", '("pending","cancelled")')
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as DeliveryOrder[]);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const advance = async (order: DeliveryOrder) => {
    const next: Record<string, string> = {
      confirmed: "preparing",
      preparing: "delivering",
      delivering: "delivered",
    };
    const nextStatus = next[order.status];
    if (!nextStatus) return;

    setUpdating(order.id);
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id);
    if (error) { toast.error("Erro ao actualizar"); }
    else {
      toast.success(`Pedido ${order.order_number} → ${statusConfig[nextStatus]?.label}`);
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o));
    }
    setUpdating(null);
  };

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const displayed = filter === "active" ? activeOrders : deliveredOrders;

  const grouped: Record<string, DeliveryOrder[]> = {};
  displayed.forEach((o) => {
    const zone = o.delivery_zones?.name ?? "Sem zona";
    if (!grouped[zone]) grouped[zone] = [];
    grouped[zone].push(o);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Em preparação", count: orders.filter((o) => o.status === "preparing").length, cls: "text-orange-600 bg-orange-50" },
          { label: "Em entrega",    count: orders.filter((o) => o.status === "delivering").length, cls: "text-purple-600 bg-purple-50" },
          { label: "Entregues hoje", count: orders.filter((o) => o.status === "delivered" && new Date(o.created_at).toDateString() === new Date().toDateString()).length, cls: "text-green-600 bg-green-50" },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`rounded-xl border border-border p-4 ${cls}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="inline-flex rounded-lg border border-border overflow-hidden">
        {(["active", "delivered"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-smooth ${filter === f ? "bg-gradient-brand text-brand-foreground" : "bg-background text-foreground/70 hover:bg-muted"}`}
          >
            {f === "active" ? `Activas (${activeOrders.length})` : `Entregues (${deliveredOrders.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Sem {filter === "active" ? "entregas activas" : "entregas concluídas"}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([zone, zoneOrders]) => (
            <div key={zone}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gold" />
                <h3 className="font-semibold text-foreground">{zone}</h3>
                <span className="text-xs text-muted-foreground">({zoneOrders.length} entrega{zoneOrders.length !== 1 ? "s" : ""})</span>
              </div>

              <div className="space-y-3 pl-6">
                {zoneOrders.map((order) => {
                  const st = statusConfig[order.status];
                  const StatusIcon = st?.icon ?? Truck;
                  const canAdvance = ["confirmed", "preparing", "delivering"].includes(order.status);

                  return (
                    <div key={order.id} className="rounded-xl border border-border bg-card shadow-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-brand text-sm">{order.order_number}</span>
                            {st && (
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold ${st.cls}`}>
                                <StatusIcon className="h-3 w-3" /> {st.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground mt-1">{order.customer_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-brand text-sm">
                            {order.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                          </p>
                          <p className="text-[10px] text-muted-foreground">Entrega: {order.delivery_fee.toLocaleString("pt-MZ")} MZN</p>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span>{order.neighborhood}{order.address ? ` · ${order.address}` : ""}</span>
                        </div>
                        {order.reference_point && (
                          <p className="pl-4 italic">"{order.reference_point}"</p>
                        )}
                        {order.delivery_zones?.estimated_time && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Tempo estimado: {order.delivery_zones.estimated_time}</span>
                          </div>
                        )}
                      </div>

                      {/* Items summary */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {order.order_items.slice(0, 3).map((item, i) => (
                          <span key={i}>{i > 0 ? " · " : ""}{item.name} ×{item.quantity}</span>
                        ))}
                        {order.order_items.length > 3 && <span> +{order.order_items.length - 3} mais</span>}
                      </div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        {canAdvance && (
                          <button
                            onClick={() => advance(order)}
                            disabled={updating === order.id}
                            className="rounded-md bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-50"
                          >
                            {updating === order.id ? "..." : order.status === "delivering" ? "Marcar Entregue" : order.status === "preparing" ? "Saiu para entrega" : "Iniciar Preparação"}
                          </button>
                        )}
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Phone className="h-3 w-3" /> {order.customer_phone}
                        </a>
                        <a
                          href={`https://wa.me/258${order.customer_phone.replace(/\D/g, "")}?text=Olá ${order.customer_name}! A sua encomenda ${order.order_number} está ${statusConfig[order.status]?.label?.toLowerCase()}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

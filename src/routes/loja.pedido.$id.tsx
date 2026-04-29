import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, Home, Phone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/loja/pedido/$id")({
  head: () => ({
    meta: [{ title: "Pedido Confirmado – Giseveral" }],
  }),
  component: PedidoConfirmado,
});

type Order = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  delivery_zones: Tables<"delivery_zones"> | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: "Pendente",       color: "text-yellow-600 bg-yellow-50",  icon: Clock },
  confirmed:  { label: "Confirmado",     color: "text-blue-600 bg-blue-50",      icon: CheckCircle2 },
  preparing:  { label: "Em preparação",  color: "text-orange-600 bg-orange-50",  icon: Package },
  delivering: { label: "Em entrega",     color: "text-purple-600 bg-purple-50",  icon: Truck },
  delivered:  { label: "Entregue",       color: "text-green-600 bg-green-50",    icon: Home },
  cancelled:  { label: "Cancelado",      color: "text-red-600 bg-red-50",        icon: CheckCircle2 },
};

function PedidoConfirmado() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*, order_items(*), delivery_zones(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setOrder(data as Order ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Pedido não encontrado.</p>
          <Link to="/loja" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">Voltar à loja</Link>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Success banner */}
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pedido Confirmado!</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            O teu pedido foi recebido com sucesso. Entraremos em contacto brevemente.
          </p>
        </div>

        {/* Order card */}
        <div className="rounded-xl border border-border bg-card shadow-card divide-y divide-border">
          {/* Header */}
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Número do Pedido</p>
              <p className="text-xl font-bold text-brand">{order.order_number}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
              <StatusIcon className="h-3.5 w-3.5" /> {statusInfo.label}
            </span>
          </div>

          {/* Items */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Itens do Pedido</h3>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                  <span className="font-medium">
                    {item.subtotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{order.subtotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Entrega</span>
                  <span>{order.delivery_fee.toLocaleString("pt-MZ")} MZN</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-brand">{order.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Informações de Entrega</h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Nome:</span> {order.customer_name}</p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${order.customer_phone}`} className="hover:text-brand">{order.customer_phone}</a>
              </p>
              <p>
                <span className="font-medium text-foreground">Tipo:</span>{" "}
                {order.delivery_type === "pickup" ? "Levantamento na loja" : "Entrega ao domicílio"}
              </p>
              <p>
                <span className="font-medium text-foreground">Bairro:</span> {order.neighborhood}
              </p>
              {order.delivery_zones && (
                <p>
                  <span className="font-medium text-foreground">Zona:</span> {order.delivery_zones.name}{" "}
                  <span className="text-xs">({order.delivery_zones.estimated_time})</span>
                </p>
              )}
              {order.reference_point && (
                <p><span className="font-medium text-foreground">Referência:</span> {order.reference_point}</p>
              )}
              <p>
                <span className="font-medium text-foreground">Pagamento:</span>{" "}
                {{ cash: "Dinheiro", mpesa: "M-Pesa", transfer: "Transferência" }[order.payment_method] ?? order.payment_method}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-6 rounded-xl bg-muted/50 border border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Para acompanhar o teu pedido, contacta-nos pelo
          </p>
          <a
            href="tel:+258874383621"
            className="mt-2 inline-flex items-center gap-2 text-base font-bold text-brand hover:underline"
          >
            <Phone className="h-4 w-4" /> +258 87 438 3621
          </a>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            to="/loja"
            className="rounded-md bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Voltar à Loja
          </Link>
          {order.customer_phone && (
            <a
              href={`https://wa.me/258874383621?text=Olá! O meu pedido é o ${order.order_number}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Contactar via WhatsApp
            </a>
          )}
        </div>
      </div>
    </Layout>
  );
}

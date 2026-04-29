import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Store, ChevronDown, Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, PageHero } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/loja/checkout")({
  head: () => ({
    meta: [{ title: "Finalizar Pedido – Giseveral" }],
  }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().min(2, "Nome obrigatório"),
  customer_phone: z.string().min(8, "Telefone obrigatório (mínimo 8 dígitos)"),
  customer_email: z.string().email("Email inválido").optional().or(z.literal("")),
  delivery_type: z.enum(["pickup", "delivery"]),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  address: z.string().optional(),
  reference_point: z.string().optional(),
  delivery_zone_id: z.string().optional(),
  payment_method: z.string().default("cash"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type DeliveryZone = Tables<"delivery_zones">;

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { delivery_type: "pickup", payment_method: "cash" },
  });

  const deliveryType = watch("delivery_type");
  const zoneId = watch("delivery_zone_id");

  useEffect(() => {
    supabase.from("delivery_zones").select("*").eq("active", true).then(({ data }) => setZones(data ?? []));
  }, []);

  useEffect(() => {
    const zone = zones.find((z) => z.id === zoneId) ?? null;
    setSelectedZone(zone);
  }, [zoneId, zones]);

  const deliveryFee = deliveryType === "delivery" ? (selectedZone?.fee ?? 0) : 0;
  const total = subtotal + deliveryFee;

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) {
      toast.error("O teu carrinho está vazio");
      return;
    }
    if (values.delivery_type === "delivery" && !values.delivery_zone_id) {
      toast.error("Seleciona a zona de entrega");
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          customer_name: values.customer_name,
          customer_phone: values.customer_phone,
          customer_email: values.customer_email || null,
          neighborhood: values.neighborhood,
          address: values.address || null,
          reference_point: values.reference_point || null,
          delivery_type: values.delivery_type,
          delivery_zone_id: values.delivery_zone_id || null,
          delivery_fee: deliveryFee,
          subtotal,
          total,
          payment_method: values.payment_method,
          notes: values.notes || null,
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Falha ao criar pedido");

      const orderItems = items.map((item) => ({
        order_id: order.id,
        item_type: item.type,
        product_id: item.productId ?? null,
        name: item.name,
        description: item.serviceDetails?.description ?? null,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      navigate({ to: "/loja/pedido/$id", params: { id: order.id } });
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <PageHero title="Finalizar Pedido" />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">O teu carrinho está vazio.</p>
          <Link to="/loja/papelaria" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            Voltar à loja
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero title="Finalizar Pedido" subtitle="Preenche os teus dados para confirmar o pedido." />

      <div className="container mx-auto px-4 py-10">
        <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer info */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-4">1. Os teus dados</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nome completo *</label>
                  <input
                    {...register("customer_name")}
                    placeholder="João Silva"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  {errors.customer_name && <p className="text-xs text-destructive mt-1">{errors.customer_name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Telefone *</label>
                  <input
                    {...register("customer_phone")}
                    placeholder="84 000 0000"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  {errors.customer_phone && <p className="text-xs text-destructive mt-1">{errors.customer_phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Email (opcional)</label>
                  <input
                    {...register("customer_email")}
                    type="email"
                    placeholder="joao@email.com"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>
            </section>

            {/* Delivery type */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-4">2. Entrega</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  { value: "pickup", label: "Levantar na loja", icon: Store, desc: "Gratuito – Av. das FPLM, Beira" },
                  { value: "delivery", label: "Entrega ao domicílio", icon: Truck, desc: "Taxa calculada por zona" },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-smooth ${deliveryType === value ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"}`}
                  >
                    <input type="radio" value={value} {...register("delivery_type")} className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
                        <Icon className="h-4 w-4" /> {label}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {deliveryType === "delivery" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="relative">
                    <label className="text-sm font-medium text-foreground">Zona de entrega *</label>
                    <select
                      {...register("delivery_zone_id")}
                      className="mt-1 w-full appearance-none rounded-md border border-border bg-background px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      <option value="">Seleccionar zona...</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} – {z.fee.toLocaleString("pt-MZ")} MZN ({z.estimated_time})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 bottom-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    {selectedZone && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Bairros: {selectedZone.neighborhoods.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Bairro / Zona *</label>
                  <input
                    {...register("neighborhood")}
                    placeholder="Ex: Munhava"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  {errors.neighborhood && <p className="text-xs text-destructive mt-1">{errors.neighborhood.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Rua / Endereço</label>
                  <input
                    {...register("address")}
                    placeholder="Rua Samora Machel, nº 25"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Ponto de referência</label>
                  <input
                    {...register("reference_point")}
                    placeholder="Ex: Perto da escola primária"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-4">3. Pagamento</h2>
              <div className="space-y-2">
                {[
                  { value: "cash", label: "Dinheiro na entrega / levantamento" },
                  { value: "mpesa", label: "M-Pesa (número será fornecido)" },
                  { value: "transfer", label: "Transferência bancária" },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value={value} {...register("payment_method")} />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Notes */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-3">4. Observações (opcional)</h2>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Instruções especiais, preferências de entrega..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </section>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card shadow-card p-6">
              <h2 className="font-bold text-brand mb-4">Resumo do Pedido</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-2">{item.name} ×{item.quantity}</span>
                    <span className="flex-shrink-0">
                      {(item.price * item.quantity).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{subtotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString("pt-MZ")} MZN` : "Grátis"}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-brand">{total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 flex items-center justify-center gap-2 w-full rounded-md bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> A processar...</>
                ) : (
                  "Confirmar Pedido"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}

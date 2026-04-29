import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Truck, Store, ChevronDown, Loader2, ShoppingBag,
  Upload, FileText, X, Printer, Palette,
} from "lucide-react";
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

const SERVICE_UPLOAD_CATEGORIES = ["impressao", "design-grafico"];
const ACCEPTED_TYPES = "application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_FILE_MB = 20;

function serviceNeedsFile(category?: string) {
  if (!category) return false;
  return SERVICE_UPLOAD_CATEGORIES.includes(category);
}

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileMap, setFileMap] = useState<Record<string, File>>({});

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

  const serviceItems = items.filter((i) => i.type === "servico");
  const uploadableItems = serviceItems.filter((i) => serviceNeedsFile(i.serviceDetails?.category));

  function handleFileSelect(itemId: string, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Ficheiro demasiado grande (máximo ${MAX_FILE_MB} MB)`);
      return;
    }
    setFileMap((prev) => ({ ...prev, [itemId]: file }));
  }

  function removeFile(itemId: string) {
    setFileMap((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  async function uploadFiles(orderId: string): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    const userId = user?.id ?? "anon";

    for (const [itemId, file] of Object.entries(fileMap)) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${orderId}/${itemId}.${ext}`;
      const { error } = await supabase.storage
        .from("service-uploads")
        .upload(path, file, { upsert: true });

      if (error) {
        toast.warning(`Ficheiro de "${items.find((i) => i.id === itemId)?.name}" não foi enviado — o pedido foi criado na mesma.`);
        continue;
      }

      const { data } = supabase.storage.from("service-uploads").getPublicUrl(path);
      urls[itemId] = data.publicUrl;
    }
    return urls;
  }

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

      // Upload ficheiros de serviços
      const fileUrls = Object.keys(fileMap).length > 0
        ? await uploadFiles(order.id)
        : {};

      const orderItems = items.map((item) => ({
        order_id: order.id,
        item_type: item.type,
        product_id: item.productId ?? null,
        name: item.name,
        description: item.serviceDetails?.description ?? null,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        file_url: fileUrls[item.id] ?? null,
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

            {/* 1. Customer info */}
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

            {/* 2. Service files — only shown if cart has impressão/design items */}
            {uploadableItems.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40 p-6">
                <h2 className="font-bold text-brand mb-1">2. Ficheiros dos Serviços</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Enviamos max. {MAX_FILE_MB} MB por ficheiro. Formatos aceites: PDF, Word, JPG, PNG.
                </p>
                <div className="space-y-4">
                  {uploadableItems.map((item) => {
                    const Icon = item.serviceDetails?.category === "impressao" ? Printer : Palette;
                    const uploaded = fileMap[item.id];
                    return (
                      <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-4 w-4 text-brand flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>

                        {uploaded ? (
                          <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 px-3 py-2">
                            <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-xs text-green-700 dark:text-green-400 flex-1 truncate">{uploaded.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {(uploaded.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(item.id)}
                              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-smooth">
                            <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">Clica para seleccionar o ficheiro</span>
                            <input
                              type="file"
                              accept={ACCEPTED_TYPES}
                              className="sr-only"
                              onChange={(e) => handleFileSelect(item.id, e.target.files?.[0])}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Delivery */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-4">
                {uploadableItems.length > 0 ? "3." : "2."} Entrega
              </h2>
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

            {/* 4. Payment */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-4">
                {uploadableItems.length > 0 ? "4." : "3."} Pagamento
              </h2>
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

            {/* 5. Notes */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-bold text-brand mb-3">
                {uploadableItems.length > 0 ? "5." : "4."} Observações (opcional)
              </h2>
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
                    <span className="truncate mr-2">
                      {item.name} ×{item.quantity}
                      {item.type === "servico" && fileMap[item.id] && (
                        <span className="ml-1 text-xs text-green-600">📎</span>
                      )}
                    </span>
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

              {uploadableItems.length > 0 && Object.keys(fileMap).length < uploadableItems.length && (
                <div className="mt-4 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-3 py-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Tens {uploadableItems.length - Object.keys(fileMap).length} serviço(s) sem ficheiro. Podes confirmar na mesma — envia o ficheiro por WhatsApp depois.
                  </p>
                </div>
              )}

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

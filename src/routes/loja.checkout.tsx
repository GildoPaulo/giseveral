import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Truck, Store, ChevronDown, Loader2, ShoppingBag,
  Upload, FileText, X, Printer, Palette, Shield,
  Clock, CreditCard, MessageCircle, RotateCcw, Calendar,
  CheckCircle2, User, MapPin, Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";
import { calculateCartShipping } from "@/services/shipping";

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
  desired_deadline: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type DeliveryZone = Tables<"delivery_zones">;

const SERVICE_UPLOAD_CATEGORIES = ["impressao", "design-grafico"];
const ACCEPTED_TYPES = "application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_FILE_MB = 20;

function serviceNeedsFile(category?: string) {
  return SERVICE_UPLOAD_CATEGORIES.includes(category ?? "");
}

const STEPS = [
  { icon: User,    label: "Dados" },
  { icon: Package, label: "Entrega" },
  { icon: CreditCard, label: "Pagamento" },
  { icon: CheckCircle2, label: "Confirmar" },
];

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-smooth ${
                done ? "border-gold bg-gold text-gold-foreground" :
                active ? "border-brand bg-brand text-brand-foreground" :
                "border-border bg-background text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-brand" : done ? "text-gold" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 md:w-20 h-0.5 mx-1 mb-4 ${i < current ? "bg-gold" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileMap, setFileMap] = useState<Record<string, File>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { delivery_type: "pickup", payment_method: "cash" },
  });

  const deliveryType = watch("delivery_type");
  const zoneId = watch("delivery_zone_id");
  const customerName = watch("customer_name");
  const customerPhone = watch("customer_phone");
  const neighborhood = watch("neighborhood");
  const address = watch("address");

  useEffect(() => {
    supabase.from("delivery_zones").select("*").eq("active", true).then(({ data }) => setZones(data ?? []));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.full_name) setValue("customer_name", data.full_name);
        if (data.phone) setValue("customer_phone", data.phone);
        const email = data.email ?? user.email;
        if (email) setValue("customer_email", email);
      });
  }, [user, setValue]);

  useEffect(() => {
    setSelectedZone(zones.find((z) => z.id === zoneId) ?? null);
  }, [zoneId, zones]);

  const shippingDestination = [selectedZone?.name, neighborhood, address].filter(Boolean).join(", ") || "Beira";
  const shippingSummary = calculateCartShipping(items, shippingDestination, deliveryType);
  const deliveryFee = deliveryType === "delivery" ? shippingSummary.total : 0;
  const total = subtotal + deliveryFee;

  const serviceItems = items.filter((i) => i.type === "servico");
  const uploadableItems = serviceItems.filter((i) => serviceNeedsFile(i.serviceDetails?.category));
  const hasFiles = uploadableItems.length > 0;

  // Determine current step for progress bar
  const currentStep = (() => {
    if (!customerName || !customerPhone) return 0;
    if (!neighborhood) return 1;
    return 2;
  })();

  function handleFileSelect(itemId: string, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Ficheiro demasiado grande (máximo ${MAX_FILE_MB} MB)`);
      return;
    }
    setFileMap((prev) => ({ ...prev, [itemId]: file }));
    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewMap((prev) => ({ ...prev, [itemId]: url }));
    }
  }

  function removeFile(itemId: string) {
    setFileMap((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
    if (previewMap[itemId]) URL.revokeObjectURL(previewMap[itemId]);
    setPreviewMap((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
  }

  function handleClearForm() {
    if (!confirm("Limpar todos os dados do formulário?")) return;
    reset();
    setFileMap({});
    Object.values(previewMap).forEach(URL.revokeObjectURL);
    setPreviewMap({});
  }

  // Smart WhatsApp message
  function buildWhatsAppMessage() {
    const serviceList = items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");
    const filesInfo = Object.keys(fileMap).length > 0 ? "\n📎 Tenho ficheiro(s) para enviar." : "";
    const locInfo = neighborhood ? `\n📍 Zona: ${neighborhood}` : "";
    return encodeURIComponent(
      `Olá! Gostaria de fazer um pedido:\n\n${serviceList}${locInfo}${filesInfo}\n\nTotal estimado: ${total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN\n\nPode confirmar?`
    );
  }

  async function uploadFiles(orderId: string): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    const userId = user?.id ?? "anon";
    for (const [itemId, file] of Object.entries(fileMap)) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${orderId}/${itemId}.${ext}`;
      const { error } = await supabase.storage.from("service-uploads").upload(path, file, { upsert: true });
      if (error) { toast.warning(`Ficheiro de "${items.find((i) => i.id === itemId)?.name}" não foi enviado.`); continue; }
      const { data } = supabase.storage.from("service-uploads").getPublicUrl(path);
      urls[itemId] = data.publicUrl;
    }
    return urls;
  }

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) { toast.error("O teu carrinho está vazio"); return; }
    if (values.delivery_type === "delivery" && !values.delivery_zone_id) { toast.error("Seleciona a zona de entrega"); return; }
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
          notes: [values.notes, values.desired_deadline ? `Prazo desejado: ${values.desired_deadline}` : ""].filter(Boolean).join(" | ") || null,
        })
        .select().single();

      if (orderErr || !order) throw orderErr ?? new Error("Falha ao criar pedido");

      const fileUrls = Object.keys(fileMap).length > 0 ? await uploadFiles(order.id) : {};
      const orderItems = items.map((item) => ({
        order_id: order.id,
        item_type: item.type,
        product_id: item.productId ?? null,
        name: item.name,
        description: item.serviceDetails?.description ?? null,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        specs: {
          shipping: shippingSummary.quotes.find((quote) => quote.itemId === item.id) ?? null,
          logistics: {
            weightKg: item.weightKg ?? null,
            dimensions: {
              lengthCm: item.lengthCm ?? null,
              widthCm: item.widthCm ?? null,
              heightCm: item.heightCm ?? null,
            },
            shippingType: item.shippingType ?? null,
            shippingOrigin: item.shippingOrigin ?? null,
          },
        },
        file_url: fileUrls[item.id] ?? null,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      navigate({ to: "/loja/pedido/$id", params: { id: order.id } });
    } catch (err) {
      toast.error("Ocorreu um erro. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepNum = (base: number) => hasFiles ? base : base - 1;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-bold text-brand mb-2">Carrinho vazio</h2>
          <p className="text-muted-foreground mb-6">Adiciona produtos ou serviços antes de finalizar.</p>
          <Link to="/loja/papelaria" className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-card">
            Ir para a loja
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero minimalista com progresso */}
      <section className="bg-gradient-hero text-brand-foreground py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-center font-bold mb-1">Finalizar Pedido</h1>
          <p className="text-center text-brand-foreground/70 text-sm mb-8">Preenche os dados — demora menos de 2 minutos.</p>
          <ProgressSteps current={currentStep} />
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: form ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* 1. Dados pessoais */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground text-xs font-bold">1</div>
                <h2 className="font-bold text-brand">Os teus dados</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome completo *</label>
                  <input {...register("customer_name")} placeholder="João Silva"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  {errors.customer_name && <p className="text-xs text-destructive mt-1">{errors.customer_name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone *</label>
                  <input {...register("customer_phone")} placeholder="84 000 0000"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  {errors.customer_phone && <p className="text-xs text-destructive mt-1">{errors.customer_phone.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Email <span className="text-muted-foreground">(opcional)</span></label>
                  <input {...register("customer_email")} type="email" placeholder="joao@email.com"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Prazo desejado <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <input {...register("desired_deadline")} placeholder="Ex: Hoje à tarde, Amanhã de manhã..."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>
            </section>

            {/* 2. Ficheiros */}
            {hasFiles && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">2</div>
                  <h2 className="font-bold text-brand">Ficheiros dos Serviços</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Máximo {MAX_FILE_MB} MB por ficheiro · PDF, Word, JPG, PNG</p>
                <div className="space-y-4">
                  {uploadableItems.map((item) => {
                    const Icon = item.serviceDetails?.category === "impressao" ? Printer : Palette;
                    const uploaded = fileMap[item.id];
                    const preview = previewMap[item.id];
                    return (
                      <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-4 w-4 text-brand" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        {uploaded ? (
                          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-3">
                            {preview ? (
                              <img src={preview} alt="preview" className="h-14 w-14 rounded-md object-cover border border-border flex-shrink-0" />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-md border border-border bg-muted flex-shrink-0">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-green-700 dark:text-green-400 truncate">{uploaded.name}</p>
                              <p className="text-xs text-muted-foreground">{(uploaded.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            <button type="button" onClick={() => removeFile(item.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 py-6 cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-smooth text-center">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Clica para seleccionar ou arrasta aqui</span>
                            <span className="text-xs text-muted-foreground/70">PDF, Word, JPG, PNG até {MAX_FILE_MB} MB</span>
                            <input type="file" accept={ACCEPTED_TYPES} className="sr-only"
                              onChange={(e) => handleFileSelect(item.id, e.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Entrega */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground text-xs font-bold">{hasFiles ? 3 : 2}</div>
                <h2 className="font-bold text-brand">Entrega</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  { value: "pickup", label: "Levantar na loja", icon: Store, desc: "Gratuito · Beira, Esturro • Rua Alfredo Lawley" },
                  { value: "delivery", label: "Entrega ao domicílio", icon: Truck, desc: "Frete calculado por produto" },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <label key={value} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-smooth ${deliveryType === value ? "border-gold bg-gold/5 ring-1 ring-gold/30" : "border-border hover:border-gold/40"}`}>
                    <input type="radio" value={value} {...register("delivery_type")} className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-sm"><Icon className="h-4 w-4" /> {label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {deliveryType === "delivery" && (
                <div className="relative mb-4">
                  <label className="text-sm font-medium">Zona de entrega *</label>
                  <select {...register("delivery_zone_id")}
                    className="mt-1 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                    <option value="">Seleccionar zona...</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name} – {z.fee.toLocaleString("pt-MZ")} MZN ({z.estimated_time})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 bottom-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  {selectedZone && <p className="text-xs text-muted-foreground mt-1">Bairros: {selectedZone.neighborhoods.join(", ")}</p>}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Bairro / Zona *</label>
                  <input {...register("neighborhood")} placeholder="Ex: Munhava"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  {errors.neighborhood && <p className="text-xs text-destructive mt-1">{errors.neighborhood.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Rua / Endereço</label>
                  <input {...register("address")} placeholder="Rua Samora Machel, nº 25"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Ponto de referência</label>
                  <input {...register("reference_point")} placeholder="Ex: Perto da escola primária"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>
            </section>

            {/* 4. Pagamento */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground text-xs font-bold">{hasFiles ? 4 : 3}</div>
                <h2 className="font-bold text-brand">Pagamento</h2>
              </div>
              <div className="space-y-3">
                {[
                  { value: "cash",     label: "Dinheiro na entrega / levantamento", badge: "Mais usado" },
                  { value: "mpesa",    label: "M-Pesa", badge: null },
                  { value: "transfer", label: "Transferência bancária", badge: null },
                ].map(({ value, label, badge }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer rounded-lg border border-border px-4 py-3 hover:border-gold/40 transition-smooth">
                    <input type="radio" value={value} {...register("payment_method")} />
                    <span className="text-sm font-medium flex-1">{label}</span>
                    {badge && <span className="text-[10px] font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-full">{badge}</span>}
                  </label>
                ))}
              </div>
            </section>

            {/* 5. Observações */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground text-xs font-bold">{hasFiles ? 5 : 4}</div>
                <h2 className="font-bold text-brand">Observações <span className="text-sm font-normal text-muted-foreground">(opcional)</span></h2>
              </div>
              <textarea {...register("notes")} rows={3}
                placeholder="Instruções especiais, cor preferida, quantidade específica..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </section>

            {/* Limpar formulário */}
            <div className="flex justify-end">
              <button type="button" onClick={handleClearForm}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <RotateCcw className="h-3.5 w-3.5" /> Limpar formulário
              </button>
            </div>
          </div>

          {/* ── RIGHT: summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Order summary */}
              <div className="rounded-2xl border border-border bg-card shadow-card p-6">
                <h2 className="font-bold text-brand mb-4">Resumo do Pedido</h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                      <span className="truncate mr-2 flex items-center gap-1">
                        {item.name} ×{item.quantity}
                        {item.type === "servico" && fileMap[item.id] && <span className="text-green-600">📎</span>}
                      </span>
                      <span className="flex-shrink-0 font-medium text-foreground">
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
                    <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString("pt-MZ")} MZN` : <span className="text-green-600 font-medium">Grátis</span>}</span>
                  </div>
                  {deliveryType === "delivery" && (
                    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Frete por produto</p>
                      {shippingSummary.quotes.map((quote) => (
                        <div key={quote.itemId} className="flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{quote.itemName}</p>
                            <p className="text-muted-foreground">{quote.carrier} · {quote.eta}</p>
                          </div>
                          <span className="flex-shrink-0 font-semibold text-foreground">
                            {quote.cost > 0 ? `${quote.cost.toLocaleString("pt-MZ")} MZN` : "Gratis"}
                          </span>
                        </div>
                      ))}
                      {shippingSummary.hasDigital && (
                        <p className="text-[10px] text-emerald-600">Produtos digitais ficam disponiveis sem frete.</p>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-3">
                    <span>Total</span>
                    <span className="text-brand">{total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                  </div>
                </div>

                {hasFiles && Object.keys(fileMap).length < uploadableItems.length && (
                  <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    {uploadableItems.length - Object.keys(fileMap).length} serviço(s) sem ficheiro — podes enviar por WhatsApp depois.
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-gold py-3.5 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-60">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> A processar...</> : "✓ Confirmar Pedido"}
                </button>

                {/* Trust badges */}
                <div className="mt-4 space-y-2">
                  {[
                    { icon: Shield,      text: "Orçamento sem compromisso" },
                    { icon: Clock,       text: "Resposta em menos de 1 hora" },
                    { icon: CreditCard,  text: "Pagamento só na entrega" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-gold flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp alternativo */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card text-center">
                <p className="text-xs text-muted-foreground mb-3">Preferes falar diretamente?</p>
                <a
                  href={`https://wa.me/258874383621?text=${buildWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white hover:bg-[#20b858] transition-smooth"
                >
                  <MessageCircle className="h-4 w-4" /> Pedir via WhatsApp
                </a>
                <p className="text-[10px] text-muted-foreground mt-2">A mensagem já vem preenchida com o teu pedido</p>
              </div>
            </div>
          </div>

        </form>
      </div>
    </Layout>
  );
}

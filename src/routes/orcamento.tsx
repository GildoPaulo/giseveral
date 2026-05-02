import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useEffect, useRef, useState } from "react";
import {
  Printer, Palette, Laptop, Network, BookOpen, HelpCircle,
  Clock, Zap, Paperclip, X, CheckCircle2, MessageCircle, Send,
  ChevronRight, User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/orcamento")({
  head: () => ({ meta: [{ title: "Pedir Orçamento – Giseveral" }] }),
  component: OrcamentoPage,
});

type ServiceType = "impressao" | "design" | "informatica" | "redes" | "papelaria" | "outro";
type Deadline = "normal" | "urgente";

const SERVICES: { id: ServiceType; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "impressao",  label: "Impressão",    icon: Printer,     desc: "Cópias, brochuras, cartazes" },
  { id: "design",     label: "Design",       icon: Palette,     desc: "Logos, flyers, identidade" },
  { id: "informatica",label: "Informática",  icon: Laptop,      desc: "Formatação, vírus, upgrade" },
  { id: "redes",      label: "Redes",        icon: Network,     desc: "Wi-Fi, routers, cabeamento" },
  { id: "papelaria",  label: "Papelaria",    icon: BookOpen,    desc: "Material escolar e escritório" },
  { id: "outro",      label: "Outro",        icon: HelpCircle,  desc: "Descreva o que precisa" },
];

const WA_NUMBER = "258874383621";

function buildWhatsAppMsg(service: string, description: string, name: string, deadline: Deadline) {
  const svcLabel = SERVICES.find((s) => s.id === service)?.label ?? service;
  const prazo = deadline === "urgente" ? "URGENTE" : "Normal";
  const lines = [
    "Olá, quero solicitar um orçamento:",
    `• Serviço: ${svcLabel}`,
    description ? `• Descrição: ${description}` : "",
    `• Prazo: ${prazo}`,
    name ? `• Nome: ${name}` : "",
  ].filter(Boolean);
  return encodeURIComponent(lines.join("\n"));
}

function OrcamentoPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [service, setService] = useState<ServiceType | "">("");
  const [deadline, setDeadline] = useState<Deadline>("normal");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNum, setOrderNum] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.full_name) setName(data.full_name);
        if (data.phone) setPhone(data.phone);
        setEmail(data.email ?? user.email ?? "");
      });
  }, [user]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 10 * 1024 * 1024) { toast.error("Ficheiro demasiado grande (máx 10 MB)"); return; }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service) { toast.error("Seleciona o tipo de serviço"); return; }
    if (!description.trim()) { toast.error("Descreve o que precisas"); return; }
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!phone.trim()) { toast.error("Telefone obrigatório"); return; }

    setSubmitting(true);
    try {
      const num = `ORC-${Date.now().toString(36).toUpperCase()}`;
      const svcLabel = SERVICES.find((s) => s.id === service)?.label ?? service;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          order_number: num,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || null,
          neighborhood: "",
          delivery_type: "orcamento",
          status: "pending",
          total: 0,
          payment_method: "a_definir",
          notes: `Prazo: ${deadline === "urgente" ? "Urgente" : "Normal"}`,
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Erro ao criar pedido");

      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `orcamentos/${order.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("service-uploads").upload(path, file, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("service-uploads").getPublicUrl(path);
          fileUrl = urlData.publicUrl;
        }
      }

      await supabase.from("order_items").insert({
        order_id: order.id,
        item_type: "servico",
        name: `Orçamento: ${svcLabel}`,
        description: description.trim(),
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        file_url: fileUrl,
      });

      setOrderNum(num);
      setDone(true);
    } catch {
      toast.error("Ocorreu um erro. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card shadow-elegant p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Orçamento recebido!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O pedido <span className="font-semibold text-brand">{orderNum}</span> foi registado com sucesso. Entraremos em contacto brevemente.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMsg(service, description, name, deadline)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-4 w-4" /> Confirmar via WhatsApp
            </a>
            <Link to="/" className="text-sm text-muted-foreground hover:text-brand transition-colors">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const waMsg = buildWhatsAppMsg(service, description, name, deadline);

  return (
    <Layout>
    <div className="bg-muted/30">
      {/* Hero */}
      <div className="bg-gradient-hero text-brand-foreground py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-widest text-gold uppercase mb-3">Giseveral e Services</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Solicite o seu orçamento<br />personalizado
          </h1>
          <p className="mt-3 text-brand-foreground/70 text-sm md:text-base">
            Descreva o que precisa e responderemos rapidamente.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1 — Service */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-6">
            <h2 className="font-bold text-brand mb-1">1. Tipo de serviço</h2>
            <p className="text-xs text-muted-foreground mb-4">Seleciona a área do pedido</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setService(id)}
                  className={`rounded-xl border-2 p-4 text-left transition-smooth flex flex-col gap-1.5 ${
                    service === id
                      ? "border-brand bg-brand/5 shadow-card"
                      : "border-border hover:border-brand/40 hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${service === id ? "text-brand" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold leading-tight ${service === id ? "text-brand" : "text-foreground"}`}>{label}</span>
                  <span className="text-[11px] text-muted-foreground leading-snug">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Description + file */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
            <h2 className="font-bold text-brand">2. Descrição do pedido</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Explique o que precisa <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Preciso de 500 folhas A4 impressas a cores, frente e verso, com 3 mm de sangria para brochura…"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ficheiro de referência <span className="text-muted-foreground">(opcional)</span>
              </label>
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <Paperclip className="h-4 w-4 text-brand flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
                  <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-border hover:border-brand/40 bg-muted/20 px-4 py-5 text-sm text-muted-foreground hover:text-brand transition-smooth flex items-center justify-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Anexar ficheiro (PDF, imagem — máx 10 MB)
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.ai,.psd,.zip" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {/* Step 3 — Deadline */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-6">
            <h2 className="font-bold text-brand mb-4">3. Prazo</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "normal",  label: "Normal",  sub: "2 a 5 dias úteis",  icon: Clock },
                { id: "urgente", label: "Urgente", sub: "Mesmo dia / 24h",   icon: Zap },
              ] as const).map(({ id, label, sub, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeadline(id)}
                  className={`rounded-xl border-2 p-4 text-left flex items-start gap-3 transition-smooth ${
                    deadline === id
                      ? id === "urgente"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                        : "border-brand bg-brand/5"
                      : "border-border hover:border-brand/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${deadline === id ? id === "urgente" ? "text-amber-500" : "text-brand" : "text-muted-foreground"}`} />
                  <div>
                    <p className={`font-semibold text-sm ${deadline === id ? id === "urgente" ? "text-amber-700 dark:text-amber-400" : "text-brand" : "text-foreground"}`}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4 — Contact */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand">4. Os seus dados</h2>
              {user && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <User className="h-3.5 w-3.5" /> Preenchido automaticamente
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nome completo <span className="text-destructive">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O seu nome"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Telefone / WhatsApp <span className="text-destructive">*</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="8X XXX XXXX"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground">
                <Link to="/login" className="text-brand hover:underline font-medium">Inicia sessão</Link> para preencher automaticamente os teus dados.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-elegant disabled:opacity-50 transition-smooth"
            >
              {submitting ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-foreground" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "A enviar…" : "Enviar orçamento"}
            </button>

            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-4 w-4" /> Pedir via WhatsApp
            </a>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Respondemos em menos de 2 horas durante o horário de funcionamento · Seg–Sáb 8h–17h
          </p>
        </form>

        {/* Back to contacts */}
        <div className="mt-8 rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Prefere falar directamente?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Página de contactos com morada, telefone e WhatsApp.</p>
          </div>
          <Link to="/contactos" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline flex-shrink-0">
            Contactos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
    </Layout>
  );
}

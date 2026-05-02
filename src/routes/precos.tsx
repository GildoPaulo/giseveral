import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  Printer, Laptop, Network, Palette, MessageCircle,
  CheckCircle2, ShoppingCart, Calculator, Zap, TrendingDown,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Preços — Giseveral e Services" },
      { name: "description", content: "Tabela de preços de impressão, fotocópias, formatação, instalação de Windows e configuração de redes na Beira." },
    ],
  }),
  component: PrecosPage,
});

/* ─── data ─────────────────────────────────────────────── */

type Servico = {
  id: string;
  nome: string;
  preco: number | null;   // null = "Orçamento"
  unidade: string;
  destaque: boolean;
  category: string;
};

const categorias: { icon: React.ComponentType<{ className?: string }>; title: string; cor: string; servicos: Servico[] }[] = [
  {
    icon: Printer,
    title: "Reprografia & Impressão",
    cor: "bg-gradient-brand text-brand-foreground",
    servicos: [
      { id: "pb",              nome: "Impressão Preto & Branco",    preco: 5,    unidade: "por página",   destaque: false, category: "impressao" },
      { id: "cores",           nome: "Impressão a Cores",           preco: 15,   unidade: "por página",   destaque: false, category: "impressao" },
      { id: "fotocopia",       nome: "Fotocópias",                  preco: 3,    unidade: "por página",   destaque: false, category: "impressao" },
      { id: "digitalizacao",   nome: "Digitalização de documentos", preco: 5,    unidade: "por página",   destaque: false, category: "impressao" },
      { id: "encad_simples",   nome: "Encadernação simples",        preco: 50,   unidade: "por trabalho", destaque: false, category: "impressao" },
      { id: "encad_capa",      nome: "Encadernação com capa dura",  preco: 150,  unidade: "por trabalho", destaque: true,  category: "impressao" },
      { id: "plastificacao",   nome: "Plastificação A4",            preco: 30,   unidade: "por folha",    destaque: false, category: "impressao" },
      { id: "banners",         nome: "Impressão de banners / cartazes", preco: null, unidade: "sob consulta", destaque: false, category: "impressao" },
    ],
  },
  {
    icon: Laptop,
    title: "Assistência Informática",
    cor: "bg-gradient-gold text-gold-foreground",
    servicos: [
      { id: "formatacao",      nome: "Formatação de PC / Laptop",  preco: 500,  unidade: "inclui backup",    destaque: true,  category: "informatica" },
      { id: "windows",         nome: "Instalação de Windows",      preco: 700,  unidade: "com drivers",       destaque: false, category: "informatica" },
      { id: "virus",           nome: "Remoção de vírus / malware", preco: 400,  unidade: "diagnóstico incl.", destaque: false, category: "informatica" },
      { id: "programas",       nome: "Instalação de programas",    preco: 200,  unidade: "pacote básico",     destaque: false, category: "informatica" },
      { id: "dados",           nome: "Recuperação de dados",       preco: null, unidade: "sob consulta",      destaque: false, category: "informatica" },
      { id: "hardware",        nome: "Reparação de hardware",      preco: null, unidade: "avaliação grátis",  destaque: false, category: "informatica" },
    ],
  },
  {
    icon: Network,
    title: "Redes & Tecnologia",
    cor: "bg-gradient-brand text-brand-foreground",
    servicos: [
      { id: "router",          nome: "Configuração de router/Wi-Fi",   preco: 1500, unidade: "residencial",     destaque: false, category: "redes" },
      { id: "rede_emp",        nome: "Instalação de rede empresarial", preco: null, unidade: "sob consulta",    destaque: false, category: "redes" },
      { id: "cabeamento",      nome: "Cabeamento estruturado",         preco: 200,  unidade: "por ponto",       destaque: true,  category: "redes" },
      { id: "extensao",        nome: "Extensão de sinal Wi-Fi",        preco: 800,  unidade: "por repetidor",   destaque: false, category: "redes" },
      { id: "local",           nome: "Assistência técnica no local",   preco: 300,  unidade: "deslocação incl.", destaque: false, category: "redes" },
    ],
  },
  {
    icon: Palette,
    title: "Design Gráfico",
    cor: "bg-gradient-gold text-gold-foreground",
    servicos: [
      { id: "logo",            nome: "Logotipo / identidade visual",  preco: 1500, unidade: "inclui ficheiros",   destaque: true,  category: "design-grafico" },
      { id: "cartao",          nome: "Cartão de visita (design)",     preco: 300,  unidade: "frente e verso",     destaque: false, category: "design-grafico" },
      { id: "panfleto",        nome: "Panfleto / flyer A5",           preco: 400,  unidade: "design + impressão", destaque: false, category: "design-grafico" },
      { id: "banner_dig",      nome: "Banner digital para redes",     preco: 250,  unidade: "por peça",           destaque: false, category: "design-grafico" },
      { id: "edicao_pdf",      nome: "Edição de documentos / PDF",   preco: 200,  unidade: "por trabalho",       destaque: false, category: "design-grafico" },
    ],
  },
];

// Flat list of services that have a numeric price (for calculator)
const calcServices = categorias
  .flatMap((c) => c.servicos)
  .filter((s): s is Servico & { preco: number } => s.preco !== null);

// Volume discount only applies to per-page/per-folha services
const PER_UNIT_SERVICES = ["pb", "cores", "fotocopia", "digitalizacao", "plastificacao"];

function getVolumeTier(id: string, qty: number): { label: string; pct: number } | null {
  if (!PER_UNIT_SERVICES.includes(id)) return null;
  if (qty >= 100) return { label: "100+ unidades", pct: 20 };
  if (qty >= 50) return { label: "50–99 unidades", pct: 10 };
  return null;
}

/* ─── calculator widget ─────────────────────────────────── */

function QuickCalc() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [serviceId, setServiceId] = useState(calcServices[0].id);
  const [qty, setQty] = useState(1);
  const [urgent, setUrgent] = useState(false);

  const service = calcServices.find((s) => s.id === serviceId)!;
  const tier = getVolumeTier(serviceId, qty);
  const base = service.preco * qty;
  const discount = tier ? base * (tier.pct / 100) : 0;
  const urgencyFee = urgent ? Math.round((base - discount) * 0.3) : 0;
  const total = base - discount + urgencyFee;

  function handleAdd() {
    addItem({
      id: `srv-${service.id}`,
      type: "servico",
      name: service.nome + (urgent ? " (Urgente)" : ""),
      price: service.preco,
      quantity: qty,
      unit: service.unidade,
      serviceDetails: { category: service.category, description: service.unidade },
    });
    toast.success(`"${service.nome}" adicionado ao carrinho`);
    navigate({ to: "/loja/checkout" });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden sticky top-24">
      <div className="flex items-center gap-2 px-5 py-4 bg-gradient-brand text-brand-foreground">
        <Calculator className="h-5 w-5" />
        <span className="font-bold text-sm">Calculadora rápida</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Service selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serviço</label>
          <select
            value={serviceId}
            onChange={(e) => { setServiceId(e.target.value); setQty(1); }}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {categorias.map((cat) => (
              <optgroup key={cat.title} label={cat.title}>
                {cat.servicos
                  .filter((s) => s.preco !== null)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Quantidade <span className="text-[10px] normal-case">({service.unidade})</span>
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-lg font-bold hover:bg-accent transition-smooth"
            >−</button>
            <input
              type="number" min={1} value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-lg font-bold hover:bg-accent transition-smooth"
            >+</button>
          </div>
        </div>

        {/* Volume badge */}
        {tier && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 px-3 py-2 text-xs text-green-700 dark:text-green-400">
            <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />
            <span><strong>{tier.pct}% desconto</strong> de volume ({tier.label})</span>
          </div>
        )}

        {/* Urgency toggle */}
        <button
          type="button"
          onClick={() => setUrgent((v) => !v)}
          className={`flex items-center gap-3 w-full rounded-lg border px-4 py-3 transition-smooth text-left ${urgent ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"}`}
        >
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-5 rounded-full transition-smooth ${urgent ? "bg-gold" : "bg-muted"}`} />
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-smooth shadow-sm ${urgent ? "left-5" : "left-1"}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 text-gold" /> Urgente
            </div>
            <p className="text-[10px] text-muted-foreground">+30% · pronto hoje</p>
          </div>
        </button>

        {/* Breakdown */}
        <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{qty} × {service.preco.toLocaleString("pt-MZ")} MZN</span>
            <span>{base.toLocaleString("pt-MZ")} MZN</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto ({tier!.pct}%)</span>
              <span>−{discount.toLocaleString("pt-MZ")} MZN</span>
            </div>
          )}
          {urgencyFee > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Taxa urgência (+30%)</span>
              <span>+{urgencyFee.toLocaleString("pt-MZ")} MZN</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-border pt-2">
            <span>Total</span>
            <span className="text-brand">{total.toLocaleString("pt-MZ")} MZN</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-gold py-3 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
        >
          <ShoppingCart className="h-4 w-4" /> Quero este serviço
        </button>

        <p className="text-center text-[10px] text-muted-foreground">
          Será redirecionado para finalizar o pedido
        </p>
      </div>
    </div>
  );
}

/* ─── service row with "Pedir" button ───────────────────── */

function ServicoRow({ s }: { s: Servico }) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  function handlePedir() {
    if (s.preco === null) return; // handled by link
    addItem({
      id: `srv-${s.id}`,
      type: "servico",
      name: s.nome,
      price: s.preco,
      quantity: 1,
      unit: s.unidade,
      serviceDetails: { category: s.category, description: s.unidade },
    });
    toast.success(`"${s.nome}" adicionado ao carrinho`);
    navigate({ to: "/loja/checkout" });
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3.5 transition-smooth hover:bg-muted/30 group ${s.destaque ? "bg-gold/5" : ""}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {s.destaque && <CheckCircle2 className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
        <span className={`text-sm ${s.destaque ? "font-semibold text-foreground" : "text-foreground/80"}`}>
          {s.nome}
        </span>
      </div>
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <div className="text-right">
          <span className={`text-sm font-bold ${s.preco === null ? "text-muted-foreground" : "text-brand"}`}>
            {s.preco !== null ? `${s.preco.toLocaleString("pt-MZ")} MZN` : "Orçamento"}
          </span>
          <span className="block text-[10px] text-muted-foreground">{s.unidade}</span>
        </div>
        {s.preco !== null ? (
          <button
            onClick={handlePedir}
            className="opacity-0 group-hover:opacity-100 transition-smooth inline-flex items-center gap-1 rounded-lg bg-gradient-brand px-2.5 py-1.5 text-[11px] font-semibold text-brand-foreground hover:shadow-card"
            title="Adicionar ao carrinho"
          >
            <ShoppingCart className="h-3 w-3" /> Pedir
          </button>
        ) : (
          <Link
            to="/contactos"
            className="opacity-0 group-hover:opacity-100 transition-smooth inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-brand hover:border-brand/50"
          >
            Orçamento
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── volume discount info banner ───────────────────────── */

function VolumeBanner() {
  const tiers = [
    { min: 1, max: 49, label: "1–49",   pct: 0,  note: "Preço normal" },
    { min: 50, max: 99, label: "50–99",  pct: 10, note: "−10% por página" },
    { min: 100, max: null, label: "100+", pct: 20, note: "−20% por página" },
  ];
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="h-4 w-4 text-gold" />
        <span className="text-sm font-bold text-foreground">Descontos de volume — Impressão & Fotocópias</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {tiers.map((t) => (
          <div key={t.label} className={`rounded-lg border p-3 ${t.pct > 0 ? "border-gold/40 bg-gold/10" : "border-border bg-background"}`}>
            <p className={`text-lg font-bold ${t.pct > 0 ? "text-gold" : "text-muted-foreground"}`}>
              {t.pct > 0 ? `−${t.pct}%` : "—"}
            </p>
            <p className="font-semibold text-foreground">{t.label} pág.</p>
            <p className="text-muted-foreground mt-0.5">{t.note}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        * Desconto aplicado a: Impressão P&B, a Cores, Fotocópias, Digitalização e Plastificação.
      </p>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────── */

function PrecosPage() {
  return (
    <Layout>
      <PageHero
        title="Tabela de Preços"
        subtitle="Preços acessíveis e transparentes. Usa a calculadora para estimar o teu pedido."
      />

      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: price tables ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Volume info banner */}
            <VolumeBanner />

            {categorias.map(({ icon: Icon, title, cor, servicos }) => (
              <div key={title} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className={`flex items-center gap-3 px-5 py-4 ${cor}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-base">{title}</h2>
                </div>
                <div className="divide-y divide-border">
                  {servicos.map((s) => <ServicoRow key={s.id} s={s} />)}
                </div>
              </div>
            ))}

            {/* Notice */}
            <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 p-5">
              <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Preços indicativos — podem variar</p>
                <p className="mt-0.5 text-muted-foreground">
                  Os preços podem variar conforme a quantidade, complexidade e materiais usados.
                  Trabalhos urgentes têm acréscimo de 30%. Contacta-nos para orçamento personalizado.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-hero p-8 text-brand-foreground text-center shadow-elegant">
              <h3 className="text-xl font-bold">Precisa de orçamento personalizado?</h3>
              <p className="mt-2 text-brand-foreground/75 text-sm max-w-md mx-auto">
                Para projetos especiais, grandes quantidades ou combinações de serviços, fala connosco.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/orcamento"
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                >
                  Pedir Orçamento
                </Link>
                <a
                  href="https://wa.me/258874383621?text=Olá! Gostaria de pedir um orçamento."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 bg-white/10 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-white/20 transition-smooth"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* ── RIGHT: calculator ── */}
          <div className="lg:col-span-1">
            <QuickCalc />
          </div>

        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

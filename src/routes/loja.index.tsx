import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Pen, FolderOpen, GraduationCap, FileText,
  Printer, Laptop, Wifi, Palette, ArrowRight, ShoppingBag,
  Star, Truck, Shield, Clock, ShoppingCart, Zap, Package,
  Heart, GitCompareArrows, BadgePercent, Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { SkeletonCard } from "@/components/Skeleton";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import stationeryBg from "@/assets/stationery.jpg";

export const Route = createFileRoute("/loja/")({
  head: () => ({
    meta: [
      { title: "Loja – Giseveral e Services" },
      { name: "description", content: "Compre produtos de papelaria e peça serviços de impressão, informática e redes. Entrega ao domicílio na Beira." },
    ],
  }),
  component: LojaIndex,
});

// ── Variants ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardIn: any = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ── Types ─────────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Pen, FolderOpen, GraduationCap, FileText,
  Printer, Laptop, Wifi, Palette,
};

type Product = Tables<"products"> & {
  product_categories: { name: string; slug: string } | null;
};

// ── Component ─────────────────────────────────────────────────────────────────

function LojaIndex() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        setFeatured((data as Product[]) ?? []);
        setLoading(false);
      });
  }, []);

  const handleAdd = (p: Product) => {
    addItem({
      id: p.id,
      type: "produto",
      productId: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      brand: p.brand ?? undefined,
      image: p.image_url ?? undefined,
      weightKg: p.weight_kg,
      lengthCm: p.length_cm,
      widthCm: p.width_cm,
      heightCm: p.height_cm,
      shippingType: p.shipping_type as "local" | "national" | "international" | "digital",
      shippingOrigin: p.shipping_origin,
      freeShipping: p.free_shipping,
      expressAvailable: p.express_available,
      shippingFee: p.shipping_fee,
      internationalShippingFee: p.international_shipping_fee,
    });
    toast.success(`"${p.name}" adicionado ao carrinho`);
  };

  const productCategories = [
    { slug: "cadernos",       icon: "BookOpen",    label: "Cadernos",        color: "bg-blue-500/10 text-blue-600" },
    { slug: "canetas-lapis",  icon: "Pen",         label: "Canetas & Lápis", color: "bg-purple-500/10 text-purple-600" },
    { slug: "pastas-arquivos",icon: "FolderOpen",  label: "Pastas",          color: "bg-amber-500/10 text-amber-700" },
    { slug: "material-escolar",icon: "GraduationCap",label: "Mat. Escolar",  color: "bg-emerald-500/10 text-emerald-600" },
    { slug: "papel-blocos",   icon: "FileText",    label: "Papel & Blocos",  color: "bg-brand/10 text-brand" },
  ];

  const serviceCategories = [
    { slug: "impressao",     icon: "Printer", label: "Impressão",     price: "A partir de 5 MZN/pág",  desc: "Impressão a cores e P&B, encadernação, plastificação" },
    { slug: "formatacao-pc", icon: "Laptop",  label: "Formatação PC", price: "A partir de 500 MZN",    desc: "Formatação, instalação, reparação e manutenção" },
    { slug: "redes-wifi",    icon: "Wifi",    label: "Redes & Wi-Fi", price: "A partir de 1.500 MZN",  desc: "Instalação e configuração de redes domésticas e empresariais" },
    { slug: "design-grafico",icon: "Palette", label: "Design Gráfico",price: "A partir de 300 MZN",    desc: "Logotipos, cartazes, banners e materiais de marketing" },
  ];

  const benefits = [
    { icon: Truck,  text: "Entrega ao domicílio", sub: "Na Beira em 30–120 min" },
    { icon: Shield, text: "Produtos de qualidade", sub: "Marcas reconhecidas" },
    { icon: Clock,  text: "Serviço rápido",        sub: "Atendimento imediato" },
    { icon: Star,   text: "Clientes satisfeitos",  sub: "Avaliação 4.9/5" },
  ];

  const marketplaceUx = [
    { icon: BadgePercent, label: "Flash sales", value: "Promocoes activas" },
    { icon: Heart, label: "Wishlist", value: "Guarde favoritos" },
    { icon: GitCompareArrows, label: "Comparar", value: "Escolha melhor" },
    { icon: Search, label: "Pesquisa rapida", value: "Filtros por categoria" },
  ];

  return (
    <Layout>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero text-brand-foreground">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${stationeryBg})` }}
        />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl relative">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-5">
                <ShoppingBag className="h-3.5 w-3.5" /> LOJA GISEVERAL
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
                Papelaria &<br /><span className="text-gold">Serviços</span><br />na Beira
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-brand-foreground/80 max-w-xl mb-8">
                Tudo o que precisa — impressão, material escolar, informática e redes. Com entrega ao domicílio.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/loja/papelaria" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                >
                  <ShoppingBag className="h-4 w-4" /> Comprar papelaria
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/orcamento" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-white/25 transition-smooth"
                >
                  Pedir orçamento <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </div>

            {/* Mini stats card */}
            <motion.div variants={fadeUp} className="hidden md:grid grid-cols-2 gap-3 shrink-0">
              {[
                { label: "Produtos", value: "200+", icon: <Package className="h-5 w-5" /> },
                { label: "Clientes", value: "1 200+", icon: <Star className="h-5 w-5" /> },
                { label: "Serviços", value: "4",     icon: <Zap className="h-5 w-5" /> },
                { label: "Anos",     value: "5+",    icon: <Shield className="h-5 w-5" /> },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 text-center">
                  <div className="flex justify-center mb-1 text-gold">{s.icon}</div>
                  <div className="text-2xl font-extrabold">{s.value}</div>
                  <div className="text-xs opacity-70">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── BENEFITS BAR ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{text}</div>
                  <div className="text-[11px] text-muted-foreground">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS PAPELARIA ──────────────────────────────────────────────── */}
      <section className="border-b border-border bg-gradient-premium">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <div className="grid gap-3 md:grid-cols-4">
            {marketplaceUx.map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-brand">Papelaria</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Material escolar e escritório</p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/loja/papelaria" })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-gold transition-smooth"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {productCategories.map(({ slug, icon, label, color }) => {
              const Icon = iconMap[icon];
              return (
                <motion.div key={slug} variants={cardIn} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/loja/papelaria", search: { categoria: slug } })}
                    className="group w-full flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center transition-smooth hover:border-gold/40 hover:shadow-elegant"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-smooth group-hover:bg-gold group-hover:text-gold-foreground ${color}`}>
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <span className="text-xs font-semibold text-foreground leading-tight">{label}</span>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ── PRODUTOS EM DESTAQUE ──────────────────────────────────────────────── */}
      {(loading || featured.length > 0) && (
        <section className="bg-muted/40 py-14">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-brand">Produtos em Destaque</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Os mais recentes na loja</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/loja/papelaria" })}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-gold transition-smooth"
                >
                  Ver tudo <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
              <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {featured.map((p) => (
                  <motion.div key={p.id} variants={cardIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <div className="group flex flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden h-full">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/loja/produto/$id", params: { id: p.id } })}
                        className="block relative aspect-square overflow-hidden bg-muted"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-smooth"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-14 w-14 text-muted-foreground/30" />
                          </div>
                        )}
                        {p.stock === 0 && (
                          <div className="absolute inset-0 bg-background/70 grid place-items-center">
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Esgotado</span>
                          </div>
                        )}
                        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-smooth group-hover:opacity-100">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-card backdrop-blur" title="Guardar na wishlist">
                            <Heart className="h-4 w-4" />
                          </span>
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-card backdrop-blur" title="Comparar produto">
                            <GitCompareArrows className="h-4 w-4" />
                          </span>
                        </div>
                        {p.stock > 0 && (
                          <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-card">
                            Entrega rapida
                          </span>
                        )}
                      </button>

                      <div className="flex flex-col flex-1 p-4">
                        {p.product_categories && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold mb-1">
                            {p.product_categories.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/loja/produto/$id", params: { id: p.id } })}
                          className="text-sm font-semibold text-foreground line-clamp-2 hover:text-brand transition-colors text-left leading-snug mb-1"
                        >
                          {p.name}
                        </button>
                        {p.brand && <p className="text-xs text-muted-foreground mb-3">{p.brand}</p>}

                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-extrabold text-brand">
                              {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                            </span>
                            <StockBadge stock={p.stock} />
                          </div>
                          <button
                            onClick={() => handleAdd(p)}
                            disabled={p.stock === 0}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-2.5 text-xs font-bold text-brand-foreground transition-smooth hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── SERVIÇOS ─────────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-2xl font-bold text-brand">Serviços Disponíveis</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Impressão, informática, redes e design</p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {serviceCategories.map(({ slug, icon, label, price, desc }) => {
              const Icon = iconMap[icon];
              return (
                <motion.div key={slug} variants={cardIn} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/loja/papelaria", search: { tipo: "servico", categoria: slug } })}
                    className="group w-full text-left rounded-2xl border border-border bg-card p-6 transition-smooth hover:shadow-elegant hover:border-gold/40"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground mb-4 transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <h3 className="font-bold text-base text-brand mb-1">{label}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gold">{price}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-smooth" />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA ENTREGA ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-20 max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-hero text-brand-foreground p-8 sm:p-12"
        >
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold/25 blur-3xl pointer-events-none" />
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-3">
                <Truck className="h-3.5 w-3.5" /> ENTREGA AO DOMICÍLIO
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Receba em casa, na Beira</h2>
              <p className="text-brand-foreground/80 max-w-md">
                Tempo estimado de 30 min a 2 horas conforme a zona. Sem saír de casa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/loja/papelaria" })}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-7 py-4 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" /> Começar a Comprar
            </button>
          </div>
        </motion.div>
      </section>

    </Layout>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock > 5) return <span className="text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-600 px-2 py-0.5">Em stock</span>;
  if (stock > 0) return <span className="text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5">Pouco stock</span>;
  return <span className="text-[10px] font-semibold rounded-full bg-red-500/15 text-red-600 px-2 py-0.5">Esgotado</span>;
}

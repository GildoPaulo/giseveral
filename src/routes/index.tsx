import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Lightbox } from "@/components/Lightbox";
import { supabase } from "@/integrations/supabase/client";
import { TypewriterText } from "@/components/TypewriterText";
import { PromoBanner } from "@/components/promos/PromoBanner";
import { PromoSlider } from "@/components/promos/PromoSlider";
import { MiniBanner } from "@/components/promos/MiniBanner";
import { PromoPopup } from "@/components/promos/PromoPopup";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { motion, useInView } from "framer-motion";
import { StatCounter } from "@/components/StatCounter";
import { useHeroImages } from "@/hooks/useHeroImages";
import { fetchHubNews } from "@/lib/hub";
import { HUB_NEWS, type NewsItem } from "@/data/hub-bolsas";
import { GALLERY_CATEGORIES, categoryLabel } from "@/data/gallery-categories";
import {
  Printer, Laptop, Network, BookOpen, ArrowRight, CheckCircle2, Phone,
  Clock, Zap, ShieldCheck, Award, Star, Users, TrendingUp,
  GraduationCap, FileText, Crown, Calendar, ShoppingBag, Sparkles,
  Palette, Shirt, Globe, Wrench, Package, Facebook, Instagram, Linkedin,
  MessageCircle,
} from "lucide-react";
// Removed AI-generated images - using real photos from /public/images/

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Giseveral e Services — Reprografia, Informática e Redes na Beira" },
      { name: "description", content: "Soluções completas em reprografia, papelaria, informática e redes na Beira, Moçambique. Qualidade, rapidez e confiança." },
      { property: "og:title", content: "Giseveral e Services" },
      { property: "og:description", content: "Da impressão à tecnologia, resolvemos tudo por si." },
    ],
  }),
  component: Index,
});

const typewriterPhrases = [
  "Impressão rápida, cores e P&B a preços acessíveis",
  "Assistência informática — formatação, vírus e upgrades",
  "Instalação de redes Wi-Fi e LAN para casa e empresa",
  "Papelaria completa para estudantes e escritórios",
  "Design gráfico — logos, flyers e identidade visual",
  "Orçamentos rápidos · WhatsApp 874 383 621",
];

const stats = [
  { icon: Users,        numValue: 5000, suffix: "+",    label: "Clientes satisfeitos" },
  { icon: Clock,        numValue: 10,   suffix: "+ anos", label: "De experiência" },
  { icon: CheckCircle2, numValue: 99,   suffix: "%",    label: "Taxa de satisfação" },
  { icon: TrendingUp,   numValue: 24,   suffix: "h",    label: "Entrega rápida" },
];

const highlights = [
  { icon: Printer,  title: "Reprografia",  desc: "Impressão, fotocópias, encadernação e plastificação a preços acessíveis.", slug: "reprografia" as const, color: "bg-blue-50 text-brand dark:bg-brand/10" },
  { icon: Laptop,   title: "Informática",  desc: "Formatação, Windows, remoção de vírus e instalação de programas.",         slug: "informatica" as const, color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10" },
  { icon: Network,  title: "Redes & Wi-Fi",desc: "Instalação de routers, LAN, cabeamento e extensão de sinal Wi-Fi.",         slug: "redes" as const,       color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" },
  { icon: BookOpen, title: "Papelaria",    desc: "Material escolar e de escritório — cadernos, canetas, pastas e mais.",      slug: "papelaria" as const,   color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10" },
];

const whyUs = [
  { icon: Zap,         title: "Resposta rápida",     desc: "Atendimento em menos de 1 hora e entrega no mesmo dia para a maioria dos serviços." },
  { icon: ShieldCheck, title: "Garantia de qualidade",desc: "Trabalhamos com equipamentos modernos e materiais de qualidade comprovada." },
  { icon: Award,       title: "Equipa experiente",   desc: "Mais de 10 anos a servir estudantes, empresas e famílias na Beira." },
  { icon: Star,        title: "Preços transparentes", desc: "Sem cobranças ocultas. O preço que vê é o que paga." },
];

const platformPillars = [
  {
    icon: ShoppingBag,
    title: "Marketplace integrado",
    desc: "Produtos, servicos, checkout e entregas numa experiencia unica para clientes da Beira.",
    to: "/loja" as const,
    metric: "Loja + servicos",
  },
  {
    icon: FileText,
    title: "CV Builder premium",
    desc: "Templates modernos, exportacao PDF, IA para textos e preview profissional em tempo real.",
    to: "/hub/cv" as const,
    metric: "Canva para CVs",
  },
  {
    icon: GraduationCap,
    title: "Bolsas inteligentes",
    desc: "Bolsas, documentos, noticias academicas e candidatura orientada para estudantes.",
    to: "/hub/bolsas" as const,
    metric: "Hub academico",
  },
  {
    icon: Sparkles,
    title: "Automacao com IA",
    desc: "Geracao de noticias, cartas, sugestoes de CV e extracao de dados de editais.",
    to: "/hub" as const,
    metric: "AI ready",
  },
];

const servicesDetailed = [
  { icon: Printer, title: "Impressão & Reprografia", desc: "Impressão a cores e P&B, fotocópias, encadernação e plastificação profissional.", color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10", tag: "Mais popular" },
  { icon: Palette, title: "Design Gráfico", desc: "Logótipos, identidade visual, flyers, cartazes e material publicitário criativo.", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10", tag: "Premium" },
  { icon: Shirt, title: "Estampagem de Camisetas", desc: "Personalização de camisetas, brindes corporativos e materiais promocionais.", color: "bg-orange-50 text-orange-600 dark:bg-orange-500/10", tag: "Novidade" },
  { icon: Globe, title: "Desenvolvimento Web", desc: "Sites modernos, e-commerce, aplicações web e manutenção de plataformas digitais.", color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10", tag: "Digital" },
  { icon: Wrench, title: "Informática & TI", desc: "Formatação, instalação de sistemas, remoção de vírus e assistência técnica.", color: "bg-red-50 text-red-600 dark:bg-red-500/10", tag: "Técnico" },
  { icon: Package, title: "Papelaria & Loja", desc: "Material escolar, escritório e equipamentos tecnológicos para todas as necessidades.", color: "bg-teal-50 text-teal-600 dark:bg-teal-500/10", tag: "Variedade" },
];

const socialLinks = [
  {
    icon: Facebook,
    name: "Facebook",
    handle: "@GiseveralServices",
    url: "https://facebook.com/GiseveralServices",
    color: "bg-[#1877F2] hover:bg-[#166FE5]",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textColor: "text-[#1877F2]",
  },
  {
    icon: Instagram,
    name: "Instagram",
    handle: "@giseveral",
    url: "https://instagram.com/giseveral",
    color: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F56040] hover:opacity-90",
    bgLight: "bg-pink-50 dark:bg-pink-500/10",
    textColor: "text-[#E1306C]",
  },
  {
    icon: MessageCircle,
    name: "WhatsApp",
    handle: "+258 874 383 621",
    url: "https://wa.me/258874383621",
    color: "bg-[#25D366] hover:bg-[#20BD5A]",
    bgLight: "bg-green-50 dark:bg-green-500/10",
    textColor: "text-[#25D366]",
  },
  {
    icon: Linkedin,
    name: "LinkedIn",
    handle: "Giseveral e Services",
    url: "https://linkedin.com/company/giseveral",
    color: "bg-[#0A66C2] hover:bg-[#095196]",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textColor: "text-[#0A66C2]",
  },
];

type HomePortfolioProject = {
  id: string;
  slug: string;
  title: string;
  category: string;
  client_name: string | null;
  gallery_images: { image_url: string; is_cover: boolean | null; step_order: number | null }[] | null;
};

function portfolioCover(images: HomePortfolioProject["gallery_images"]): string | undefined {
  if (!images?.length) return undefined;
  const sorted = [...images].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
  return (sorted.find((i) => i.is_cover) ?? sorted[sorted.length - 1])?.image_url;
}

function Index() {
  const [news, setNews] = useState<NewsItem[]>(HUB_NEWS.slice(0, 3));
  const [portfolioProjects, setPortfolioProjects] = useState<HomePortfolioProject[]>([]);
  const [galleryCategory, setGalleryCategory] = useState<string>("todos");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; slug: string } | null>(null);

  useEffect(() => {
    fetchHubNews().then((data) => setNews(data.slice(0, 3)));
  }, []);

  /* Portfólio — mesma fonte que /galeria (gallery_projects) */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("gallery_projects")
        .select("id, slug, title, category, client_name, gallery_images(image_url, is_cover, step_order)")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("project_date", { ascending: false })
        .limit(12);
      setPortfolioProjects((data as HomePortfolioProject[] | null) ?? []);
    })();
  }, []);

  const filteredGallery =
    galleryCategory === "todos"
      ? portfolioProjects
      : portfolioProjects.filter((p) => p.category === galleryCategory);

  return (
    <Layout>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand/5 via-background to-blue-50/60 dark:from-brand/10 dark:via-background dark:to-background">

        {/* Soft decorative blob — opacity reduced (0.2 per spec) */}
        <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-brand/5 blur-[80px] opacity-20" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-[400px] w-[400px] rounded-full bg-gold/5 blur-[80px] opacity-20" />

        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
            className="grid lg:grid-cols-2 gap-10 items-center"
          >

            {/* ── Left: Text ── */}
            <div className="order-2 lg:order-1">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-3 py-1 text-[11px] font-bold tracking-widest text-brand uppercase">
                ✦ Soluções Profissionais · Beira, Moçambique
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-5 text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl"
              >
                A Empresa Líder<br />em Impressão e<br />
                <span className="text-brand">Tecnologia</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 text-base text-muted-foreground min-h-[1.6rem]">
                <TypewriterText phrases={typewriterPhrases} className="font-semibold text-brand" />
              </motion.p>

              <motion.p variants={fadeUp} className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Mais de 10 anos a servir estudantes, empresas e famílias na Beira com qualidade, rapidez e preços honestos.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/servicos"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-7 py-3.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-smooth"
                >
                  Ver Serviços <ArrowRight className="h-4 w-4" />
                </Link>

                <a href="tel:+258874383621" className="inline-flex items-center gap-3 group">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 group-hover:bg-gold/20 transition-smooth">
                    <Phone className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Precisa de ajuda?</p>
                    <p className="text-sm font-bold text-foreground">(258) 874 383 621</p>
                  </div>
                </a>
              </motion.div>

              {/* Live metrics with count-up */}
              <motion.div variants={fadeUp} className="mt-8 grid grid-cols-4 gap-2 max-w-md">
                {stats.map((s) => (
                  <HeroMetric key={s.label} value={s.numValue} suffix={s.suffix} label={s.label} />
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                {["✓ Atendimento personalizado", "✓ Entrega no mesmo dia", "✓ Orçamento grátis"].map((b) => (
                  <span key={b} className="text-foreground/70 font-medium">{b}</span>
                ))}
              </motion.div>
            </div>

            {/* ── Right: Dynamic Photo Collage ── */}
            <HomeHeroCollage />
          </motion.div>
        </div>
      </section>

      {/* ── PROMO SLIDER ─────────────────────────────────── */}
      <PromoSlider />

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {stats.map((s) => (
              <StatCounter
                key={s.label}
                value={s.numValue}
                suffix={s.suffix}
                label={s.label}
                icon={s.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border bg-gradient-premium py-16 md:py-20">
        <div className="absolute inset-0 premium-grid-bg opacity-70" />
        <div className="container relative mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Plataforma Giseveral
              </div>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Um ecossistema digital, nao apenas um site.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Loja, servicos, hub academico, CVs, bolsas e IA trabalham juntos para criar uma experiencia moderna, rapida e preparada para crescer.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {["Mobile-first", "Dark mode", "IA integrada", "Checkout fluido"].map((item) => (
                  <span key={item} className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-foreground shadow-card">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="grid gap-4 sm:grid-cols-2">
              {platformPillars.map((item) => (
                <motion.div key={item.title} variants={fadeUp}>
                  <Link to={item.to} className="premium-card group block h-full rounded-2xl p-5">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-smooth group-hover:bg-brand group-hover:text-brand-foreground">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                        {item.metric}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand">
                      Abrir modulo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MINI BANNER ──────────────────────────────────── */}
      <MiniBanner />

      {/* ── SERVICES GRID ────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="h-px w-10 bg-gold" />
            <span className="text-xs font-bold tracking-widest text-gold uppercase">O que fazemos</span>
            <div className="h-px w-10 bg-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Explore os Nossos Melhores<br />Serviços de Qualidade</h2>
          <p className="mt-3 text-muted-foreground">Tudo o que a sua empresa, escola ou casa precisa — num só endereço.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
            <Link
              to="/servicos/$slug"
              params={{ slug: h.slug }}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-2 hover:shadow-elegant hover:border-brand/30 overflow-hidden block h-full"
            >
              {/* Number badge */}
              <span className="absolute top-4 right-4 text-4xl font-black text-border/40 group-hover:text-brand/10 transition-colors select-none">
                0{i + 1}
              </span>
              <div className={`flex h-13 w-13 items-center justify-center rounded-2xl p-3 ${h.color} transition-smooth group-hover:scale-110 mb-5`}>
                <h.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-base">{h.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-0 group-hover:opacity-100 transition-smooth">
                Saber mais <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WORK PREVIEW ─────────────────────────────────── */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
            <div>
              <div className="inline-flex items-center gap-3 mb-3">
                <div className="h-px w-10 bg-gold" />
                <span className="text-xs font-bold tracking-widest text-gold uppercase">Trabalhos reais</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Veja o nosso trabalho<br />de perto</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Mais de uma década a transformar pedidos em resultados. Cada projecto é tratado com o mesmo rigor, qualidade e atenção ao detalhe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: "/images/hero-2.jpg", title: "Reprografia",  text: "Impressão a cores e P&B, fotocópias, encadernação e plastificação com materiais de qualidade.", slug: "reprografia", badge: "Mais popular", filter: "" },
              { img: "/images/hero-1.jpg", title: "Informática",  text: "Formatação, instalação de Windows, remoção de vírus e diagnóstico rápido de hardware.", slug: "informatica", badge: null, filter: "" },
              { img: "/images/hero-1.jpg", title: "Redes",        text: "Instalação Wi-Fi, redes LAN, routers e cabeamento estruturado para residências e empresas.", slug: "redes", badge: null, filter: "brightness(0.9) contrast(1.1) hue-rotate(10deg)" },
            ].map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Link
                to="/servicos/$slug"
                params={{ slug: s.slug }}
                className="group overflow-hidden rounded-2xl bg-card shadow-card transition-smooth hover:shadow-elegant block"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-smooth duration-500 group-hover:scale-105"
                    style={{ filter: s.filter }}
                  />
                  {s.badge && (
                    <span className="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                      {s.badge}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-foreground group-hover:text-brand transition-colors text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Ver mais <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="h-px w-10 bg-gold" />
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Porquê nós</span>
            <div className="h-px w-10 bg-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">O que nos torna diferentes</h2>
          <p className="mt-3 text-muted-foreground">Mais de uma década a servir a Beira com compromisso e qualidade.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyUs.map((w, i) => (
            <motion.div key={w.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:border-brand/30 hover:shadow-elegant hover:-translate-y-1 transition-smooth">
              <div className="relative mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/8 group-hover:bg-gradient-brand group-hover:text-brand-foreground transition-smooth">
                  <w.icon className="h-5 w-5 text-brand group-hover:text-brand-foreground transition-colors" />
                </div>
                <span className="absolute -top-1 -right-1 text-5xl font-black text-border/20 select-none">0{i + 1}</span>
              </div>
              <h4 className="font-bold text-foreground">{w.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SERVIÇOS COMPLETOS ───────────────────────────── */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="h-px w-10 bg-brand" />
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Todos os serviços</span>
              <div className="h-px w-10 bg-brand" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Soluções completas para<br />cada necessidade</h2>
            <p className="mt-3 text-muted-foreground">De impressão a tecnologia, oferecemos tudo o que precisa num só lugar.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {servicesDetailed.map((service, i) => (
              <motion.div
                key={service.title}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-2 hover:shadow-elegant hover:border-brand/30"
              >
                {/* Tag */}
                {service.tag && (
                  <span className="absolute top-4 right-4 rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold">
                    {service.tag}
                  </span>
                )}

                {/* Icon */}
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${service.color} transition-smooth group-hover:scale-110`}>
                  <service.icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.desc}</p>

                {/* CTA */}
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition-smooth group-hover:opacity-100">
                  Saber mais <ArrowRight className="h-3 w-3" />
                </span>

                {/* Number badge */}
                <span className="absolute bottom-4 right-4 text-6xl font-black text-border/10 transition-colors group-hover:text-brand/5 select-none">
                  0{i + 1}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── GALERIA DE TRABALHOS ─────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="h-px w-10 bg-gold" />
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Portfolio</span>
            <div className="h-px w-10 bg-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Galeria de Trabalhos</h2>
          <p className="mt-3 text-muted-foreground">
            Os mesmos projectos da página{" "}
            <Link to="/galeria" className="font-semibold text-brand hover:underline">
              Galeria
            </Link>
            — clique para ver em grande ou abrir a página do projecto.
          </p>
        </div>

        {/* Category filters — alinhados com /galeria */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setGalleryCategory(cat.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-smooth ${
                galleryCategory === cat.id
                  ? "border-brand bg-brand text-brand-foreground shadow-card"
                  : "border-border bg-card text-foreground hover:border-brand/50 hover:bg-brand/5"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        {filteredGallery.length > 0 ? (
          <motion.div
            key={galleryCategory}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredGallery.map((item) => {
              const cover = portfolioCover(item.gallery_images);
              if (!cover) return null;
              return (
                <motion.div
                  key={item.id}
                  variants={scaleIn}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-card transition-smooth hover:shadow-elegant"
                >
                  <Link
                    to="/galeria/$slug"
                    params={{ slug: item.slug }}
                    className="absolute right-3 top-3 z-20 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-brand shadow hover:bg-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Página
                  </Link>
                  <button
                    type="button"
                    className="absolute inset-0 z-10"
                    aria-label={`Ampliar ${item.title}`}
                    onClick={() => setLightboxImage({ url: cover, title: item.title, slug: item.slug })}
                  />
                  <img
                    src={cover}
                    alt={item.title}
                    className="h-full w-full object-cover transition-smooth duration-500 group-hover:scale-110 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-smooth group-hover:opacity-100 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 z-0 p-4 pointer-events-none">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gold">{categoryLabel(item.category)}</p>
                    <p className="text-sm font-bold text-white drop-shadow">{item.title}</p>
                    {item.client_name && <p className="text-xs text-white/75 mt-0.5">{item.client_name}</p>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30"
              >
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Palette className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Em breve</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── REDES SOCIAIS ────────────────────────────────── */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="h-px w-10 bg-brand" />
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Siga-nos</span>
              <div className="h-px w-10 bg-brand" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Conecte-se connosco</h2>
            <p className="mt-3 text-muted-foreground">Acompanhe as nossas novidades e promoções exclusivas</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-2 hover:shadow-elegant hover:border-brand/30"
              >
                {/* Icon background */}
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${social.bgLight} transition-smooth group-hover:scale-110`}>
                  <social.icon className={`h-7 w-7 ${social.textColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground">{social.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{social.handle}</p>

                {/* CTA */}
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                  Seguir <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>

                {/* Hover effect */}
                <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 pb-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-14 text-brand-foreground shadow-elegant">
          {/* Decorative */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gold/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-brand-foreground/5 blur-2xl" />
          <div className="pointer-events-none absolute top-0 right-0 w-1/3 h-full opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="relative grid md:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">Pronto para começar?</p>
              <h2 className="text-2xl md:text-4xl font-extrabold leading-tight">
                "Da impressão à tecnologia,<br className="hidden sm:block" /> resolvemos tudo por si."
              </h2>
              <p className="mt-4 text-brand-foreground/75 max-w-lg">Qualidade, rapidez e confiança num só lugar. Venha visitar-nos ou faça o seu pedido online agora.</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-2 text-sm max-w-lg">
                {["Atendimento personalizado", "Preços acessíveis", "Equipa qualificada", "Pedido online 24h"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <Link to="/loja/checkout"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth">
                Fazer Pedido Online
              </Link>
              <Link to="/orcamento"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-foreground/30 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold hover:bg-white/20 transition-smooth">
                Pedir Orçamento
              </Link>
              <a href="tel:+258874383621"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-foreground/20 px-6 py-3.5 text-sm font-medium text-brand-foreground/80 hover:bg-white/10 transition-smooth">
                <Phone className="h-4 w-4" /> 874 383 621
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HUB ACADÉMICO ────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 pb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="rounded-3xl bg-gradient-hero text-brand-foreground overflow-hidden relative">
            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative grid lg:grid-cols-2 gap-0">
              {/* Left: info */}
              <div className="p-8 md:p-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-5">
                  <BookOpen className="h-3.5 w-3.5" /> GISEVERAL HUB — PLATAFORMA ACADÉMICA
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                  Bolsas, documentos e exames para estudantes
                </h2>
                <p className="text-brand-foreground/80 mb-6 max-w-md">
                  Acede a exames resolvidos, trabalhos académicos e bolsas internacionais. Partilha e ganha créditos.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: FileText, label: "Documentos", desc: "Exames e trabalhos" },
                    { icon: GraduationCap, label: "Bolsas", desc: "Chevening, DAAD…" },
                    { icon: Crown, label: "Premium", desc: "Downloads ilimitados" },
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-3 text-center">
                      <f.icon className="h-5 w-5 text-gold mx-auto mb-1" />
                      <p className="text-xs font-bold">{f.label}</p>
                      <p className="text-[10px] text-brand-foreground/60">{f.desc}</p>
                    </div>
                  ))}
                </div>
                <Link
                  to="/hub"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                >
                  Entrar no Hub <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right: recent news */}
              <div className="bg-black/20 p-6 md:p-8 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wider text-gold mb-4">Últimas notícias educativas</p>
                <div className="space-y-3">
                  {news.map((n) => (
                    <Link
                      key={n.id}
                      to="/hub/noticias/$id"
                      params={{ id: n.id }}
                      className="flex items-start gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-3 transition-smooth group"
                    >
                      <span className="inline-flex items-center rounded-full bg-gold/20 text-gold px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 mt-0.5">
                        {n.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight group-hover:text-gold transition-colors line-clamp-2">{n.title}</p>
                        <p className="text-[10px] text-brand-foreground/50 mt-1 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> {new Date(n.date).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-brand-foreground/30 group-hover:text-gold flex-shrink-0 mt-0.5 transition-colors" />
                    </Link>
                  ))}
                </div>
                <Link to="/hub/bolsas" className="mt-4 text-xs text-gold/70 hover:text-gold transition-colors font-medium flex items-center gap-1">
                  Ver todas as notícias <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────── */}
      <section className="container mx-auto max-w-6xl px-4 pb-16">
        <NewsletterSignup variant="inline" />
      </section>

      {/* ── PROMO BANNER ─────────────────────────────────── */}
      <PromoBanner />

      {/* ── POPUP ────────────────────────────────────────── */}
      <PromoPopup />

      <WhatsAppFab />

      {/* ── LIGHTBOX ─────────────────────────────────────── */}
      {lightboxImage && (
        <Lightbox
          image={lightboxImage.url}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
          actions={
            <Link
              to="/galeria/$slug"
              params={{ slug: lightboxImage.slug }}
              className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-gold-foreground shadow-lg hover:opacity-95"
              onClick={() => setLightboxImage(null)}
            >
              Abrir página do projecto
            </Link>
          }
        />
      )}
    </Layout>
  );
}

function HomeHeroCollage() {
  const { images, isLoading } = useHeroImages("home");
  const count = images.length;

  if (isLoading) {
    return (
      <div className="order-1 lg:order-2 relative h-[440px] md:h-[520px]">
        <div className="absolute top-0 left-0 w-[30%] h-[160px] rounded-2xl bg-muted animate-pulse" />
        <div className="absolute top-2 right-0 w-[68%] h-[320px] rounded-3xl bg-muted animate-pulse" />
        <div className="absolute bottom-2 left-0 w-[42%] h-[220px] rounded-2xl bg-muted animate-pulse" />
        <div className="absolute bottom-6 right-6 w-[45%] h-[200px] rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="order-1 lg:order-2 relative h-[440px] md:h-[520px]">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand via-brand/80 to-blue-700 grid place-items-center text-center p-8">
          <div>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="text-white font-bold text-lg">Sem imagens ainda</p>
            <p className="mt-2 text-sm text-white/80 max-w-xs mx-auto">
              Adiciona imagens no painel admin em <span className="font-mono font-bold">/balcao/hero</span>.
            </p>
            <Link
              to="/balcao/hero"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand hover:bg-slate-100 transition-smooth"
            >
              Abrir gestor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (count === 1) {
    const img = images[0];
    return (
      <div className="order-1 lg:order-2 relative h-[440px] md:h-[520px] flex items-center justify-center">
        <motion.div
          className="relative w-full h-[400px] md:h-[480px] rounded-3xl overflow-hidden border-[3px] border-white shadow-elegant"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.4 },
            scale: { duration: 0.6, delay: 0.4 },
            y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
          }}
        >
          <img src={img.image_url} alt={img.title ?? "Hero"} className="h-full w-full object-cover" />
        </motion.div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="order-1 lg:order-2 relative h-[440px] md:h-[520px] grid grid-cols-2 gap-4">
        {images.slice(0, 2).map((img, i) => (
          <motion.div
            key={img.id}
            className="relative rounded-3xl overflow-hidden border-[3px] border-white shadow-elegant"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, i === 0 ? -8 : -10, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.4 + i * 0.15 },
              y: { repeat: Infinity, duration: 5 + i, ease: "easeInOut", delay: i * 0.8 },
            }}
          >
            <img src={img.image_url} alt={img.title ?? "Hero"} className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    const [a, b, c] = images;
    return (
      <div className="order-1 lg:order-2 relative h-[440px] md:h-[520px]">
        <motion.div
          className="absolute top-2 right-0 w-[60%] h-[320px] rounded-3xl overflow-hidden border-[3px] border-white shadow-elegant z-20"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.35 },
            x: { duration: 0.6, delay: 0.35 },
            y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
          }}
        >
          <img src={a.image_url} alt={a.title ?? "Hero"} className="h-full w-full object-cover" />
        </motion.div>
        <motion.div
          className="absolute bottom-2 left-0 w-[48%] h-[240px] rounded-2xl overflow-hidden border-[3px] border-white shadow-elegant z-30"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.55 },
            x: { duration: 0.6, delay: 0.55 },
            y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 },
          }}
        >
          <img src={b.image_url} alt={b.title ?? "Hero"} className="h-full w-full object-cover" />
        </motion.div>
        <motion.div
          className="absolute bottom-8 right-4 w-[42%] h-[180px] rounded-2xl overflow-hidden border-[3px] border-white shadow-elegant z-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.75 },
            y: { repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.5 },
          }}
        >
          <img src={c.image_url} alt={c.title ?? "Hero"} className="h-full w-full object-cover" />
        </motion.div>
      </div>
    );
  }

  // 4+ images — full collage
  const [a, b, c, d] = images;
  return (
    <div className="order-1 lg:order-2 relative h-[440px] md:h-[520px]">
      <motion.div
        className="absolute top-0 left-0 w-[30%] h-[160px] rounded-2xl overflow-hidden border-[3px] border-white shadow-elegant z-10"
        initial={{ opacity: 0, y: -20, rotate: -6 }}
        animate={{ opacity: 1, y: [0, -6, 0], rotate: -3 }}
        transition={{
          opacity: { duration: 0.6, delay: 0.5 },
          y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 },
          rotate: { duration: 0.6, delay: 0.5 },
        }}
      >
        <img src={d.image_url} alt={d.title ?? "Hero"} className="h-full w-full object-cover" />
      </motion.div>

      <motion.div
        className="absolute top-2 right-0 w-[68%] h-[320px] rounded-3xl overflow-hidden border-[3px] border-white shadow-elegant z-20"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.35 },
          x: { duration: 0.6, delay: 0.35 },
          y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
        }}
      >
        <img src={a.image_url} alt={a.title ?? "Hero"} className="h-full w-full object-cover" />
      </motion.div>

      <motion.div
        className="absolute bottom-2 left-0 w-[42%] h-[220px] rounded-2xl overflow-hidden border-[3px] border-white shadow-elegant z-30"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.6 },
          x: { duration: 0.6, delay: 0.6 },
          y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 },
        }}
      >
        <img src={b.image_url} alt={b.title ?? "Hero"} className="h-full w-full object-cover" />
      </motion.div>

      <motion.div
        className="absolute bottom-6 right-6 w-[45%] h-[200px] rounded-2xl overflow-hidden border-[3px] border-white shadow-elegant z-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.75 },
          y: { repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.5 },
        }}
      >
        <img src={c.image_url} alt={c.title ?? "Hero"} className="h-full w-full object-cover" />
      </motion.div>

      <motion.div
        className="absolute top-[140px] -left-2 md:-left-6 z-40 rounded-2xl bg-white px-4 py-3 shadow-elegant flex items-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.95 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold">
          <Award className="h-5 w-5 text-gold-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">+10 anos</p>
          <p className="text-[11px] text-muted-foreground">de experiência</p>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-2 -right-2 md:-right-4 z-40 rounded-2xl bg-white px-4 py-3 shadow-elegant flex items-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.05 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
          <Users className="h-5 w-5 text-brand" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">5 000+</p>
          <p className="text-[11px] text-muted-foreground">clientes</p>
        </div>
      </motion.div>
    </div>
  );
}

function HeroMetric({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <div ref={ref} className="rounded-xl border border-border bg-card/60 px-2 py-2.5 text-center">
      <p className="text-base md:text-lg font-extrabold text-brand leading-none tabular-nums">
        {displayed.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

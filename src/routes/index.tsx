import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TypewriterText } from "@/components/TypewriterText";
import { PromoBanner } from "@/components/promos/PromoBanner";
import { PromoSlider } from "@/components/promos/PromoSlider";
import { MiniBanner } from "@/components/promos/MiniBanner";
import { PromoPopup } from "@/components/promos/PromoPopup";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import {
  Printer, Laptop, Network, BookOpen, ArrowRight, CheckCircle2, Phone,
  Clock, Map, Zap, ShieldCheck, Award,
} from "lucide-react";
import printing from "@/assets/printing.jpg";
import repair from "@/assets/computer-repair.jpg";
import network from "@/assets/network.jpg";
import heroBg from "@/assets/hero-bg.jpg";

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
  { icon: CheckCircle2, value: "Qualidade",    label: "Garantida em todos os serviços" },
  { icon: Clock,        value: "Seg–Sáb",      label: "8h00 às 17h00" },
  { icon: Map,          value: "Beira",         label: "Esturro · Rua Alfredo Lawley" },
  { icon: Phone,        value: "874 383 621",   label: "WhatsApp e chamadas" },
];

const highlights = [
  { icon: Printer,  title: "Reprografia",       desc: "Impressão, fotocópias, encadernação e plastificação a preços acessíveis.",    slug: "reprografia" as const },
  { icon: Laptop,   title: "Informática",        desc: "Formatação, Windows, remoção de vírus e instalação de programas.",            slug: "informatica" as const },
  { icon: Network,  title: "Redes & Wi-Fi",      desc: "Instalação de routers, LAN, cabeamento e extensão de sinal Wi-Fi.",           slug: "redes" as const },
  { icon: BookOpen, title: "Papelaria",           desc: "Material escolar e de escritório — cadernos, canetas, pastas e mais.",        slug: "papelaria" as const },
];

const whyUs = [
  { icon: Zap,         title: "Resposta rápida",    desc: "Atendimento em menos de 1 hora e entrega no mesmo dia para a maioria dos serviços." },
  { icon: ShieldCheck, title: "Garantia de qualidade", desc: "Trabalhamos com equipamentos modernos e materiais de qualidade comprovada." },
  { icon: Award,       title: "Equipa experiente",  desc: "Mais de 10 anos a servir estudantes, empresas e famílias na Beira." },
  { icon: CheckCircle2,title: "Preços transparentes", desc: "Sem cobranças ocultas. O preço que vê é o que paga." },
];

function Index() {
  return (
    <Layout>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative text-white overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/85 via-brand/55 to-brand/20" />
        {/* Bottom fade into stats */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-brand/60 to-transparent" />

        <div className="container mx-auto px-4 pt-14 pb-10 md:pt-20 md:pb-14 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: text */}
            <div className="[text-shadow:_0_2px_12px_rgb(0_0_0_/_50%)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/25 px-3 py-1 text-xs font-bold tracking-widest text-gold uppercase backdrop-blur-sm">
                ✦ Giseveral e Services · Soluções profissionais na Beira
              </span>
              <h1 className="mt-5 font-extrabold leading-[1.15] text-white">
                <span className="text-white/90 text-3xl md:text-4xl font-semibold">Bem-vindo à</span><br />
                <span className="text-gold">Giseveral e Services</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/90 min-h-[2.5rem]">
                <TypewriterText phrases={typewriterPhrases} className="text-gold font-semibold" />
              </p>
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-md">
                Transformamos ideias em soluções reais com qualidade, rapidez e confiança.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/servicos"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
                >
                  Ver Serviços <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/loja/papelaria"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 border border-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-smooth"
                >
                  <BookOpen className="h-4 w-4" /> Ir à Loja
                </Link>
                <a
                  href="tel:+258874383621"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition-smooth"
                >
                  <Phone className="h-4 w-4" /> Ligar agora
                </a>
              </div>
            </div>

            {/* Right: carousel */}
            <div className="w-full">
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROMO SLIDER (desktop only, auto) ───────────── */}
      <PromoSlider />

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="bg-brand text-brand-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 px-4 text-center sm:text-left">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-foreground/10">
                  <s.icon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gold leading-none">{s.value}</p>
                  <p className="text-xs text-brand-foreground/65 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MINI BANNER (dismissable strip) ─────────────── */}
      <MiniBanner />

      {/* ── HIGHLIGHTS ───────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-bold tracking-wider text-gold uppercase">O que fazemos</span>
          <h2 className="mt-4 font-bold text-brand">Os nossos serviços</h2>
          <p className="mt-3 text-muted-foreground">Tudo o que a sua empresa, escola ou casa precisa — num só endereço.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((h) => (
            <Link
              key={h.title}
              to="/servicos/$slug"
              params={{ slug: h.slug }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1.5 hover:shadow-elegant hover:border-gold/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground group-hover:scale-110">
                <h.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-brand">{h.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold opacity-0 group-hover:opacity-100 transition-smooth">
                Saber mais <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SERVICES PREVIEW ─────────────────────────────── */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-bold tracking-wider text-gold uppercase">Trabalhos reais</span>
            <h2 className="mt-4 font-bold text-brand">Veja o nosso trabalho</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: printing, title: "Reprografia",  text: "Impressão a cores e P&B, fotocópias, encadernação e plastificação com materiais de qualidade.", slug: "reprografia" },
              { img: repair,   title: "Informática",  text: "Formatação, instalação de Windows, remoção de vírus e diagnóstico rápido de hardware.", slug: "informatica" },
              { img: network,  title: "Redes",        text: "Instalação Wi-Fi, redes LAN, routers e cabeamento estruturado para residências e empresas.", slug: "redes" },
            ].map((s) => (
              <Link
                key={s.title}
                to="/servicos/$slug"
                params={{ slug: s.slug }}
                className="group overflow-hidden rounded-2xl bg-card shadow-card transition-smooth hover:shadow-elegant"
              >
                <div className="aspect-video overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" className="h-full w-full object-cover transition-smooth duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-brand group-hover:text-gold transition-colors">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:text-gold transition-colors">
                    Ver mais <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORQUÊ ESCOLHER-NOS ───────────────────────────── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-bold tracking-wider text-gold uppercase">Porquê nós</span>
          <h2 className="mt-4 font-bold text-brand">O que nos torna diferentes</h2>
          <p className="mt-3 text-muted-foreground">Mais de uma década a servir a Beira com compromisso e qualidade.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {whyUs.map((w) => (
            <div key={w.title} className="rounded-2xl border border-border bg-card p-6 shadow-card hover:border-gold/30 hover:shadow-elegant transition-smooth">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground mb-4">
                <w.icon className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-brand">{w.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-gradient-hero p-8 md:p-12 text-brand-foreground shadow-elegant overflow-hidden relative">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-glow/20 blur-2xl pointer-events-none" />

          <div className="relative grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Pronto para começar?</p>
              <h2 className="font-extrabold">"Da impressão à tecnologia,<br className="hidden sm:block" /> resolvemos tudo por si."</h2>
              <p className="mt-3 text-brand-foreground/75 max-w-lg">Qualidade, rapidez e confiança num só lugar. Venha visitar-nos ou faça o seu pedido online agora.</p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
                {["Atendimento personalizado", "Preços acessíveis", "Equipa qualificada", "Pedido online 24h"].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/loja/checkout"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
              >
                Fazer Pedido Online
              </Link>
              <Link
                to="/orcamento"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-foreground/30 bg-white/10 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-white/20 transition-smooth"
              >
                Pedir Orçamento
              </Link>
              <a
                href="tel:+258874383621"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-foreground/20 px-6 py-3 text-sm font-medium text-brand-foreground/80 hover:text-brand-foreground hover:bg-white/10 transition-smooth"
              >
                <Phone className="h-4 w-4" /> 874 383 621
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16">
        <NewsletterSignup variant="inline" />
      </section>

      {/* ── PROMO BANNER (full campaign section) ────────── */}
      <PromoBanner />

      {/* ── POPUP (desktop, once per session) ───────────── */}
      <PromoPopup />

      <WhatsAppFab />
    </Layout>
  );
}

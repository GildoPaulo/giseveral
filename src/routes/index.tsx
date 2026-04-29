import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TypewriterText } from "@/components/TypewriterText";
import { Printer, Laptop, Network, BookOpen, ArrowRight, CheckCircle2, Phone } from "lucide-react";
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

const highlights = [
  { icon: Printer, title: "Reprografia profissional", desc: "Impressões, cópias, encadernação e plastificação." },
  { icon: Laptop, title: "Assistência informática", desc: "Formatação, instalação de Windows e remoção de vírus." },
  { icon: Network, title: "Instalação de redes", desc: "Wi-Fi, LAN, routers e cabeamento estruturado." },
  { icon: BookOpen, title: "Papelaria completa", desc: "Material escolar e de escritório de qualidade." },
];

const typewriterPhrases = [
  "Impressão rápida e profissional de documentos",
  "Assistência informática e formatação de computadores",
  "Instalação e configuração de redes Wi-Fi e LAN",
  "Papelaria completa para estudantes e empresas",
  "Design gráfico e criação de materiais publicitários",
  "Soluções tecnológicas rápidas e confiáveis",
];

function Index() {
  return (
    <Layout>
      {/* HERO: welcome banner + typewriter + carousel side-by-side */}
      <section
        className="relative text-white"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* very light overlay just to slightly tint and improve contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/70 via-brand/30 to-transparent" />
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="[text-shadow:_0_2px_8px_rgb(0_0_0_/_45%)]">
              <span className="inline-block rounded-full border border-gold/60 bg-gold/25 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase backdrop-blur-sm">
                Giseveral e Services
              </span>
              <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                Bem-vindo à Giseveral e Services
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/95 min-h-[3.5rem] md:min-h-[3rem]">
                <TypewriterText phrases={typewriterPhrases} className="text-gold" />
              </p>
              <p className="mt-4 text-sm md:text-base text-white/85">
                Da impressão à tecnologia, resolvemos tudo por si.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/servicos"
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
                >
                  Ver Serviços <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contactos"
                  className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Phone className="h-4 w-4" /> Contactar
                </Link>
              </div>
            </div>

            <div className="w-full">
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand">Os nossos destaques</h2>
          <p className="mt-3 text-muted-foreground">Tudo o que a sua empresa, escola ou casa precisa, num só lugar.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((h) => (
            <div key={h.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                <h.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand">{h.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: printing, title: "Reprografia", text: "Impressão a cores, P&B, fotocópias, encadernação e plastificação." },
              { img: repair, title: "Informática", text: "Formatação, instalação de Windows, remoção de vírus e otimização." },
              { img: network, title: "Redes", text: "Instalação Wi-Fi, LAN, routers e cabeamento estruturado." },
            ].map((s) => (
              <article key={s.title} className="overflow-hidden rounded-xl bg-card shadow-card transition-smooth hover:shadow-elegant">
                <div className="aspect-video overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" className="h-full w-full object-cover transition-smooth hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-brand">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-hero p-8 md:p-12 text-brand-foreground shadow-elegant">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold">"Da impressão à tecnologia, resolvemos tudo por si."</h2>
              <p className="mt-3 text-brand-foreground/75">Qualidade, rapidez e confiança num só lugar.</p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
                {["Atendimento personalizado", "Preços acessíveis", "Equipa qualificada", "Entrega rápida"].map((i) => (
                  <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold" /> {i}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/contactos" className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
                Pedir Orçamento
              </Link>
              <a href="tel:+258874383621" className="inline-flex items-center justify-center gap-2 rounded-md border border-brand-foreground/30 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/10">
                <Phone className="h-4 w-4" /> 874 383 621
              </a>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

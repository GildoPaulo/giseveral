import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentCard } from "@/components/DocumentCard";
import { CATEGORIES, getPopularDocs, getRecentDocs, DOCUMENTS } from "@/data/documents";
import { SITE } from "@/data/site";
import {
  Search, Upload, Printer, Coins, Crown, FileText, TrendingUp,
  ShieldCheck, ArrowRight, UserPlus, Eye, Download, Heart, Zap, CheckCircle2,
} from "lucide-react";
import printingImg from "@/assets/hero-printing.jpg";
import { Testimonials } from "@/components/Testimonials";
import { SEO } from "@/components/SEO";

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const popular = getPopularDocs(4);
  const recent = getRecentDocs(4);
  const totalDocs = DOCUMENTS.length;
  const totalDownloads = DOCUMENTS.reduce((s, d) => s + d.downloads, 0);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/explorar${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <Layout>
      <SEO
        title="Giseveral Hub — Documentos académicos e bolsas de estudo MZ"
        description="Plataforma moçambicana para partilhar PDFs académicos, encontrar bolsas de estudo internacionais, ler notícias educativas e imprimir num clique."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Giseveral Hub",
          url: typeof window !== "undefined" ? window.location.origin : "",
          potentialAction: {
            "@type": "SearchAction",
            target: `${typeof window !== "undefined" ? window.location.origin : ""}/explorar?q={query}`,
            "query-input": "required name=query",
          },
        }}
      />
      {/* 1. HERO CARROSSEL */}
      <HeroCarousel />

      {/* 2. BARRA DE PESQUISA — coração da plataforma */}
      <section className="relative -mt-10 z-30 container mx-auto container-px">
        <form
          onSubmit={onSearch}
          className="rounded-2xl bg-card border border-border shadow-elegant p-3 sm:p-4 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Procure exames, trabalhos, PDFs, sebentas..."
              className="h-14 pl-12 text-base border-0 bg-transparent focus-visible:ring-0 shadow-none"
            />
          </div>
          <Button type="submit" variant="default" size="xl" className="h-14">
            <Search className="h-5 w-5" /> Pesquisar
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2 mt-3 px-2 text-xs text-muted-foreground">
          <span className="font-medium">Populares:</span>
          {["Matemática", "Direito", "Contabilidade", "CV", "Engenharia"].map((t) => (
            <Link key={t} to={`/explorar?q=${encodeURIComponent(t)}`}
              className="px-2.5 py-1 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-smooth">
              {t}
            </Link>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto container-px py-12">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
          {[
            { v: `${totalDocs}+`, l: "Documentos" },
            { v: `${totalDownloads.toLocaleString()}+`, l: "Downloads" },
            { v: "12k+", l: "Estudantes" },
          ].map((s) => (
            <div key={s.l} className="text-center rounded-xl bg-card border border-border p-4 shadow-card">
              <div className="text-2xl sm:text-3xl font-display font-extrabold text-primary">{s.v}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CATEGORIAS VISUAIS */}
      <section className="container mx-auto container-px py-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl">Categorias</h2>
            <p className="text-sm text-muted-foreground">Encontre rapidamente o que procura</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/categorias">Ver todas <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/explorar?cat=${c.id}`}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth"
            >
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-smooth" />
              <div className="relative text-4xl mb-3">{c.icon}</div>
              <h3 className="relative font-display font-bold text-lg mb-1 group-hover:text-primary transition-smooth">{c.label}</h3>
              <p className="relative text-xs text-muted-foreground line-clamp-2">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. DOCUMENTOS EM DESTAQUE */}
      <section className="container mx-auto container-px py-16">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl">Documentos em destaque</h2>
              <p className="text-sm text-muted-foreground">Os mais baixados pela comunidade</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/explorar">Ver tudo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popular.map((d) => <DocumentCard key={d.id} doc={d} />)}
        </div>
      </section>

      {/* 5. COMO FUNCIONA — 3 passos */}
      <section className="bg-secondary/50 py-16">
        <div className="container mx-auto container-px">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-3">
              <Zap className="h-3.5 w-3.5" /> SIMPLES E RÁPIDO
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">Como funciona</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Em apenas 3 passos você tem o que precisa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 relative">
            {[
              { icon: Search, title: "1. Procure", desc: "Encontre exames, trabalhos ou livros pesquisando ou navegando por categorias." },
              { icon: Eye, title: "2. Visualize", desc: "Pré-visualize com marca d'água antes de descarregar — totalmente grátis." },
              { icon: Download, title: "3. Baixe", desc: `Use ${SITE.creditsPerDownload} crédito por download ou seja Premium para downloads ilimitados.` },
            ].map((s, i) => (
              <div key={i} className="relative rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-smooth text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground mb-4 shadow-elegant">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CHAMADA PARA REGISTO */}
      <section className="container mx-auto container-px py-16">
        <div className="rounded-3xl bg-card border-2 border-accent/30 overflow-hidden grid lg:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-bold mb-4">
              <UserPlus className="h-3.5 w-3.5" /> CONTA GRÁTIS
            </div>
            <h3 className="font-display font-extrabold text-3xl sm:text-4xl mb-4 text-balance">
              Crie a sua conta e ganhe <span className="text-accent">{SITE.initialCredits} créditos</span> grátis
            </h3>
            <ul className="space-y-3 mb-7">
              {[
                "Baixe documentos académicos",
                "Guarde os seus favoritos",
                `Ganhe ${SITE.creditsPerUpload} créditos por cada upload`,
                "Aceda a conteúdos exclusivos",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link to="/login">Criar conta grátis <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/explorar">Explorar primeiro</Link>
              </Button>
            </div>
          </div>
          <div className="relative bg-gradient-hero hidden lg:flex items-center justify-center p-10 overflow-hidden">
            <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-3 w-full max-w-xs">
              {[
                { icon: Heart, label: "Favoritos" },
                { icon: Coins, label: "Créditos" },
                { icon: Upload, label: "Uploads" },
                { icon: Download, label: "Downloads" },
              ].map((f) => (
                <div key={f.label} className="aspect-square rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-primary-foreground">
                  <f.icon className="h-7 w-7 mb-1 text-accent" />
                  <span className="text-xs font-semibold">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RECENTES */}
      <section className="container mx-auto container-px pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl">Adicionados recentemente</h2>
            <p className="text-sm text-muted-foreground">As partilhas mais recentes da comunidade</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recent.map((d) => <DocumentCard key={d.id} doc={d} />)}
        </div>
      </section>

      {/* TESTEMUNHOS */}
      <Testimonials />


      <section className="container mx-auto container-px pb-16">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 sm:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center shadow-elegant overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-4">
              <Crown className="h-3.5 w-3.5" /> GISEVERAL PREMIUM
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl mb-3">Sem anúncios. Downloads ilimitados.</h3>
            <p className="opacity-90 max-w-xl mb-2">Por apenas {SITE.premiumMonthly} MZN/mês, descarregue tudo o que quiser.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-90">
              <span>✓ Sem anúncios</span>
              <span>✓ Downloads ilimitados</span>
              <span>✓ Suporte prioritário</span>
            </div>
          </div>
          <Button asChild variant="hero" size="xl" className="relative">
            <Link to="/premium">Tornar Premium <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* 8. INTEGRAÇÃO COM GISEVERAL & SERVICES */}
      <section className="container mx-auto container-px pb-16">
        <div className="relative rounded-3xl overflow-hidden border border-border shadow-card">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12 bg-card">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-4">
                <Printer className="h-3.5 w-3.5" /> GRÁFICA GISEVERAL & SERVICES
              </div>
              <h3 className="font-display font-extrabold text-3xl sm:text-4xl mb-4 text-balance">
                Precisa imprimir um documento?
              </h3>
              <p className="text-muted-foreground mb-6">
                Encontre o documento, clique em <strong>Imprimir</strong> e receba o orçamento na hora directamente no WhatsApp da gráfica.
              </p>
              <ul className="space-y-3 mb-7">
                {[
                  { t: "Impressão rápida", d: "Receba em poucas horas" },
                  { t: "Qualidade profissional", d: "P&B e cor, papel premium" },
                  { t: "Orçamento instantâneo", d: `Desde ${SITE.pricePerPageBW} MZN por página` },
                ].map((f) => (
                  <li key={f.t} className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{f.t}</div>
                      <div className="text-sm text-muted-foreground">{f.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Button asChild size="xl" variant="default">
                <Link to="/explorar">Ir para Giseveral & Services <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
            <div className="relative min-h-[320px] lg:min-h-0">
              <img
                src={printingImg}
                alt="Gráfica Giseveral em operação"
                width={1600}
                height={900}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="container mx-auto container-px pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Documentos verificados", desc: "Moderação activa pela comunidade" },
            { icon: FileText, title: "Pré-visualização grátis", desc: "Veja antes de descarregar" },
            { icon: Printer, title: "Impressão num clique", desc: "Direto à Gráfica Giseveral" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl bg-card border border-border p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary shrink-0">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-0.5">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;

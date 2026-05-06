import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, FormEvent } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { DocumentCard } from "@/components/hub/DocumentCard";
import { HUB_DOCUMENTS, DOC_CATEGORIES, type DocItem } from "@/data/hub-documents";
import { fetchHubDocuments } from "@/lib/hub";
import { HUB_SITE as SITE } from "@/data/hub-site";
import {
  Search, Upload, Printer, Crown, FileText, TrendingUp,
  ShieldCheck, ArrowRight, UserPlus, Eye, Download, CheckCircle2, Zap, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/hub/")({
  head: () => ({
    meta: [
      { title: "Giseveral Hub — Documentos académicos e bolsas de estudo MZ" },
      { name: "description", content: "Plataforma moçambicana para partilhar PDFs académicos, encontrar bolsas de estudo internacionais e imprimir num clique." },
      { property: "og:title", content: "Giseveral Hub — Documentos académicos MZ" },
    ],
  }),
  component: HubIndexPage,
});

function HubIndexPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [allDocs, setAllDocs] = useState<DocItem[]>(HUB_DOCUMENTS);

  useEffect(() => {
    fetchHubDocuments().then(setAllDocs);
  }, []);

  const popular = useMemo(() => [...allDocs].sort((a, b) => b.downloads - a.downloads).slice(0, 4), [allDocs]);
  const recent = useMemo(() => [...allDocs].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, 4), [allDocs]);
  const totalDownloads = useMemo(() => allDocs.reduce((s, d) => s + d.downloads, 0), [allDocs]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/hub/explorar", search: q.trim() ? { q: q.trim() } : {} });
  };

  return (
    <Layout>
      {/* HERO */}
      <section className="bg-gradient-hero text-brand-foreground">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-4">
            <BookOpen className="h-3.5 w-3.5" /> GISEVERAL HUB — PLATAFORMA ACADÉMICA
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            Documentos académicos<br />
            <span className="text-gold">de Moçambique</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-foreground/80 max-w-2xl mb-8">
            Exames, sebentas, trabalhos e bolsas de estudo — tudo partilhado pela comunidade estudantil moçambicana.
          </p>
          <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2 bg-white/95 text-foreground rounded-2xl p-2 shadow-elegant max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Procure exames, trabalhos, sebentas..."
                className="w-full h-12 pl-12 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-card transition-smooth hover:shadow-elegant">
              <Search className="h-4 w-4" /> Pesquisar
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-brand-foreground/70">
            <span className="font-semibold">Populares:</span>
            {["Matemática", "Direito", "Contabilidade", "CV", "Engenharia"].map((t) => (
              <Link key={t} to="/hub/explorar" search={{ q: t }}
                className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-smooth">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
          {[
            { v: `${allDocs.length}+`, l: "Documentos" },
            { v: `${totalDownloads.toLocaleString()}+`, l: "Downloads" },
            { v: "12k+", l: "Estudantes" },
          ].map((s) => (
            <div key={s.l} className="text-center rounded-xl bg-card border border-border p-4 shadow-card">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand">{s.v}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 pb-8 max-w-5xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand">Categorias</h2>
            <p className="text-sm text-muted-foreground">Encontre rapidamente o que procura</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {DOC_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to="/hub/explorar"
              search={{ cat: c.id }}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth"
            >
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand/5 group-hover:bg-brand/10 transition-smooth" />
              <div className="relative text-4xl mb-3">{c.icon}</div>
              <h3 className="relative font-bold text-lg mb-1 text-brand group-hover:text-gold transition-smooth">{c.label}</h3>
              <p className="relative text-xs text-muted-foreground line-clamp-2">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* DOCUMENTOS EM DESTAQUE */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold text-gold-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand">Documentos em destaque</h2>
              <p className="text-sm text-muted-foreground">Os mais baixados pela comunidade</p>
            </div>
          </div>
          <Link to="/hub/explorar" className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:gap-2 transition-all">
            Ver tudo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popular.map((d) => <DocumentCard key={d.id} doc={d} />)}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-3">
              <Zap className="h-3.5 w-3.5" /> SIMPLES E RÁPIDO
            </div>
            <h2 className="text-3xl font-bold text-brand mb-3">Como funciona</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Em apenas 3 passos tem o que precisa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Search, title: "1. Procure", desc: "Encontre exames, trabalhos ou livros pesquisando ou navegando por categorias." },
              { icon: Eye, title: "2. Visualize", desc: "Pré-visualize com marca d'água antes de descarregar — totalmente grátis." },
              { icon: Download, title: "3. Baixe", desc: `Use ${SITE.creditsPerDownload} crédito por download ou seja Premium para downloads ilimitados.` },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant transition-smooth text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-hero text-brand-foreground mb-4 shadow-elegant">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-brand">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA REGISTO */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="rounded-3xl bg-card border-2 border-brand/20 overflow-hidden grid lg:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-4">
              <UserPlus className="h-3.5 w-3.5" /> CONTA GRÁTIS
            </div>
            <h3 className="font-extrabold text-3xl sm:text-4xl mb-4 text-brand">
              Crie a sua conta e ganhe <span className="text-gold">{SITE.initialCredits} créditos</span> grátis
            </h3>
            <ul className="space-y-3 mb-7">
              {[
                "Baixe documentos académicos",
                "Guarde os seus favoritos",
                `Ganhe ${SITE.creditsPerUpload} créditos por cada upload`,
                "Aceda a conteúdos exclusivos",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to="/registo" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-card transition-smooth hover:shadow-elegant">
                Criar conta grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/hub/explorar" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-smooth">
                Explorar primeiro
              </Link>
            </div>
          </div>
          <div className="relative bg-gradient-hero hidden lg:flex items-center justify-center p-10 overflow-hidden">
            <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-3 w-full max-w-xs">
              {[
                { icon: FileText, label: "Documentos" },
                { icon: Crown, label: "Premium" },
                { icon: Upload, label: "Uploads" },
                { icon: Download, label: "Downloads" },
              ].map((f) => (
                <div key={f.label} className="aspect-square rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-brand-foreground">
                  <f.icon className="h-7 w-7 mb-1 text-gold" />
                  <span className="text-xs font-semibold">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RECENTES */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand">Adicionados recentemente</h2>
            <p className="text-sm text-muted-foreground">As partilhas mais recentes da comunidade</p>
          </div>
          <Link
            to="/hub/upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-gradient-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
          >
            <Upload className="h-3.5 w-3.5" /> Partilhar
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recent.map((d) => <DocumentCard key={d.id} doc={d} />)}
        </div>
      </section>

      {/* PREMIUM */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <div className="rounded-3xl bg-gradient-hero text-brand-foreground p-8 sm:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center shadow-elegant relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-4">
              <Crown className="h-3.5 w-3.5" /> GISEVERAL PREMIUM
            </div>
            <h3 className="font-bold text-2xl sm:text-3xl mb-3">Sem anúncios. Downloads ilimitados.</h3>
            <p className="opacity-90 max-w-xl mb-2">Por apenas {SITE.premiumMonthly} MZN/mês, descarregue tudo o que quiser.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-90">
              <span>✓ Sem anúncios</span>
              <span>✓ Downloads ilimitados</span>
              <span>✓ Suporte prioritário</span>
            </div>
          </div>
          <Link
            to="/orcamento"
            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
          >
            Tornar Premium <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* BANNERS — BOLSAS + CARTAS */}
      <section className="container mx-auto px-4 pb-4 max-w-5xl grid sm:grid-cols-2 gap-4">
        <Link
          to="/hub/bolsas"
          className="group flex items-center justify-between rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-elegant transition-smooth"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">🎓</div>
            <div>
              <h3 className="font-bold text-brand group-hover:text-gold transition-smooth">Bolsas de estudo 2026</h3>
              <p className="text-sm text-muted-foreground">Chevening, DAAD, Erasmus, Fulbright e mais</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gold shrink-0 group-hover:translate-x-1 transition-smooth" />
        </Link>
        <Link
          to="/hub/cartas"
          className="group flex items-center justify-between rounded-2xl bg-gradient-hero text-brand-foreground p-5 shadow-elegant hover:shadow-glow transition-smooth"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">✉️</div>
            <div>
              <h3 className="font-bold group-hover:text-gold transition-smooth">Cartas Inteligentes</h3>
              <p className="text-sm opacity-80">Gere cartas profissionais em segundos com IA</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gold shrink-0 group-hover:translate-x-1 transition-smooth" />
        </Link>
      </section>

      {/* TRUST */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Documentos verificados", desc: "Moderação activa pela comunidade" },
            { icon: FileText, title: "Pré-visualização grátis", desc: "Veja antes de descarregar" },
            { icon: Printer, title: "Impressão num clique", desc: "Direto à Gráfica Giseveral" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4 rounded-xl bg-card border border-border p-5 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand shrink-0">
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

      <WhatsAppFab />
    </Layout>
  );
}

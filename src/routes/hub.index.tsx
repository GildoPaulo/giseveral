import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, FormEvent, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { DocumentCard } from "@/components/hub/DocumentCard";
import { HUB_DOCUMENTS, DOC_CATEGORIES, type DocItem } from "@/data/hub-documents";
import { fetchHubDocuments } from "@/lib/hub";
import { HUB_SITE as SITE } from "@/data/hub-site";
import {
  Search, Upload, Printer, Crown, FileText, TrendingUp,
  ShieldCheck, ArrowRight, UserPlus, Eye, Download, CheckCircle2, Zap, BookOpen, Newspaper,
  GraduationCap, ScrollText, PenLine, FileSearch,
} from "lucide-react";
import documentsImg from "@/assets/documents.jpg";
import heroBgImg from "@/assets/hero-bg.jpg";
import printingImg from "@/assets/printing.jpg";
import designImg from "@/assets/design.jpg";

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

// ── Animation variants ────────────────────────────────────────────────────────

// ── Hero Slides ───────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    badge: "🎓 Bolsas Internacionais 2026",
    title: "Bolsas de Estudo",
    highlight: "para Moçambicanos",
    sub: "Chevening, DAAD, Erasmus, Fulbright e muito mais. Candidatura assistida pela Giseveral.",
    cta: { label: "Ver bolsas abertas", to: "/hub/bolsas" as const },
    img: documentsImg,
    overlay: "from-brand via-brand/80 to-brand/50",
    icon: GraduationCap,
  },
  {
    badge: "📚 Documentos Académicos",
    title: "Exames, Sebentas",
    highlight: "e Trabalhos",
    sub: "Documentos partilhados pela comunidade estudantil de Moçambique — descarregue gratuitamente.",
    cta: { label: "Explorar documentos", to: "/hub/explorar" as const },
    img: heroBgImg,
    overlay: "from-emerald-900 via-emerald-800/80 to-emerald-700/50",
    icon: FileSearch,
  },
  {
    badge: "📰 Notícias e Oportunidades",
    title: "Fique Sempre",
    highlight: "Informado",
    sub: "Prazos de candidatura, alertas de bolsas e novidades para estudantes em todo Moçambique.",
    cta: { label: "Ver notícias", to: "/hub/noticias" as const },
    img: printingImg,
    overlay: "from-amber-900 via-amber-800/80 to-amber-700/50",
    icon: Newspaper,
  },
  {
    badge: "✉️ Cartas com IA",
    title: "Cartas Profissionais",
    highlight: "em Segundos",
    sub: "Carta de candidatura, motivação ou apresentação — gere automaticamente com inteligência artificial.",
    cta: { label: "Criar carta agora", to: "/hub/cartas" as const },
    img: designImg,
    overlay: "from-purple-900 via-purple-800/80 to-purple-700/50",
    icon: PenLine,
  },
  {
    badge: "📄 CV Builder",
    title: "Crie o Seu CV",
    highlight: "Profissional Grátis",
    sub: "Formulário guiado, pré-visualização em tempo real e exportação para PDF ou Word.",
    cta: { label: "Criar CV agora", to: "/hub/cv" as const },
    img: heroBgImg,
    overlay: "from-rose-900 via-rose-800/80 to-rose-700/50",
    icon: ScrollText,
  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scaleCard: any = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function HubStatCard({ num, suffix, label }: { num: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1400, 1);
      setDisplayed(Math.round((1 - Math.pow(1 - t, 3)) * num));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, num]);

  return (
    <motion.div ref={ref} variants={fadeUp} className="text-center rounded-2xl bg-card border border-border p-5 shadow-card">
      <div className="text-2xl sm:text-4xl font-extrabold text-brand">
        {displayed.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

function HubIndexPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [allDocs, setAllDocs] = useState<DocItem[]>(HUB_DOCUMENTS);
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchHubDocuments().then(setAllDocs);
  }, []);

  const popular = useMemo(() => [...allDocs].sort((a, b) => b.downloads - a.downloads).slice(0, 4), [allDocs]);
  const recent  = useMemo(() => [...allDocs].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, 4), [allDocs]);
  const totalDownloads = useMemo(() => allDocs.reduce((s, d) => s + d.downloads, 0), [allDocs]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide((p) => (p + 1) % HERO_SLIDES.length), 5500);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/hub/explorar", search: q.trim() ? { q: q.trim() } : {} });
  };

  return (
    <Layout>
      {/* ── HERO CAROUSEL ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "clamp(420px, 60vw, 580px)" }}>
        <AnimatePresence initial={false} mode="sync">
          {HERO_SLIDES.map((s, i) => i !== slide ? null : (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              {/* Photo layer */}
              <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ backgroundImage: `url(${s.img})` }}
              />
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${s.overlay}`} />

              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="container mx-auto px-6 md:px-10 max-w-5xl">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold mb-5">
                      {s.badge}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
                      {s.title}<br />
                      <span className="text-gold">{s.highlight}</span>
                    </h1>
                    <p className="text-base md:text-lg text-white/80 max-w-xl mb-8 leading-relaxed">{s.sub}</p>
                    <Link
                      to={s.cta.to}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                    >
                      <s.icon className="h-4 w-4" />
                      {s.cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlide(i); resetTimer(); }}
              className={`h-2 rounded-full transition-all duration-300 ${i === slide ? "bg-gold w-8" : "bg-white/50 w-2 hover:bg-white/75"}`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── SEARCH BAR ────────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-6 max-w-3xl -mt-4 relative z-10">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={onSearch}
          className="flex flex-col sm:flex-row gap-2 bg-card rounded-2xl p-2 shadow-elegant border border-border"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Procure exames, trabalhos, sebentas..."
              className="w-full h-12 pl-12 bg-transparent text-base outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-card transition-smooth hover:shadow-elegant"
          >
            <Search className="h-4 w-4" /> Pesquisar
          </button>
        </motion.form>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground px-1">
          <span className="font-semibold">Populares:</span>
          {["Matemática", "Direito", "Contabilidade", "CV", "Engenharia"].map((t) => (
            <Link key={t} to="/hub/explorar" search={{ q: t }} className="px-2.5 py-1 rounded-full bg-muted hover:bg-accent transition-smooth">
              {t}
            </Link>
          ))}
        </div>
      </section>

      {/* ── FERRAMENTAS RÁPIDAS — CV, Cartas, Bolsas ───────────────────────── */}
      <section className="container mx-auto px-4 pt-6 pb-2 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              to: "/hub/cv" as const,
              icon: ScrollText,
              title: "CV Builder",
              desc: "Templates premium, IA, ATS Score e export PDF.",
              accent: "from-rose-500/10 to-rose-500/0 text-rose-600 border-rose-500/20",
              badge: "✨ Com IA",
            },
            {
              to: "/hub/cartas" as const,
              icon: PenLine,
              title: "Cartas com IA",
              desc: "Gera cartas formais com 7 tons profissionais.",
              accent: "from-purple-500/10 to-purple-500/0 text-purple-600 border-purple-500/20",
              badge: "🤖 Gera com IA",
            },
            {
              to: "/hub/bolsas" as const,
              icon: GraduationCap,
              title: "Bolsas",
              desc: "Dezenas de bolsas internacionais com matching IA.",
              accent: "from-blue-500/10 to-blue-500/0 text-blue-600 border-blue-500/20",
              badge: "🎓 Activas",
            },
          ].map((tool) => (
            <motion.div key={tool.to} variants={scaleCard}>
              <Link
                to={tool.to}
                className={`group flex flex-col h-full rounded-2xl border bg-gradient-to-br ${tool.accent} bg-card p-5 hover:shadow-elegant hover:-translate-y-1 transition-smooth`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl bg-card shadow-sm border border-border`}>
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-card border border-border px-2.5 py-0.5 text-[10px] font-bold">
                    {tool.badge}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-foreground">{tool.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed flex-1">{tool.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                  Abrir <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto"
        >
          {[
            { num: allDocs.length,   suffix: "+",    l: "Documentos" },
            { num: totalDownloads,   suffix: "+",    l: "Downloads" },
            { num: 12000,            suffix: "+",    l: "Estudantes" },
          ].map((s) => (
            <HubStatCard key={s.l} num={s.num} suffix={s.suffix} label={s.l} />
          ))}
        </motion.div>
      </section>

      {/* ── CATEGORIAS ───────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-8 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex items-end justify-between mb-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-brand">Categorias</h2>
            <p className="text-sm text-muted-foreground">Encontre rapidamente o que procura</p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {DOC_CATEGORIES.map((c) => (
            <motion.div key={c.id} variants={scaleCard} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link
                to="/hub/explorar"
                search={{ cat: c.id }}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant transition-smooth flex flex-col h-full"
              >
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand/5 group-hover:bg-brand/10 transition-smooth" />
                <div className="relative text-4xl mb-3">{c.icon}</div>
                <h3 className="relative font-bold text-lg mb-1 text-brand group-hover:text-gold transition-smooth">{c.label}</h3>
                <p className="relative text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── DOCUMENTOS EM DESTAQUE ────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex items-end justify-between mb-6"
        >
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
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {popular.map((d, i) => (
            <motion.div key={d.id} variants={scaleCard} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <DocumentCard doc={d} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-3">
                <Zap className="h-3.5 w-3.5" /> SIMPLES E RÁPIDO
              </div>
              <h2 className="text-3xl font-bold text-brand mb-3">Como funciona</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Em apenas 3 passos tem o que precisa.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Search, title: "1. Procure", desc: "Encontre exames, trabalhos ou livros pesquisando ou navegando por categorias." },
                { icon: Eye, title: "2. Visualize", desc: "Pré-visualize com marca d'água antes de descarregar — totalmente grátis." },
                { icon: Download, title: "3. Baixe", desc: `Use ${SITE.creditsPerDownload} crédito por download ou seja Premium para downloads ilimitados.` },
              ].map((s, i) => (
                <motion.div
                  key={s.title}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant transition-smooth text-center"
                >
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-hero text-brand-foreground mb-4 shadow-elegant">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-brand">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA REGISTO ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-3xl bg-card border-2 border-brand/20 overflow-hidden grid lg:grid-cols-[1.2fr_1fr]"
        >
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
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="relative grid grid-cols-2 gap-3 w-full max-w-xs"
            >
              {[
                { icon: FileText, label: "Documentos" },
                { icon: Crown, label: "Premium" },
                { icon: Upload, label: "Uploads" },
                { icon: Download, label: "Downloads" },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  variants={scaleCard}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="aspect-square rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-brand-foreground cursor-default"
                >
                  <f.icon className="h-7 w-7 mb-1 text-gold" />
                  <span className="text-xs font-semibold">{f.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── RECENTES ─────────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex items-end justify-between mb-6"
        >
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
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {recent.map((d, i) => (
            <motion.div key={d.id} variants={scaleCard} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <DocumentCard doc={d} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── PREMIUM BANNER ───────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-3xl bg-gradient-hero text-brand-foreground p-8 sm:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center shadow-elegant relative overflow-hidden"
        >
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
            to="/hub/creditos"
            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
          >
            Ver planos <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── BANNERS – BOLSAS + CARTAS + NOTICIAS ────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-4 max-w-5xl grid sm:grid-cols-3 gap-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
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
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <Link
            to="/hub/noticias"
            className="group flex items-center justify-between rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-elegant transition-smooth"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Newspaper className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-brand group-hover:text-gold transition-smooth">Notícias</h3>
                <p className="text-sm text-muted-foreground">Bolsas, prazos e oportunidades</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gold shrink-0 group-hover:translate-x-1 transition-smooth" />
          </Link>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
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
        </motion.div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            { icon: ShieldCheck, title: "Documentos verificados", desc: "Moderação activa pela comunidade" },
            { icon: FileText, title: "Pré-visualização grátis", desc: "Veja antes de descarregar" },
            { icon: Printer, title: "Impressão num clique", desc: "Direto à Gráfica Giseveral" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="flex items-start gap-4 rounded-xl bg-card border border-border p-5 shadow-card"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand shrink-0">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-0.5">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

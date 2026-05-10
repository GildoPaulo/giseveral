import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { SkeletonCard } from "@/components/Skeleton";
import { SCHOLARSHIPS, HUB_NEWS, HUB_GUIDES, type Scholarship, type NewsItem } from "@/data/hub-bolsas";
import { fetchScholarships, fetchHubNews } from "@/lib/hub";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Globe, Search, Calendar, ExternalLink, Newspaper,
  BookOpen, Sparkles, ArrowRight, Languages, Wallet, Bell, CheckCircle2,
  MapPin, Filter, Clock, BookMarked, Heart,
} from "lucide-react";
import heroBgImg from "@/assets/hero-bg.jpg";
import designImg from "@/assets/design.jpg";
import documentsImg from "@/assets/documents.jpg";
import printingImg from "@/assets/printing.jpg";
import heroImg from "@/assets/hero.jpg";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/hub/bolsas/")({
  head: () => ({
    meta: [
      { title: "Bolsas de Estudo 2026 — Giseveral Hub" },
      { name: "description", content: "Bolsas de estudo internacionais para estudantes moçambicanos. Chevening, DAAD, Erasmus, Fulbright e mais — actualizado 2026." },
      { property: "og:title", content: "Bolsas de Estudo 2026 — Giseveral Hub" },
    ],
  }),
  component: HubBolsasPage,
});

// ── Hero Slides ───────────────────────────────────────────────────────────────

const BOLSAS_SLIDES = [
  {
    badge: "🇬🇧 Chevening — Reino Unido",
    title: "Estuda no",
    highlight: "Reino Unido",
    sub: "A bolsa mais prestigiada do governo britânico. Mestrado completo, passagem, alojamento e subsídio mensal.",
    img: heroBgImg,
    overlay: "from-brand via-brand/80 to-brand/50",
  },
  {
    badge: "🇩🇪 DAAD — Alemanha",
    title: "Engenharia na",
    highlight: "Alemanha",
    sub: "Bolsa total para mestrado e doutoramento. O DAAD apoia milhares de estudantes africanos anualmente.",
    img: designImg,
    overlay: "from-slate-800 via-slate-700/80 to-slate-600/50",
  },
  {
    badge: "🇪🇺 Erasmus Mundus",
    title: "Estuda em",
    highlight: "Toda a Europa",
    sub: "Programa europeu com bolsas integrais para estudar em 2 ou 3 países europeus consecutivamente.",
    img: documentsImg,
    overlay: "from-blue-900 via-blue-800/80 to-blue-700/50",
  },
  {
    badge: "🇺🇸 Fulbright — EUA",
    title: "Universidades de",
    highlight: "Topo nos EUA",
    sub: "O programa de bolsas mais reconhecido dos Estados Unidos. Mestrado e doutoramento em qualquer área.",
    img: printingImg,
    overlay: "from-rose-900 via-rose-800/80 to-rose-700/50",
  },
  {
    badge: "🇵🇹 Bolsas Lusofonia",
    title: "Estuda em",
    highlight: "Portugal",
    sub: "FCT, Santander, Camões e universidades portuguesas com bolsas exclusivas para estudantes da CPLP.",
    img: heroImg,
    overlay: "from-emerald-900 via-emerald-800/80 to-emerald-700/50",
  },
] as const;

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
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

const COVERAGE_COLOR: Record<string, string> = {
  Total:   "bg-emerald-500/15 text-emerald-600",
  Parcial: "bg-amber-500/15 text-amber-700",
};

const LEVEL_COLOR: Record<string, string> = {
  Licenciatura:  "bg-blue-500/15 text-blue-600",
  Mestrado:      "bg-purple-500/15 text-purple-600",
  Doutoramento:  "bg-brand/10 text-brand",
  Intercâmbio:   "bg-teal-500/15 text-teal-600",
};

// ── Main Page ─────────────────────────────────────────────────────────────────

function HubBolsasPage() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>(SCHOLARSHIPS);
  const [allNews, setAllNews] = useState<NewsItem[]>(HUB_NEWS);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [level, setLevel] = useState("all");
  const [coverage, setCoverage] = useState("all");
  const [recArea, setRecArea] = useState("");
  const [recLevel, setRecLevel] = useState("");
  const [recommended, setRecommended] = useState<Scholarship[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide((p) => (p + 1) % BOLSAS_SLIDES.length), 5500);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  useEffect(() => {
    Promise.all([fetchScholarships(), fetchHubNews()]).then(([sc, news]) => {
      setAllScholarships(sc);
      setAllNews(news);
      setLoaded(true);
    });
  }, []);

  const countries = useMemo(
    () => Array.from(new Set(allScholarships.map((s) => s.country))).sort(),
    [allScholarships],
  );

  const filtered = useMemo(() => allScholarships.filter((s) => {
    if (country !== "all" && s.country !== country) return false;
    if (level !== "all" && s.level !== level) return false;
    if (coverage !== "all" && s.coverage !== coverage) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      return s.title.toLowerCase().includes(t)
        || s.area.toLowerCase().includes(t)
        || s.country.toLowerCase().includes(t)
        || s.institution.toLowerCase().includes(t);
    }
    return true;
  }), [q, country, level, coverage, allScholarships]);

  const featured = allScholarships.filter((s) => s.featured);

  function handleRecommend(e: FormEvent) {
    e.preventDefault();
    const matches = allScholarships.filter((s) => {
      const okLevel = recLevel ? s.level === recLevel : true;
      const okArea = recArea ? s.area.toLowerCase().includes(recArea.toLowerCase()) || s.area === "Várias áreas" : true;
      return okLevel && okArea;
    });
    setRecommended(matches.slice(0, 4));
    toast.success(`${matches.length} bolsas encontradas para o seu perfil`);
  }

  function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Inscrito! Receberá alertas das novas bolsas.");
    (e.currentTarget as HTMLFormElement).reset();
  }

  return (
    <Layout>

      {/* ── HERO CAROUSEL ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "clamp(380px, 55vw, 520px)" }}>
        <AnimatePresence initial={false} mode="sync">
          {BOLSAS_SLIDES.map((s, i) => i !== slide ? null : (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${s.img})` }} />
              <div className={`absolute inset-0 bg-gradient-to-r ${s.overlay}`} />
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
                      {s.title}<br /><span className="text-gold">{s.highlight}</span>
                    </h1>
                    <p className="text-base md:text-lg text-white/80 max-w-xl mb-8 leading-relaxed">{s.sub}</p>
                    <button
                      type="button"
                      onClick={() => document.getElementById("bolsas-search")?.focus()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                    >
                      <Search className="h-4 w-4" /> Pesquisar bolsas <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {BOLSAS_SLIDES.map((_, i) => (
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
      <section className="container mx-auto px-4 py-5 max-w-3xl -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-2 bg-card rounded-2xl p-2 shadow-elegant border border-border"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="bolsas-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="País, área ou universidade..."
              className="h-12 pl-12 border-0 bg-transparent focus-visible:ring-0 shadow-none"
            />
          </div>
          <div className="flex flex-wrap gap-1 items-center px-1">
            {["Chevening", "DAAD", "Erasmus"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setQ(t)}
                className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/70 hover:bg-brand hover:text-white transition-smooth"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── BOLSAS EM DESTAQUE ────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-14 max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-gold-foreground shadow-card">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand">Em destaque</h2>
                <p className="text-sm text-muted-foreground">As mais procuradas neste momento</p>
              </div>
            </motion.div>
            <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 3).map((s) => (
                <motion.div key={s.id} variants={cardIn} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <ScholarshipCard s={s} onNavigate={(id) => navigate({ to: "/hub/bolsas/$id", params: { id } })} user={user} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ── FILTROS + LISTA COMPLETA ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl bg-card border border-border p-5 shadow-card mb-6"
        >
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-brand">
            <Filter className="h-4 w-4 text-gold" /> Filtrar bolsas
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="País" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                <SelectItem value="Mestrado">Mestrado</SelectItem>
                <SelectItem value="Doutoramento">Doutoramento</SelectItem>
                <SelectItem value="Intercâmbio">Intercâmbio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={coverage} onValueChange={setCoverage}>
              <SelectTrigger><SelectValue placeholder="Cobertura" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Total e parcial</SelectItem>
                <SelectItem value="Total">Cobertura total</SelectItem>
                <SelectItem value="Parcial">Cobertura parcial</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => { setCountry("all"); setLevel("all"); setCoverage("all"); setQ(""); }}
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              Limpar filtros
            </button>
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "bolsa" : "bolsas"} encontradas
          </p>
        </div>

        {!loaded ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${q}-${country}-${level}-${coverage}`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((s) => (
                <motion.div key={s.id} variants={cardIn} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <ScholarshipCard
                    s={s}
                    onNavigate={(id) => navigate({ to: "/hub/bolsas/$id", params: { id } })}
                    user={user}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {filtered.length === 0 && loaded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <div className="text-5xl mb-4">🎓</div>
            <p className="font-semibold text-foreground">Nenhuma bolsa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente outros filtros ou limpe a pesquisa</p>
          </motion.div>
        )}
      </section>

      {/* ── ASSISTENTE DE BOLSAS ──────────────────────────────────────────────── */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-3">
                <Sparkles className="h-3.5 w-3.5" /> ASSISTENTE DE BOLSAS
              </div>
              <h2 className="text-3xl font-bold text-brand mb-3">Encontre a bolsa certa para si</h2>
              <p className="text-muted-foreground mb-6">Diga-nos a sua área e nível de estudo e mostramos as melhores oportunidades.</p>
              <form onSubmit={handleRecommend} className="rounded-2xl bg-card border border-border p-5 shadow-card space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Área de interesse</label>
                  <Input value={recArea} onChange={(e) => setRecArea(e.target.value)} placeholder="Ex.: Engenharia, Direito, Medicina..." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Nível pretendido</label>
                  <Select value={recLevel} onValueChange={setRecLevel}>
                    <SelectTrigger><SelectValue placeholder="Selecione o nível..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                      <SelectItem value="Mestrado">Mestrado</SelectItem>
                      <SelectItem value="Doutoramento">Doutoramento</SelectItem>
                      <SelectItem value="Intercâmbio">Intercâmbio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-brand-foreground shadow-card">
                  <Sparkles className="h-4 w-4" /> Recomendar bolsas
                </button>
              </form>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h3 className="text-xl font-bold text-brand mb-4">
                {recommended ? "Recomendado para si" : "Aguardando o seu perfil..."}
              </h3>
              {recommended ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {recommended.length > 0
                    ? recommended.map((s) => (
                      <ScholarshipCard
                        key={s.id}
                        s={s}
                        compact
                        onNavigate={(id) => navigate({ to: "/hub/bolsas/$id", params: { id } })}
                        user={user}
                        isFavorite={isFavorite}
                        toggleFavorite={toggleFavorite}
                      />
                    ))
                    : <p className="text-muted-foreground col-span-2">Nenhuma bolsa correspondente. Tente outra combinação.</p>
                  }
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-muted-foreground bg-card">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 text-gold opacity-40" />
                  <p className="text-sm">Preencha o formulário ao lado para ver bolsas personalizadas.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── NOTÍCIAS ──────────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-card">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand">Últimas notícias</h2>
              <p className="text-sm text-muted-foreground">Prazos urgentes e novas oportunidades</p>
            </div>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allNews.map((n, i) => (
              <motion.div
                key={n.id}
                variants={cardIn}
                custom={i}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <button
                  type="button"
                  className="w-full text-left group rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant transition-smooth"
                  onClick={() => navigate({ to: "/hub/noticias/$id", params: { id: n.id } })}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-semibold">{n.category}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(n.date).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mb-2 text-brand group-hover:text-gold transition-smooth leading-snug line-clamp-2">{n.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.excerpt}</p>
                  <div className="flex items-center gap-1 text-xs text-gold mt-3 font-semibold">
                    Ler mais <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── GUIAS ────────────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-3">
                <BookOpen className="h-3.5 w-3.5" /> GUIAS PRÁTICOS
              </div>
              <h2 className="text-3xl font-bold text-brand mb-2">Aprenda a candidatar-se</h2>
              <p className="text-muted-foreground">Tudo o que precisa saber para conseguir a sua bolsa</p>
            </motion.div>
            <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {HUB_GUIDES.map((g, i) => (
                <motion.div key={g.id} variants={cardIn} custom={i} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <button
                    type="button"
                    className="w-full text-left rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant transition-smooth"
                    onClick={() => navigate({ to: g.link as never })}
                  >
                    <div className="text-4xl mb-3">{g.icon}</div>
                    <h3 className="font-bold text-base mb-2 text-brand leading-snug">{g.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{g.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {g.readTime}
                      </span>
                      <ArrowRight className="h-4 w-4 text-brand" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── HISTÓRIAS DE SUCESSO ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-brand mb-2">Histórias de sucesso</h2>
            <p className="text-muted-foreground">Estudantes moçambicanos que conquistaram a sua bolsa</p>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Aline Macuácua", scholarship: "Chevening — UK", quote: "Os guias e alertas ajudaram-me a preparar a candidatura no prazo.", flag: "🇬🇧" },
              { name: "Hélder Sitoe", scholarship: "DAAD — Alemanha", quote: "Recebi recomendações personalizadas que se ajustaram ao meu perfil em engenharia.", flag: "🇩🇪" },
              { name: "Júlia Mucavele", scholarship: "Erasmus Mundus", quote: "Estudo em três países europeus. A plataforma fez toda a diferença.", flag: "🇪🇺" },
            ].map((p) => (
              <motion.div
                key={p.name}
                variants={cardIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl bg-card border border-border p-6 shadow-card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative h-12 w-12 shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-hero text-brand-foreground grid place-items-center font-bold text-sm">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-base">{p.flag}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-brand text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.scholarship}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"{p.quote}"</p>
                <div className="flex items-center gap-1.5 mt-4 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Bolsa aprovada
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA ALERTA ───────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-3xl bg-gradient-hero text-brand-foreground p-8 sm:p-12 grid lg:grid-cols-[1fr_auto] gap-8 items-center shadow-elegant relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-3">
              <Bell className="h-3.5 w-3.5" /> ALERTAS GRATUITOS
            </div>
            <h3 className="text-2xl font-bold mb-2">Não perca nenhuma bolsa</h3>
            <p className="opacity-90 max-w-xl">Receba por email as novas oportunidades e prazos urgentes.</p>
          </div>
          <form onSubmit={handleSubscribe} className="relative flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="h-12 sm:w-72 rounded-xl bg-white/95 text-foreground border-0 px-4 outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 h-12 text-sm font-semibold text-gold-foreground shadow-card">
              Inscrever-me <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </motion.div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

// ── Scholarship Card ──────────────────────────────────────────────────────────

function ScholarshipCard({
  s,
  compact = false,
  onNavigate,
  user,
  isFavorite,
  toggleFavorite,
}: {
  s: Scholarship;
  compact?: boolean;
  onNavigate: (id: string) => void;
  user: ReturnType<typeof useAuth>["user"];
  isFavorite: (type: "bolsa" | "noticia" | "produto" | "exame", id: string) => boolean;
  toggleFavorite: (type: "bolsa" | "noticia" | "produto" | "exame", id: string, title: string, url: string) => void;
}) {
  const deadline = new Date(s.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const expired  = daysLeft < 0;
  const urgent   = !expired && daysLeft <= 30;

  return (
    <article
      className="relative group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-card h-full cursor-pointer hover:shadow-elegant hover:-translate-y-1 transition-smooth"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("a, button")) onNavigate(s.id);
      }}
    >
      {/* Heart / favorite button */}
      {user && (
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite("bolsa", s.id, s.title, `/hub/bolsas/${s.id}`); }}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 bg-background/80 backdrop-blur-sm hover:bg-background transition-smooth"
          aria-label={isFavorite("bolsa", s.id) ? "Remover favorito" : "Guardar favorito"}
        >
          <Heart className={`h-4 w-4 ${isFavorite("bolsa", s.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
      )}

      {/* Header */}
      <div className={`relative p-5 text-brand-foreground ${expired ? "bg-muted" : "bg-gradient-hero"}`}>
        <div className="absolute top-4 right-4 text-3xl select-none">{s.flag}</div>

        <div className="flex flex-wrap gap-1.5 mb-2 pr-10">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${LEVEL_COLOR[s.level] ?? "bg-muted text-muted-foreground"}`}>
            {s.level}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${COVERAGE_COLOR[s.coverage] ?? "bg-muted text-muted-foreground"}`}>
            {s.coverage}
          </span>
        </div>

        <h3 className={`font-bold text-base leading-snug pr-10 ${expired ? "text-foreground/60" : ""}`}>
          {s.title}
        </h3>
        <p className={`text-xs mt-0.5 ${expired ? "text-muted-foreground" : "opacity-75"}`}>
          {s.institution}
        </p>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /> {s.country}</span>
          <span className="flex items-center gap-1.5"><Languages className="h-3 w-3 shrink-0" /> {s.language}</span>
          <span className="flex items-center gap-1.5"><Wallet className="h-3 w-3 shrink-0" /> {s.coverage}</span>
          <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" /> {s.area}</span>
        </div>

        {!compact && s.benefits && s.benefits.length > 0 && (
          <ul className="space-y-1 mb-4">
            {s.benefits.slice(0, 3).map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Deadline badge */}
        <div className="mb-4">
          {expired ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3 w-3" /> Prazo encerrado
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              <Calendar className="h-3 w-3" />
              {deadline.toLocaleDateString("pt-PT")}
              {urgent && <span className="ml-0.5 font-bold">· {daysLeft}d</span>}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigate(s.id)}
            className="flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-brand hover:bg-brand hover:text-brand-foreground transition-smooth"
          >
            <BookOpen className="h-3.5 w-3.5" /> Ver guia
          </button>
          {expired ? (
            <span className="flex items-center justify-center rounded-xl bg-muted px-3 py-2.5 text-xs font-medium text-muted-foreground cursor-default">
              Encerrado
            </span>
          ) : (
            <a
              href={s.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-xl bg-gradient-brand px-3 py-2.5 text-xs font-semibold text-brand-foreground hover:shadow-card transition-smooth"
            >
              Candidatar <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

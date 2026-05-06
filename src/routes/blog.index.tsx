import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { blogPosts, formatPtDate, type BlogCategory } from "@/data/blog";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowRight, Tag, PenLine, Clock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Giseveral e Services" },
      { name: "description", content: "Artigos úteis sobre tecnologia, impressão, redes e informática. Aprenda dicas práticas com a Giseveral e Services." },
      { property: "og:title", content: "Blog — Giseveral e Services" },
      { property: "og:description", content: "Dicas e novidades sobre tecnologia, impressão e serviços." },
    ],
  }),
  component: BlogPage,
});

type PostItem = {
  slug: string;
  title: string;
  date: string;
  category: BlogCategory;
  image: string;
  excerpt: string;
  source: "static" | "db";
};

const CATEGORIES: ("Todos" | BlogCategory)[] = ["Todos", "Informática", "Impressão", "Redes", "Dicas"];

const CAT_COLOR: Record<BlogCategory, string> = {
  "Informática": "bg-brand/10 text-brand",
  "Impressão":   "bg-gold/15 text-gold",
  "Redes":       "bg-emerald-500/10 text-emerald-600",
  "Dicas":       "bg-purple-500/10 text-purple-600",
};

const CAT_GRADIENT: Record<BlogCategory, string> = {
  "Informática": "from-brand/30 to-brand/10",
  "Impressão":   "from-gold/30 to-gold/10",
  "Redes":       "from-emerald-500/30 to-emerald-500/10",
  "Dicas":       "from-purple-500/30 to-purple-500/10",
};

function readingTime(excerpt: string): string {
  const words = excerpt.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round((words * 5) / 200));
  return `${mins} min`;
}

// ── Animation variants ────────────────────────────────────────────────────────

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
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.25 } },
};

// ── Component ─────────────────────────────────────────────────────────────────

function BlogPage() {
  const [filter, setFilter] = useState<"Todos" | BlogCategory>("Todos");
  const [dbPosts, setDbPosts] = useState<PostItem[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("blog_posts")
      .select("slug, title, date, category, image_url, excerpt")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => {
        setDbLoaded(true);
        if (!data) return;
        setDbPosts(data.map((r) => ({
          slug: r.slug,
          title: r.title,
          date: r.date,
          category: r.category as BlogCategory,
          image: r.image_url ?? "",
          excerpt: r.excerpt ?? "",
          source: "db" as const,
        })));
      });
  }, []);

  const staticItems: PostItem[] = blogPosts.map((p) => ({
    slug: p.slug, title: p.title, date: p.date,
    category: p.category, image: p.image as string,
    excerpt: p.excerpt, source: "static",
  }));

  const allPosts = dbLoaded && dbPosts.length > 0 ? dbPosts : dbLoaded ? staticItems : [];

  const filtered = useMemo(
    () => filter === "Todos" ? allPosts : allPosts.filter((p) => p.category === filter),
    [filter, dbPosts, dbLoaded],
  );

  const hero = filtered[0];
  const rest  = filtered.slice(1);

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-hero text-brand-foreground overflow-hidden">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-brand/20 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl relative">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/20 text-gold text-xs font-bold mb-5">
              <PenLine className="h-3.5 w-3.5" /> BLOG GISEVERAL
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Dicas, novidades e<br /><span className="text-gold">conhecimento técnico</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-brand-foreground/80 max-w-xl mb-6">
              Aprenda com artigos práticos sobre tecnologia, impressão, redes e informática — escritos para o dia a dia moçambicano.
            </motion.p>

            {/* Category pills */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-smooth ${
                    filter === c
                      ? "bg-gold text-gold-foreground shadow-card"
                      : "bg-white/15 text-brand-foreground hover:bg-white/25"
                  }`}
                >
                  {c}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl">

        {/* ── LOADING SKELETONS ─────────────────────────────────────────────── */}
        {!dbLoaded && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FEATURED POST ─────────────────────────────────────────────────── */}
        {dbLoaded && hero && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-10"
          >
            <Link
              to="/blog/$slug"
              params={{ slug: hero.slug }}
              className="group grid lg:grid-cols-[1.4fr_1fr] rounded-2xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elegant transition-smooth"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-muted">
                {hero.image ? (
                  <img
                    src={hero.image}
                    alt={hero.title}
                    className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${CAT_GRADIENT[hero.category]} flex items-center justify-center`}>
                    <span className="text-6xl opacity-40">📄</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 group-hover:to-black/5 transition-smooth" />
              </div>

              {/* Content */}
              <div className="p-7 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${CAT_COLOR[hero.category] ?? "bg-muted text-muted-foreground"}`}>
                    <Tag className="h-3 w-3" /> {hero.category}
                  </span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime(hero.excerpt)}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatPtDate(hero.date)}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand group-hover:text-gold transition-smooth leading-snug mb-3">
                  {hero.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-5">{hero.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold group-hover:gap-2.5 transition-all">
                  Ler artigo <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── GRID DE POSTS ─────────────────────────────────────────────────── */}
        {dbLoaded && (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {rest.map((p, i) => (
                <motion.article
                  key={p.slug}
                  custom={i}
                  variants={cardIn}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card"
                >
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="aspect-[16/10] overflow-hidden bg-muted">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${CAT_GRADIENT[p.category]} flex items-center justify-center`}>
                        <span className="text-5xl opacity-30">📝</span>
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${CAT_COLOR[p.category] ?? "bg-muted text-muted-foreground"}`}>
                        <Tag className="h-3 w-3" /> {p.category}
                      </span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime(p.excerpt)}</span>
                    </div>

                    <h2 className="text-base font-bold text-brand leading-snug mb-2 flex-1">
                      <Link to="/blog/$slug" params={{ slug: p.slug }} className="hover:text-gold transition-smooth line-clamp-2">
                        {p.title}
                      </Link>
                    </h2>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{p.excerpt}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {formatPtDate(p.date)}
                      </span>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: p.slug }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:gap-1.5 transition-all"
                      >
                        Ler <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── EMPTY STATE ───────────────────────────────────────────────────── */}
        {dbLoaded && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-muted-foreground">Sem artigos nesta categoria.</p>
          </motion.div>
        )}
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

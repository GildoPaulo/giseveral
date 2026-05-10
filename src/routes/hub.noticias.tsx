import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import { HUB_NEWS, type NewsItem } from "@/data/hub-bolsas";
import { SkeletonCard } from "@/components/Skeleton";
import {
  Newspaper, Search, Calendar, Tag, Eye, ArrowRight, Filter, X, Heart,
} from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/hub/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias — Giseveral Hub" },
      { name: "description", content: "Últimas notícias sobre bolsas de estudo, exames de admissão e oportunidades educativas em Moçambique." },
      { property: "og:title", content: "Notícias Educativas — Giseveral Hub" },
    ],
  }),
  component: HubNoticiasPage,
});

const CATEGORIES = ["Todas", "Bolsas", "Universidades", "Prazos", "Oportunidades", "Exames", "Educação", "Geral"];

const CATEGORY_COLOR: Record<string, string> = {
  Bolsas: "bg-blue-500/10 text-blue-600 border-blue-200",
  Universidades: "bg-purple-500/10 text-purple-600 border-purple-200",
  Prazos: "bg-red-500/10 text-red-600 border-red-200",
  Oportunidades: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Exames: "bg-amber-500/10 text-amber-600 border-amber-200",
  Educação: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  Geral: "bg-muted text-muted-foreground border-border",
};

type DbNewsRow = {
  id: string; title: string; excerpt: string | null; category: string;
  author: string; date: string; image_url: string | null;
  tags: string[]; published: boolean; views: number; created_at: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as any } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

function HubNoticiasPage() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [allNews, setAllNews] = useState<NewsItem[]>(HUB_NEWS);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");

  useEffect(() => {
    supabase
      .from("hub_news")
      .select("id, title, excerpt, category, author, date, image_url, tags, published, views")
      .eq("published", true)
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const merged: NewsItem[] = (data as DbNewsRow[]).map((row) => ({
            id: row.id,
            title: row.title,
            excerpt: row.excerpt ?? "",
            category: row.category as NewsItem["category"],
            author: row.author,
            date: row.date,
            content: [],
            tags: row.tags ?? [],
            relatedScholarship: undefined,
          }));
          // merge with static (DB takes priority, avoid duplicates)
          const ids = new Set(merged.map((n) => n.id));
          const staticFallback = HUB_NEWS.filter((n) => !ids.has(n.id));
          setAllNews([...merged, ...staticFallback]);
        }
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = allNews;
    if (cat !== "Todas") list = list.filter((n) => n.category === cat);
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter((n) =>
        n.title.toLowerCase().includes(lq) ||
        (n.excerpt ?? "").toLowerCase().includes(lq) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(lq))
      );
    }
    return list;
  }, [allNews, cat, q]);

  const featured = filtered.slice(0, 1)[0];
  const rest = filtered.slice(1);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero text-brand-foreground">
        <div className="container mx-auto px-4 py-14 max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-brand-foreground/20 bg-brand-foreground/10 px-3 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
              <Newspaper className="h-3.5 w-3.5" /> Notícias
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold leading-tight">
              Notícias & Oportunidades
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 text-base text-brand-foreground/80 max-w-xl">
              Fique informado sobre bolsas, exames de admissão, prazos e novidades da educação em Moçambique.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-14 z-20 bg-background/90 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar notícias..."
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-smooth border ${
                  cat === c
                    ? "bg-brand text-brand-foreground border-brand shadow-card"
                    : "border-border text-foreground/70 hover:border-brand/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-foreground">Nenhuma notícia encontrada</p>
            <button onClick={() => { setQ(""); setCat("Todas"); }} className="mt-2 text-sm text-brand hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
            {/* Featured article */}
            {featured && (
              <motion.div variants={fadeUp}>
                <div className="relative">
                {user && (
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite("noticia", featured.id, featured.title, `/hub/noticias/${featured.id}`); }}
                    className="absolute top-3 right-3 z-10 rounded-full p-1.5 bg-background/80 backdrop-blur-sm hover:bg-background transition-smooth"
                    aria-label={isFavorite("noticia", featured.id) ? "Remover favorito" : "Guardar favorito"}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite("noticia", featured.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                  </button>
                )}
                <Link
                  to="/hub/noticias/$id"
                  params={{ id: featured.id }}
                  className="group grid md:grid-cols-2 gap-0 rounded-2xl border border-border bg-card shadow-card hover:shadow-elegant transition-smooth overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-56 md:h-auto bg-gradient-hero flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/40 to-brand/10" />
                    <Newspaper className="h-20 w-20 text-brand-foreground/20 relative z-10" />
                    <div className="absolute bottom-3 left-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLOR[featured.category] ?? CATEGORY_COLOR.Geral}`}>
                        <Tag className="h-3 w-3" /> {featured.category}
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6 flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">Destaque</span>
                    <h2 className="text-xl font-bold text-brand group-hover:text-gold transition-smooth leading-tight">{featured.title}</h2>
                    {featured.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{featured.excerpt}</p>}
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(featured.date).toLocaleDateString("pt-PT")}</span>
                        {featured.author && <span>por {featured.author}</span>}
                      </div>
                      <span className="flex items-center gap-1 text-brand font-medium group-hover:gap-2 transition-smooth">
                        Ler mais <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
                </div>
              </motion.div>
            )}

            {/* News grid */}
            {rest.length > 0 && (
              <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((n) => (
                  <motion.div key={n.id} variants={fadeUp}>
                    <div className="relative">
                    {user && (
                      <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite("noticia", n.id, n.title, `/hub/noticias/${n.id}`); }}
                        className="absolute top-3 right-3 z-10 rounded-full p-1.5 bg-background/80 backdrop-blur-sm hover:bg-background transition-smooth"
                        aria-label={isFavorite("noticia", n.id) ? "Remover favorito" : "Guardar favorito"}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite("noticia", n.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                      </button>
                    )}
                    <Link
                      to="/hub/noticias/$id"
                      params={{ id: n.id }}
                      className="group flex flex-col h-full rounded-xl border border-border bg-card shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-smooth overflow-hidden"
                    >
                      {/* Colour bar */}
                      <div className="h-1.5 bg-gradient-brand" />
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLOR[n.category] ?? CATEGORY_COLOR.Geral}`}>
                            {n.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{new Date(n.date).toLocaleDateString("pt-PT")}</span>
                        </div>
                        <h3 className="font-semibold text-sm text-brand group-hover:text-gold transition-smooth line-clamp-2 leading-snug">{n.title}</h3>
                        {n.excerpt && <p className="mt-2 text-xs text-muted-foreground line-clamp-3 flex-1">{n.excerpt}</p>}
                        {n.tags && n.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {n.tags.slice(0, 3).map((t) => (
                              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                          {n.author && <span>por {n.author}</span>}
                          <span className="text-brand font-semibold group-hover:gap-1 flex items-center gap-0.5 transition-smooth">
                            Ler <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <p className="text-center text-xs text-muted-foreground pt-4">
              Mostrando {filtered.length} de {allNews.length} notícias
            </p>
          </motion.div>
        )}
      </div>

      <WhatsAppFab />
    </Layout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { blogPosts, formatPtDate, type BlogCategory } from "@/data/blog";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowRight, Tag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

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

const categories: ("Todos" | BlogCategory)[] = ["Todos", "Informática", "Impressão", "Redes", "Dicas"];

const categoryColor: Record<BlogCategory, string> = {
  "Informática": "bg-brand/10 text-brand",
  "Impressão": "bg-gold/15 text-gold",
  "Redes": "bg-emerald-500/10 text-emerald-600",
  "Dicas": "bg-purple-500/10 text-purple-600",
};

function BlogPage() {
  const [filter, setFilter] = useState<"Todos" | BlogCategory>("Todos");
  const [dbPosts, setDbPosts] = useState<PostItem[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("blog_posts")
      .select("slug, title, date, category, image_url, excerpt")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => {
        if (!data) return;
        const mapped: PostItem[] = data.map((r) => ({
          slug: r.slug,
          title: r.title,
          date: r.date,
          category: r.category as BlogCategory,
          image: r.image_url ?? "",
          excerpt: r.excerpt ?? "",
          source: "db",
        }));
        setDbPosts(mapped);
      });
  }, []);

  const staticItems: PostItem[] = blogPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    category: p.category,
    image: p.image as string,
    excerpt: p.excerpt,
    source: "static",
  }));

  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const allPosts = [...dbPosts, ...staticItems.filter((p) => !dbSlugs.has(p.slug))];

  const posts = useMemo(
    () => (filter === "Todos" ? allPosts : allPosts.filter((p) => p.category === filter)),
    [filter, dbPosts],
  );

  return (
    <Layout>
      <PageHero title="Blog" subtitle="Dicas, novidades e conhecimento técnico para o seu dia a dia." />

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-smooth ${
                filter === c
                  ? "bg-gradient-brand text-brand-foreground shadow-card"
                  : "border border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article
              key={p.slug}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant animate-fade-in"
            >
              <Link to="/blog/$slug" params={{ slug: p.slug }} className="aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${categoryColor[p.category] ?? "bg-muted text-muted-foreground"}`}>
                    <Tag className="h-3 w-3" /> {p.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatPtDate(p.date)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-brand leading-snug">
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="hover:text-gold transition-smooth">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:gap-2.5 transition-all"
                >
                  Ler artigo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Sem artigos nesta categoria.</p>
        )}
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

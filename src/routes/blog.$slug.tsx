import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { blogPosts, getPostBySlug, formatPtDate, type BlogPost } from "@/data/blog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Calendar, Tag, ArrowLeft, Phone, MessageCircle, Wrench,
  Share2, Copy, CheckCircle2, Linkedin,
} from "lucide-react";

const SITE_URL = "https://giseveral.pages.dev";

type ResolvedBlogPost = Omit<BlogPost, "content"> & {
  content: BlogPost["content"] | string;
  tags?: string[];
};

function mapBlogRowToResolved(row: Tables<"blog_posts">): ResolvedBlogPost {
  const category = row.category as BlogPost["category"];
  let content: BlogPost["content"] | string;
  if (typeof row.content === "string") content = row.content;
  else if (Array.isArray(row.content)) content = row.content as BlogPost["content"];
  else content = [];
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    category,
    image: row.image_url ?? "",
    excerpt: row.excerpt ?? "",
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    keywords: row.keywords ?? undefined,
    tags: row.tags ?? undefined,
    content,
  };
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug;
    const staticPost = getPostBySlug(slug);
    if (staticPost) {
      return {
        post: { ...staticPost, content: staticPost.content, tags: undefined } satisfies ResolvedBlogPost,
        slug,
      };
    }
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { post: mapBlogRowToResolved(data), slug };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Artigo — Giseveral e Services" }] };

    const metaTitle = post.metaTitle ?? `${post.title} | Giseveral e Services — Beira`;
    const metaDesc = post.metaDescription ?? post.excerpt;
    const canonical = `${SITE_URL}/blog/${post.slug}`;
    const tagKeywords = post.tags?.length ? post.tags.join(", ") : "";
    const keywords =
      post.keywords ??
      (tagKeywords ? `${tagKeywords}, ${post.category}, Beira, Moçambique` : `${post.category.toLowerCase()}, ${post.title.toLowerCase()}, Beira, Moçambique, Giseveral`);

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: metaDesc,
      datePublished: post.date,
      author: { "@type": "Organization", name: "Giseveral e Services" },
      publisher: {
        "@type": "Organization",
        name: "Giseveral e Services",
        address: { "@type": "PostalAddress", addressLocality: "Beira", addressCountry: "MZ" },
      },
      image: typeof post.image === "string" ? post.image : undefined,
      url: canonical,
      inLanguage: "pt-MZ",
      keywords: tagKeywords || keywords,
    });

    return {
      meta: [
        { title: metaTitle },
        { name: "description", content: metaDesc },
        { name: "keywords", content: keywords },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: metaTitle },
        { property: "og:description", content: metaDesc },
        { property: "og:image", content: typeof post.image === "string" ? post.image : "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:locale", content: "pt_MZ" },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.category },
        ...(post.tags?.flatMap((t) => [{ property: "article:tag" as const, content: t }]) ?? []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: metaTitle },
        { name: "twitter:description", content: metaDesc },
        { name: "twitter:image", content: typeof post.image === "string" ? post.image : "" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [{ type: "application/ld+json", children: jsonLd }],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-brand">Artigo não encontrado</h1>
        <p className="mt-3 text-muted-foreground">O artigo que procura não existe ou foi movido.</p>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao blog
        </Link>
      </section>
    </Layout>
  ),
  component: BlogPostPage,
});

// ─── Shared helpers ─────────────────────────────────────────────────────────

type TocEntry = { id: string; text: string; level: 2 | 3 };

function addIdsToHtml(html: string): string {
  let i = 0;
  return html.replace(/<(h[23])([^>]*?)>/gi, (_m, tag, attrs) => `<${tag}${attrs} id="s${i++}">`);
}

function tocFromHtml(html: string): TocEntry[] {
  const result: TocEntry[] = [];
  let i = 0;
  const re = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (text) result.push({ id: `s${i++}`, text, level: parseInt(m[1]) as 2 | 3 });
  }
  return result;
}

function tocFromBlocks(blocks: { heading?: string; paragraphs: string[] }[]): TocEntry[] {
  return blocks.flatMap((b, i) =>
    b.heading ? [{ id: `s${i}`, text: b.heading, level: 2 as const }] : []
  );
}

function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-brand to-gold transition-[width] duration-75 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SharePanel({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Partilhar</p>
      <div className="flex gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/25 text-[#25D366] transition-smooth">
          <MessageCircle className="h-4 w-4" />
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" title="Facebook"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/25 text-[#1877F2] transition-smooth">
          <Share2 className="h-4 w-4" />
        </a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" title="LinkedIn"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/25 text-[#0A66C2] transition-smooth">
          <Linkedin className="h-4 w-4" />
        </a>
        <button onClick={copy} title="Copiar link"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-muted hover:bg-muted/70 transition-smooth">
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

function TocPanel({ entries, activeId }: { entries: TocEntry[]; activeId: string }) {
  if (!entries.length) return null;
  return (
    <nav>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Neste artigo</p>
      <ul className="space-y-0.5">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => { ev.preventDefault(); document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth" }); }}
              className={`block text-sm py-1 pl-2 leading-snug border-l-2 transition-colors ${
                activeId === e.id
                  ? "border-brand text-brand font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
              } ${e.level === 3 ? "ml-3" : ""}`}
            >
              {e.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const [activeId, setActiveId] = useState("");

  const { toc, processedHtml } = useMemo(() => {
    if (!post) return { toc: [] as TocEntry[], processedHtml: "" };
    if (typeof post.content === "string" && /<[^>]+>/.test(post.content)) {
      return { toc: tocFromHtml(post.content), processedHtml: addIdsToHtml(post.content) };
    }
    if (Array.isArray(post.content)) {
      return { toc: tocFromBlocks(post.content as { heading?: string; paragraphs: string[] }[]), processedHtml: "" };
    }
    return { toc: [], processedHtml: "" };
  }, [post]);

  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActiveId(hit.target.id);
      },
      { rootMargin: "-10% 0px -80% 0px" }
    );
    toc.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [toc]);

  const pageUrl = `${SITE_URL}/blog/${post.slug}`;
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const imageUrl = typeof post.image === "string" ? post.image : "";

  return (
    <Layout>
      <ReadingProgress />

      {/* Hero — full-width background image, dark overlay, title. Image NOT repeated below. */}
      <section className="relative overflow-hidden min-h-[52vh] flex items-end bg-brand">
        {imageUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/55 to-black/15" />
        <div className="relative container mx-auto px-4 pb-12 pt-28 max-w-5xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-gold transition-smooth mb-5">
            <ArrowLeft className="h-4 w-4" /> Voltar ao blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2.5 py-0.5 font-semibold text-gold">
              <Tag className="h-3 w-3" /> {post.category}
            </span>
            <span className="flex items-center gap-1 text-white/70">
              <Calendar className="h-3 w-3" /> {formatPtDate(post.date)}
            </span>
            <span className="text-white/60">por Equipa Giseveral</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-white drop-shadow-lg">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl">{post.excerpt}</p>
          )}
        </div>
      </section>

      {/* 3-column body */}
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr_220px]">

          {/* Left sidebar — shows below content on mobile */}
          <aside className="order-2 lg:order-1 space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-brand flex items-center justify-center text-brand-foreground font-bold text-base">G</div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Equipa Giseveral</p>
                  <p className="text-xs text-muted-foreground">Serviços & Tecnologia</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Especialistas em informática, impressão e papelaria na Beira, Moçambique.
              </p>
              <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <SharePanel url={pageUrl} title={post.title} />
          </aside>

          {/* Center — article content */}
          <article className="order-1 lg:order-2 min-w-0">
            <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-brand prose-a:text-gold text-foreground/85">
              {typeof post.content === "string" ? (
                /<[^>]+>/.test(post.content) ? (
                  <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                ) : (
                  (post.content as string).split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} className="leading-relaxed mb-3">{p}</p>
                  ))
                )
              ) : (
                (post.content as { heading?: string; paragraphs: string[] }[]).map((block, i) => (
                  <div key={i}>
                    {block.heading && (
                      <h2 id={`s${i}`} className="text-xl md:text-2xl font-bold text-brand mt-8 mb-3">{block.heading}</h2>
                    )}
                    {block.paragraphs.map((p, j) => (
                      <p key={j} className="text-foreground/85 leading-relaxed mb-3">{p}</p>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* CTA */}
            <div className="mt-12 rounded-2xl bg-gradient-hero p-6 md:p-8 text-brand-foreground shadow-elegant">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-2">Giseveral e Services — Beira, Moçambique</p>
              <h3 className="text-xl md:text-2xl font-bold">Precisa de ajuda profissional?</h3>
              <p className="mt-2 text-brand-foreground/80">
                A nossa equipa está disponível para te ajudar com{" "}
                {post.category === "Impressão"
                  ? "impressão e reprografia"
                  : post.category === "Redes"
                  ? "instalação de redes e Wi-Fi"
                  : post.category === "Informática"
                  ? "formatação, reparação e manutenção de computadores"
                  : "papelaria e serviços"}{" "}
                na Beira.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-smooth hover:shadow-glow">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <Link to="/loja"
                  className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
                  <Wrench className="h-4 w-4" /> Pedir Serviço
                </Link>
                <a href="tel:+258874383621"
                  className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/10">
                  <Phone className="h-4 w-4" /> 874 383 621
                </a>
              </div>
              <p className="mt-4 text-xs text-brand-foreground/60">Beira, Esturro • Rua Alfredo Lawley · Seg–Sáb 8h–18h</p>
            </div>
          </article>

          {/* Right sidebar — sticky TOC, desktop only */}
          <aside className="order-3 hidden lg:block">
            <div className="sticky top-24">
              <TocPanel entries={toc} activeId={activeId} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related articles */}
      <section className="bg-muted/40 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-brand mb-6">Continue a ler</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={typeof p.image === "string" ? p.image : ""}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">{formatPtDate(p.date)}</div>
                  <h3 className="mt-1 text-sm font-semibold text-brand line-clamp-2 group-hover:text-gold transition-smooth">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

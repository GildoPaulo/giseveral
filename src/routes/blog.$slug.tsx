import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { blogPosts, getPostBySlug, formatPtDate } from "@/data/blog";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Tag, ArrowLeft, Phone, MessageCircle, Wrench } from "lucide-react";

const SITE_URL = "https://giseveral.pages.dev";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    return { post: post ?? null, slug: params.slug };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post ?? null;
    if (!post) return { meta: [{ title: "Artigo — Giseveral e Services" }] };

    const metaTitle = post.metaTitle ?? `${post.title} | Giseveral e Services — Beira`;
    const metaDesc = post.metaDescription ?? post.excerpt;
    const canonical = `${SITE_URL}/blog/${post.slug}`;

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": metaDesc,
      "datePublished": post.date,
      "author": { "@type": "Organization", "name": "Giseveral e Services" },
      "publisher": {
        "@type": "Organization",
        "name": "Giseveral e Services",
        "address": { "@type": "PostalAddress", "addressLocality": "Beira", "addressCountry": "MZ" },
      },
      "image": typeof post.image === "string" ? post.image : undefined,
      "url": canonical,
      "inLanguage": "pt-MZ",
    });

    return {
      meta: [
        { title: metaTitle },
        { name: "description", content: metaDesc },
        { name: "keywords", content: post.keywords ?? `${post.category.toLowerCase()}, ${post.title.toLowerCase()}, Beira, Moçambique, Giseveral` },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: metaTitle },
        { property: "og:description", content: metaDesc },
        { property: "og:image", content: typeof post.image === "string" ? post.image : "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:locale", content: "pt_MZ" },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.category },
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

function BlogPostPage() {
  const { post: staticPost, slug } = Route.useLoaderData();
  const [post, setPost] = useState<typeof staticPost | null>(staticPost);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (staticPost) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single()
      .then(({ data }) => {
        if (!data) { setNotFoundState(true); return; }
        setPost({
          slug: data.slug,
          title: data.title,
          date: data.date,
          category: data.category as "Informática" | "Impressão" | "Redes" | "Dicas",
          image: data.image_url ?? "",
          excerpt: data.excerpt ?? "",
          metaTitle: data.meta_title ?? undefined,
          metaDescription: data.meta_description ?? undefined,
          keywords: data.keywords ?? undefined,
          content: Array.isArray(data.content)
            ? data.content as { heading?: string; paragraphs: string[] }[]
            : typeof data.content === "string"
            ? data.content
            : [],
        });
      });
  }, [slug, staticPost]);

  if (notFoundState) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-brand">Artigo não encontrado</h1>
          <p className="mt-3 text-muted-foreground">O artigo que procura não existe ou foi movido.</p>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao blog
          </Link>
        </section>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero text-brand-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-brand-foreground/80 hover:text-gold transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Voltar ao blog
          </Link>
          <div className="mt-5 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 font-semibold text-gold">
              <Tag className="h-3 w-3" /> {post.category}
            </span>
            <span className="inline-flex items-center gap-1 text-brand-foreground/70">
              <Calendar className="h-3 w-3" /> {formatPtDate(post.date)}
            </span>
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">{post.title}</h1>
          <p className="mt-4 text-base md:text-lg text-brand-foreground/80 max-w-2xl">{post.excerpt}</p>
        </div>
      </section>

      {/* Cover */}
      <section className="container mx-auto px-4 -mt-6 md:-mt-10 max-w-4xl">
        <img
          src={post.image}
          alt={post.title}
          width={1280}
          height={768}
          className="w-full rounded-2xl shadow-elegant"
        />
      </section>

      {/* Content */}
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-6 prose prose-sm prose-headings:mt-0 prose-headings:text-brand prose-a:text-gold text-foreground/85">
          {typeof post.content === "string" ? (
            /<[^>]+>/.test(post.content) ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              post.content.split(/\n{2,}/).filter(Boolean).map((paragraph, i) => (
                <p key={i} className="leading-relaxed mb-3">{paragraph}</p>
              ))
            )
          ) : (
            post.content.map((block: { heading?: string; paragraphs: string[] }, i: number) => (
              <div key={i}>
                {block.heading && (
                  <h2 className="text-xl md:text-2xl font-bold text-brand mb-3">{block.heading}</h2>
                )}
                {block.paragraphs.map((p: string, j: number) => (
                  <p key={j} className="text-foreground/85 leading-relaxed mb-3">
                    {p}
                  </p>
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
            A nossa equipa está disponível para te ajudar com {post.category === "Impressão" ? "impressão e reprografia" : post.category === "Redes" ? "instalação de redes e Wi-Fi" : post.category === "Informática" ? "formatação, reparação e manutenção de computadores" : "papelaria e serviços"} na Beira.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-smooth hover:shadow-glow">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link
              to="/loja"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
            >
              <Wrench className="h-4 w-4" /> Pedir Serviço
            </Link>
            <a href="tel:+258874383621" className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/10">
              <Phone className="h-4 w-4" /> 874 383 621
            </a>
          </div>
          <p className="mt-4 text-xs text-brand-foreground/60">
            Beira, Esturro • Rua Alfredo Lawley · Seg–Sáb 8h–18h
          </p>
        </div>
      </article>

      {/* Related */}
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
                  <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
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

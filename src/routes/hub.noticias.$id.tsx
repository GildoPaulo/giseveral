import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { HUB_NEWS, SCHOLARSHIPS, type NewsItem } from "@/data/hub-bolsas";
import { toast } from "sonner";
import newsDefaultImg from "@/assets/hero.jpg";
import {
  ArrowLeft, Calendar, Tag, Eye, MessageCircle, Share2,
  Copy, ThumbsUp, Send, BookOpen, ExternalLink, CheckCircle2, Linkedin,
} from "lucide-react";

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, object, embed, form, input, button, link:not([rel='stylesheet']), meta, base").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on") || (attr.name === "href" && /^(javascript|vbscript):/i.test(attr.value))) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

const SITE_URL = "https://giseveral.pages.dev";

type DbNewsRow = {
  id: string; title: string; excerpt: string | null; category: string;
  author: string; date: string; image_url: string | null; content_rich: string | null;
  content: string[] | null; related_scholarship_id: string | null; tags: string[];
  published: boolean; comments_enabled: boolean; views: number; created_at: string;
};

type CommentRow = {
  id: string; content: string; author_name: string; is_admin: boolean;
  helpful_count: number; created_at: string;
};

const CATEGORY_COLOR: Record<string, string> = {
  Bolsas: "bg-blue-500/10 text-blue-600",
  Universidades: "bg-purple-500/10 text-purple-600",
  Prazos: "bg-red-500/10 text-red-600",
  Oportunidades: "bg-emerald-500/10 text-emerald-600",
};

export const Route = createFileRoute("/hub/noticias/$id")({
  loader: ({ params }) => {
    const staticData = HUB_NEWS.find((n) => n.id === params.id);
    return { staticData: staticData ?? null, id: params.id };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.staticData;
    if (!n) return { meta: [{ title: "Notícia — Giseveral Hub" }] };
    const title = `${n.title} | Giseveral Hub`;
    const canonical = `${SITE_URL}/hub/noticias/${n.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: n.excerpt ?? n.title },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: n.excerpt ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "article:published_time", content: n.date },
        { property: "article:section", content: n.category },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-brand">Notícia não encontrada</h1>
        <Link to="/hub/bolsas" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
        </Link>
      </section>
    </Layout>
  ),
  component: NoticiaDetailPage,
});

// ─── Shared helpers ──────────────────────────────────────────────────────────

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

function NoticiaDetailPage() {
  const { staticData, id } = Route.useLoaderData();
  const { user } = useAuth();

  const [dbData, setDbData] = useState<DbNewsRow | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    setDbData(null);
    setNotFoundState(false);
    setComments([]);

    supabase.from("hub_news").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (data) {
          setDbData(data as DbNewsRow);
          (supabase as any).rpc("increment_news_views", { news_id: id });
        } else if (!staticData) {
          setNotFoundState(true);
        }
      });

    supabase.from("unified_comments")
      .select("id, content, author_name, is_admin, helpful_count, created_at")
      .eq("content_type", "noticia")
      .eq("content_id", id)
      .eq("approved", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setComments(data as CommentRow[]); });
  }, [id]);

  const { toc, processedHtml } = useMemo<{ toc: TocEntry[]; processedHtml: string }>(() => {
    const rich = dbData?.content_rich;
    if (rich && /<[^>]+>/.test(rich)) {
      return { toc: tocFromHtml(rich), processedHtml: addIdsToHtml(rich) };
    }
    return { toc: [], processedHtml: "" };
  }, [dbData]);

  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActiveId(hit.target.id);
      },
      { rootMargin: "-10% 0px -80% 0px" }
    );
    toc.forEach(({ id: hid }) => { const el = document.getElementById(hid); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [toc]);

  if (notFoundState) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-brand">Notícia não encontrada</h1>
          <Link to="/hub/bolsas" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
          </Link>
        </section>
      </Layout>
    );
  }

  if (!staticData && !dbData) {
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const n: NewsItem & { views?: number; image_url?: string | null; content_rich?: string | null; comments_enabled?: boolean } = {
    id,
    title: dbData?.title ?? staticData?.title ?? "Sem título",
    excerpt: dbData?.excerpt ?? staticData?.excerpt ?? "",
    category: ((dbData?.category ?? staticData?.category) ?? "Oportunidades") as NewsItem["category"],
    date: dbData?.date ?? staticData?.date ?? new Date().toISOString().slice(0, 10),
    author: dbData?.author ?? staticData?.author ?? "Equipa Giseveral",
    content: (dbData?.content ?? staticData?.content) ?? [],
    relatedScholarship: dbData?.related_scholarship_id ?? staticData?.relatedScholarship,
    tags: (dbData?.tags ?? staticData?.tags) ?? [],
    views: dbData?.views,
    image_url: dbData?.image_url,
    content_rich: dbData?.content_rich,
    comments_enabled: dbData?.comments_enabled ?? true,
  };

  const relatedScholarship = n.relatedScholarship ? SCHOLARSHIPS.find((s) => s.id === n.relatedScholarship) : null;
  const relatedNews = HUB_NEWS.filter((x) => x.id !== id && x.category === n.category).slice(0, 3);
  const pageUrl = `${SITE_URL}/hub/noticias/${id}`;
  const catColor = CATEGORY_COLOR[n.category] ?? "bg-brand/10 text-brand";
  const authorInitials = (n.author ?? "G").split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "G";

  async function submitComment() {
    if (!user || !commentText.trim()) return;
    setSending(true);
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const { error } = await supabase.from("unified_comments").insert({
      content_type: "noticia",
      content_id: id,
      user_id: user.id,
      content: commentText.trim(),
      author_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Utilizador",
    });
    if (error) toast.error("Erro ao enviar comentário.");
    else { toast.success("Comentário enviado! Aguarda aprovação."); setCommentText(""); }
    setSending(false);
  }

  return (
    <Layout>
      <ReadingProgress />

      {/* Hero — full-width background image, dark overlay, NO image repeated below */}
      <section className="relative overflow-hidden min-h-[52vh] flex items-end bg-brand">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${n.image_url ?? newsDefaultImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/55 to-black/15" />
        <div className="relative container mx-auto px-4 pb-12 pt-28 max-w-5xl">
          <Link to="/hub/bolsas" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-gold transition-smooth mb-5">
            <ArrowLeft className="h-4 w-4" /> Hub de Bolsas
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${catColor}`}>
              <Tag className="h-3 w-3" /> {n.category}
            </span>
            <span className="flex items-center gap-1 text-white/70">
              <Calendar className="h-3 w-3" /> {new Date(n.date).toLocaleDateString("pt-PT")}
            </span>
            {n.author && <span className="text-white/60">por {n.author}</span>}
            {(n.views ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-white/50">
                <Eye className="h-3 w-3" /> {n.views} visualizações
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight text-white drop-shadow-lg">{n.title}</h1>
          {n.excerpt && <p className="mt-3 text-base md:text-lg text-white/80 max-w-2xl">{n.excerpt}</p>}
        </div>
      </section>

      {/* 3-column body */}
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr_220px]">

          {/* Left sidebar */}
          <aside className="order-2 lg:order-1 space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Author card */}
            <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Autor</p>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-brand flex items-center justify-center text-brand-foreground font-bold text-sm">
                  {authorInitials}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{n.author}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString("pt-PT")}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${catColor}`}>
                {n.category}
              </span>

              {/* Tags */}
              {n.tags && n.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {n.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <SharePanel url={pageUrl} title={n.title} />

            {/* Related scholarship quick link */}
            {relatedScholarship && (
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">Bolsa relacionada</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{relatedScholarship.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-brand leading-snug line-clamp-2">{relatedScholarship.title}</p>
                    <p className="text-xs text-muted-foreground">{relatedScholarship.institution}</p>
                  </div>
                </div>
                <Link to="/hub/bolsas/$id" params={{ id: relatedScholarship.id }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-brand-foreground">
                  <BookOpen className="h-3.5 w-3.5" /> Ver guia
                </Link>
              </div>
            )}
          </aside>

          {/* Center — article content + comments */}
          <article className="order-1 lg:order-2 min-w-0">
            <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-brand prose-a:text-gold text-foreground/85">
              {n.content_rich ? (
                /<[^>]+>/.test(n.content_rich) ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedHtml || n.content_rich) }} />
                ) : (
                  n.content_rich.split("\n\n").map((p, i) => (
                    <p key={i} className="leading-relaxed">{p}</p>
                  ))
                )
              ) : (
                (n.content ?? []).map((p, i) => (
                  <p key={i} className="leading-relaxed">{p}</p>
                ))
              )}
            </div>

            {/* Comments */}
            {n.comments_enabled && (
              <section className="mt-12">
                <h2 className="text-xl font-bold text-brand mb-5 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gold" /> Comentários
                  {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}
                </h2>

                {user ? (
                  <div className="mb-6 rounded-xl border border-border bg-card p-4">
                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3}
                      placeholder="Deixe o seu comentário ou pergunta..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <div className="mt-3 flex justify-end">
                      <button onClick={submitComment} disabled={sending || !commentText.trim()}
                        className="flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50">
                        {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> : <Send className="h-4 w-4" />}
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-center text-muted-foreground">
                    <Link to="/login" className="font-semibold text-brand hover:underline">Inicia sessão</Link> para comentar.
                  </div>
                )}

                {comments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Sem comentários ainda. Sê o primeiro!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className={`rounded-xl border p-4 ${c.is_admin ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-brand flex items-center justify-center text-brand-foreground font-bold text-xs">
                              {c.author_name[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span className="text-sm font-semibold">{c.author_name}</span>
                            {c.is_admin && (
                              <span className="text-[10px] font-bold rounded-full bg-gold/20 text-gold px-2 py-0.5">Equipa</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-PT")}</span>
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed">{c.content}</p>
                        {c.helpful_count > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <ThumbsUp className="h-3 w-3" /> {c.helpful_count} útil
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </article>

          {/* Right sidebar — sticky TOC, desktop only */}
          <aside className="order-3 hidden lg:block">
            <div className="sticky top-24">
              <TocPanel entries={toc} activeId={activeId} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related news */}
      {relatedNews.length > 0 && (
        <section className="bg-muted/40 py-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl font-bold text-brand mb-5">Notícias relacionadas</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedNews.map((item) => (
                <Link key={item.id} to="/hub/noticias/$id" params={{ id: item.id }}
                  className="group rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-smooth"
                >
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold mb-2 ${CATEGORY_COLOR[item.category] ?? "bg-brand/10 text-brand"}`}>
                    {item.category}
                  </span>
                  <h3 className="font-semibold text-sm text-brand line-clamp-2 group-hover:text-gold transition-smooth">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.excerpt}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" /> {new Date(item.date).toLocaleDateString("pt-PT")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <WhatsAppFab />
    </Layout>
  );
}

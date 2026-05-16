import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Bookmark, ThumbsUp, ArrowRight, Crown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { DocumentThumbnail } from "@/components/hub/DocumentViewer";
import { HUB_DOCUMENTS, DOC_CATEGORIES, type DocItem, type DocCategory } from "@/data/hub-documents";
import { fetchHubDocuments } from "@/lib/hub";

type SearchParams = { cat?: string; tab?: string };

export const Route = createFileRoute("/hub/documentos")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    cat: typeof search.cat === "string" ? search.cat : undefined,
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => {
    const desc =
      "Biblioteca aberta de documentos académicos partilhados por estudantes moçambicanos — exames de admissão, sebentas universitárias, trabalhos, livros e materiais de estudo. Pré-visualização gratuita, downloads em PDF.";
    const url = "https://giseveral.com/hub/documentos";
    return {
      meta: [
        { title: "Documentos académicos · Exames, sebentas e trabalhos — Giseveral Hub" },
        { name: "description", content: desc },
        { name: "keywords", content: "documentos académicos Moçambique, exames de admissão UEM UP UCM ISCTEM, sebentas universitárias, trabalhos académicos, biblioteca digital Beira, hub estudante moçambicano, PDF educativo grátis" },
        { name: "robots", content: "index, follow, max-image-preview:large" },

        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Giseveral Hub" },
        { property: "og:title", content: "Documentos académicos partilhados — Giseveral Hub" },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },

        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Documentos académicos — Giseveral Hub" },
        { name: "twitter:description", content: desc },

        {
          name: "application/ld+json",
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Documentos académicos partilhados",
            description: desc,
            url,
            isPartOf: { "@type": "WebSite", name: "Giseveral Hub", url: "https://giseveral.com/hub" },
          }),
        },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: HubDocumentosPage,
});

type Tab = "geral" | "categorias" | "recentes";

function HubDocumentosPage() {
  const { tab: tabParam, cat: catParam } = Route.useSearch();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocItem[]>(HUB_DOCUMENTS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>((tabParam as Tab) || "geral");
  const [activeCat, setActiveCat] = useState<DocCategory | null>(
    DOC_CATEGORIES.some((c) => c.id === catParam) ? (catParam as DocCategory) : null,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchHubDocuments().then((d) => {
      setDocs(d);
      setLoading(false);
    });
  }, []);

  const visibleDocs = useMemo(() => {
    let list = docs;
    if (activeCat) list = list.filter((d) => d.category === activeCat);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [docs, activeCat, query]);

  const recommended = useMemo(() =>
    [...visibleDocs].sort((a, b) => b.views - a.views).slice(0, 10),
    [visibleDocs],
  );
  const trending = useMemo(() =>
    [...visibleDocs].sort((a, b) => b.downloads - a.downloads).slice(0, 10),
    [visibleDocs],
  );
  const recent = useMemo(() =>
    [...visibleDocs].sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    ).slice(0, 10),
    [visibleDocs],
  );

  const byCategory = useMemo(() => {
    const groups: Partial<Record<DocCategory, DocItem[]>> = {};
    for (const d of visibleDocs) {
      const k = d.category as DocCategory;
      if (!groups[k]) groups[k] = [];
      groups[k]!.push(d);
    }
    return groups;
  }, [visibleDocs]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Documentos</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Recursos partilhados pela comunidade — exames, sebentas, trabalhos, livros.
              </p>
            </div>
            <Link
              to="/hub/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
            >
              + Enviar documento
            </Link>
          </div>

          {/* Search + tabs */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Pesquisar título, autor, tag…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-card border border-border p-1">
              {(["geral", "categorias", "recentes"] as Tab[]).map((t) => {
                const active = tab === t;
                const label: Record<Tab, string> = { geral: "Visão geral", categorias: "Categorias", recentes: "Mais recentes" };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); navigate({ to: "/hub/documentos", search: { tab: t, cat: activeCat ?? undefined } }); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-smooth ${
                      active ? "bg-[#1E3A8A] text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category chips */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <CategoryPill active={!activeCat} onClick={() => setActiveCat(null)} label="Todas" />
            {DOC_CATEGORIES.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
                label={c.label}
              />
            ))}
          </div>
        </header>

        {/* Empty state */}
        {!loading && visibleDocs.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/40 p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Sem documentos.</p>
            <p className="text-xs text-muted-foreground mt-1">Tenta outro filtro ou pesquisa.</p>
          </div>
        )}

        {/* ── TAB GERAL — horizontal sections ───────────────────────────── */}
        {tab === "geral" && visibleDocs.length > 0 && (
          <div className="space-y-10">
            <Shelf title="Recomendados para ti" docs={recommended} loading={loading} />
            <Shelf title="Mais descarregados esta semana" docs={trending} loading={loading} />
            <Shelf title="Adicionados recentemente" docs={recent} loading={loading} />
          </div>
        )}

        {/* ── TAB RECENTES — flat grid ──────────────────────────────────── */}
        {tab === "recentes" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <DocSkeletonCard key={i} />)
              : recent.map((d) => <ScribdCard key={d.id} doc={d} />)}
          </div>
        )}

        {/* ── TAB CATEGORIAS — grid of categories ───────────────────────── */}
        {tab === "categorias" && (
          <div className="space-y-10">
            {DOC_CATEGORIES.map((c) => {
              const items = byCategory[c.id];
              if (!items || items.length === 0) return null;
              return (
                <section key={c.id}>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground">{c.label}</h2>
                      <p className="text-xs text-muted-foreground">{items.length} documento{items.length !== 1 ? "s" : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCat(c.id)}
                      className="text-xs font-bold text-brand hover:text-gold transition-colors flex items-center gap-1"
                    >
                      Ver todos <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <Shelf title="" docs={items.slice(0, 8)} loading={false} hideHeader />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ── Shelf (horizontal scroll) ─────────────────────────────────────────────

function Shelf({ title, docs, loading, hideHeader }: { title: string; docs: DocItem[]; loading: boolean; hideHeader?: boolean }) {
  return (
    <section>
      {!hideHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-extrabold text-foreground">{title}</h2>
        </div>
      )}
      <div
        className="flex gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="shrink-0 w-[170px]"><DocSkeletonCard /></div>)
          : docs.map((d) => (
              <div key={d.id} className="shrink-0 w-[170px]">
                <ScribdCard doc={d} />
              </div>
            ))}
      </div>
    </section>
  );
}

// ── Scribd-style card ─────────────────────────────────────────────────────

function ScribdCard({ doc }: { doc: DocItem }) {
  const ratio = (() => {
    const up = (doc as DocItem & { votes_up?: number }).votes_up ?? 0;
    const down = (doc as DocItem & { votes_down?: number }).votes_down ?? 0;
    if (up + down === 0) return null;
    return Math.round((up / (up + down)) * 100);
  })();

  return (
    <motion.div whileHover={{ y: -3 }} className="group">
      <Link
        to="/hub/documento/$id"
        params={{ id: doc.id }}
        className="block"
      >
        <div className="relative rounded-md overflow-hidden border border-border bg-white shadow-sm group-hover:shadow-md transition-shadow" style={{ aspectRatio: "1/1.414" }}>
          {doc.fileUrl ? (
            <DocumentThumbnail
              fileUrl={doc.fileUrl}
              width={170}
              fallback={<FallbackCover doc={doc} />}
            />
          ) : (
            <FallbackCover doc={doc} />
          )}

          {/* PDF badge */}
          <span className="absolute top-1.5 left-1.5 rounded bg-black text-white px-1.5 py-0.5 text-[9px] font-bold tracking-wider">
            PDF
          </span>

          {doc.premium && (
            <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold text-gold-foreground">
              <Crown className="h-2.5 w-2.5" />
            </span>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-brand">
              Ver <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-brand transition-colors">
            {doc.title}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">por {doc.author}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            {ratio !== null && (
              <span className="inline-flex items-center gap-0.5">
                <ThumbsUp className="h-2.5 w-2.5" /> {ratio}%
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Bookmark className="h-2.5 w-2.5" /> {((doc as DocItem & { bookmarks_count?: number }).bookmarks_count ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FallbackCover({ doc }: { doc: DocItem }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ background: `linear-gradient(135deg, hsl(${doc.cover} 55% 48%), hsl(${doc.cover} 65% 30%))` }}
    >
      <FileText className="h-10 w-10 text-white/40" />
    </div>
  );
}

function DocSkeletonCard() {
  return (
    <div className="rounded-md overflow-hidden">
      <div className="bg-muted animate-pulse" style={{ aspectRatio: "1/1.414" }} />
      <div className="mt-2 space-y-1.5">
        <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-2.5 w-1/2 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 font-medium transition-colors duration-150 ${
        active
          ? "bg-[#1E3A8A] text-white border border-[#1E3A8A]"
          : "bg-transparent text-muted-foreground border border-border hover:bg-secondary hover:text-foreground"
      }`}
      style={{ fontSize: "13px", borderWidth: active ? "1px" : "0.5px" }}
    >
      {label}
    </button>
  );
}

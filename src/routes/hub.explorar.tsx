import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { DocumentCard, DocumentCardSkeleton } from "@/components/hub/DocumentCard";
import { HUB_DOCUMENTS, DOC_CATEGORIES, type DocItem, type DocCategory } from "@/data/hub-documents";
import { fetchHubDocuments } from "@/lib/hub";
import { Search, SlidersHorizontal, ArrowLeft, LayoutGrid, List, X } from "lucide-react";

type SearchParams = { q?: string; cat?: string };

export const Route = createFileRoute("/hub/explorar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    cat: typeof search.cat === "string" ? search.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explorar documentos — Giseveral Hub" },
      {
        name: "description",
        content: "Pesquise exames, sebentas, trabalhos e PDFs académicos partilhados por estudantes moçambicanos.",
      },
    ],
  }),
  component: HubExplorarPage,
});

function HubExplorarPage() {
  const { q: initialQ, cat: initialCat } = Route.useSearch();

  const [allDocs, setAllDocs] = useState<DocItem[]>(HUB_DOCUMENTS);
  const [inputQ, setInputQ] = useState(initialQ ?? "");
  const [q, setQ] = useState(initialQ ?? "");
  const [cat, setCat] = useState<DocCategory | null>(
    DOC_CATEGORIES.some((c) => c.id === initialCat) ? (initialCat as DocCategory) : null
  );
  const [sort, setSort] = useState<"populares" | "recentes">("populares");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHubDocuments().then(setAllDocs);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(inputQ);
      setLoading(false);
    }, 280);
    if (inputQ !== q) setLoading(true);
    return () => clearTimeout(timer);
  }, [inputQ]);

  const docs = useMemo(() => {
    let list = [...allDocs];

    if (cat) list = list.filter((d) => d.category === cat);

    if (q.trim()) {
      const k = q.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(k) ||
          d.author.toLowerCase().includes(k) ||
          d.description.toLowerCase().includes(k) ||
          d.tags.some((t) => t.toLowerCase().includes(k))
      );
    }

    list.sort((a, b) =>
      sort === "populares"
        ? b.downloads - a.downloads
        : +new Date(b.uploadedAt) - +new Date(a.uploadedAt)
    );

    return list;
  }, [allDocs, cat, q, sort]);

  const activeFilters = [
    ...(cat ? [{ label: DOC_CATEGORIES.find((c) => c.id === cat)?.label ?? cat, clear: () => setCat(null) }] : []),
    ...(q ? [{ label: `"${q}"`, clear: () => { setInputQ(""); setQ(""); } }] : []),
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero text-brand-foreground py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link
            to="/hub"
            className="inline-flex items-center gap-1.5 text-sm text-brand-foreground/70 hover:text-gold mb-4 transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" /> Giseveral Hub
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Explorar documentos</h1>
          <p className="opacity-80 mb-6 text-sm sm:text-base">
            {allDocs.length} documentos académicos partilhados pela comunidade
          </p>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              placeholder="Pesquisar por título, autor, tema ou tag..."
              className="w-full h-12 pl-12 pr-12 rounded-xl bg-white text-foreground border-0 shadow-elegant outline-none placeholder:text-muted-foreground text-sm"
              aria-label="Pesquisar documentos"
            />
            {inputQ && (
              <button
                onClick={() => { setInputQ(""); setQ(""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Category chips */}
          <button
            onClick={() => setCat(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-smooth border-2 flex-shrink-0
              ${!cat ? "bg-brand text-brand-foreground border-brand" : "bg-card border-border hover:border-brand/40 text-foreground"}`}
          >
            Todos ({allDocs.length})
          </button>
          {DOC_CATEGORIES.map((c) => {
            const count = allDocs.filter((d) => d.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCat(cat === c.id ? null : c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-smooth border-2 flex-shrink-0
                  ${cat === c.id ? "bg-brand text-brand-foreground border-brand" : "bg-card border-border hover:border-brand/40 text-foreground"}`}
              >
                {c.icon} {c.label} ({count})
              </button>
            );
          })}

          {/* Sort + view controls */}
          <div className="ml-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "populares" | "recentes")}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground"
            >
              <option value="populares">Mais populares</option>
              <option value="recentes">Mais recentes</option>
            </select>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 transition-colors ${view === "grid" ? "bg-brand text-brand-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                aria-label="Vista em grelha"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 transition-colors ${view === "list" ? "bg-brand text-brand-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                aria-label="Vista em lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active filters + result count */}
        <div className="flex flex-wrap items-center gap-2 mb-5 min-h-[28px]">
          {activeFilters.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand text-xs font-medium px-3 py-1"
            >
              {f.label}
              <button onClick={f.clear} className="hover:text-destructive transition-colors" aria-label={`Remover filtro ${f.label}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {(q || cat) && (
            <span className="text-xs text-muted-foreground">
              {loading ? "A pesquisar…" : `${docs.length} resultado${docs.length !== 1 ? "s" : ""}`}
            </span>
          )}
          {activeFilters.length > 1 && (
            <button
              onClick={() => { setInputQ(""); setQ(""); setCat(null); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors underline"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className={view === "list" ? "space-y-3" : "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"}>
            {Array.from({ length: 4 }).map((_, i) =>
              view === "list" ? (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ) : (
                <DocumentCardSkeleton key={i} />
              )
            )}
          </div>
        )}

        {/* Results */}
        {!loading && docs.length === 0 && (
          <div className="text-center py-20 rounded-2xl bg-card border border-border">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2 text-brand">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {q && cat
                ? `Sem resultados para "${q}" em ${DOC_CATEGORIES.find((c) => c.id === cat)?.label}`
                : q
                ? `Sem resultados para "${q}"`
                : "Sem documentos nesta categoria ainda."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => { setInputQ(""); setQ(""); setCat(null); }}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
              >
                <X className="h-4 w-4" /> Limpar filtros
              </button>
              <Link
                to="/hub/cartas"
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
              >
                ✉️ Gerar carta
              </Link>
            </div>
          </div>
        )}

        {!loading && docs.length > 0 && (
          view === "list" ? (
            <div className="space-y-2">
              {docs.map((d) => <DocumentCard key={d.id} doc={d} variant="list" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {docs.map((d) => <DocumentCard key={d.id} doc={d} />)}
            </div>
          )
        )}

        {/* Footer hint */}
        {!loading && docs.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            {docs.length} de {allDocs.length} documentos · <Link to="/hub/cartas" className="text-brand hover:underline">Precisa de uma carta? →</Link>
          </p>
        )}
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

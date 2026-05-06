import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { DocumentCard } from "@/components/DocumentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES, DOCUMENTS, DocCategory } from "@/data/documents";
import { Search, SlidersHorizontal } from "lucide-react";
import { SEO } from "@/components/SEO";

const Explorar = () => {
  const [params, setParams] = useSearchParams();
  const initialCat = (params.get("cat") as DocCategory | null) ?? null;
  const [cat, setCat] = useState<DocCategory | null>(initialCat);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<"populares" | "recentes">("populares");

  const docs = useMemo(() => {
    let list = [...DOCUMENTS];
    if (cat) list = list.filter((d) => d.category === cat);
    if (q.trim()) {
      const k = q.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(k) || d.tags.some((t) => t.toLowerCase().includes(k)));
    }
    list.sort((a, b) => (sort === "populares" ? b.downloads - a.downloads : +new Date(b.uploadedAt) - +new Date(a.uploadedAt)));
    return list;
  }, [cat, q, sort]);

  const setCategory = (c: DocCategory | null) => {
    setCat(c);
    if (c) setParams({ cat: c }); else setParams({});
  };

  return (
    <Layout>
      <SEO
        title="Explorar documentos académicos — Giseveral Hub"
        description="Pesquise exames, sebentas, trabalhos e PDFs académicos partilhados por estudantes moçambicanos. Filtre por categoria."
      />
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container mx-auto container-px">
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2">Explorar documentos</h1>
          <p className="opacity-90 mb-6">Pesquise entre {DOCUMENTS.length} documentos académicos partilhados.</p>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por título, tema ou tag..."
              className="h-12 pl-12 bg-white text-foreground border-0 shadow-elegant"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto container-px py-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth border-2 ${!cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth border-2 ${cat === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium"
            >
              <option value="populares">Mais populares</option>
              <option value="recentes">Mais recentes</option>
            </select>
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-card border border-border">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="font-display font-bold text-lg mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground mb-4">Tente outra pesquisa ou categoria.</p>
            <Button onClick={() => { setQ(""); setCategory(null); }}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {docs.map((d) => <DocumentCard key={d.id} doc={d} />)}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Explorar;

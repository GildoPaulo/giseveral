import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, Package, Award, FileText, Newspaper, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductResult {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

interface BolsaResult {
  id: string;
  title: string;
  institution: string;
  status: string;
}

interface ExameResult {
  id: string;
  title: string;
  subject: string;
  institution: string;
}

interface NoticiaResult {
  id: string;
  title: string;
  category: string;
  published: boolean;
}

interface SearchResults {
  products: ProductResult[];
  bolsas: BolsaResult[];
  exames: ExameResult[];
  noticias: NoticiaResult[];
}

// ── Suggestion categories (zero state) ───────────────────────────────────────

const SUGGESTIONS = [
  { icon: Package,   label: "Produtos",   desc: "Papelaria, impressão, serviços" },
  { icon: Award,     label: "Bolsas",     desc: "Oportunidades de financiamento" },
  { icon: FileText,  label: "Exames",     desc: "Provas e concursos" },
  { icon: Newspaper, label: "Notícias",   desc: "Últimas novidades" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonLine({ wide }: { wide?: boolean }) {
  return (
    <div className={cn("h-3 rounded-full bg-muted animate-pulse", wide ? "w-2/3" : "w-1/3")} />
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonLine wide />
              <SkeletonLine />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent transition-colors group"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 group-hover:text-brand transition-colors" />
      </button>
    </li>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-2">
      <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    products: [],
    bolsas: [],
    exames: [],
    noticias: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults({ products: [], bolsas: [], exames: [], noticias: [] });
    }
  }, [open]);

  // Escape key closes modal
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Debounced search (300 ms)
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults({ products: [], bolsas: [], exames: [], noticias: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [
          { data: products },
          { data: bolsas },
          { data: exames },
          { data: noticias },
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,price,active")
            .ilike("name", `%${term}%`)
            .eq("active", true)
            .limit(4),
          (supabase as any)
            .from("hub_scholarships")
            .select("id,title,institution,status")
            .ilike("title", `%${term}%`)
            .limit(4),
          (supabase as any)
            .from("hub_exams")
            .select("id,title,subject,institution")
            .ilike("title", `%${term}%`)
            .limit(4),
          (supabase as any)
            .from("hub_news")
            .select("id,title,category,published")
            .ilike("title", `%${term}%`)
            .eq("published", true)
            .limit(4),
        ]);

        setResults({
          products: products ?? [],
          bolsas: bolsas ?? [],
          exames: exames ?? [],
          noticias: noticias ?? [],
        });
      } catch {
        // fail silently
        setResults({ products: [], bolsas: [], exames: [], noticias: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const term = query.trim();
  const hasResults =
    results.products.length > 0 ||
    results.bolsas.length > 0 ||
    results.exames.length > 0 ||
    results.noticias.length > 0;

  function go(path: string) {
    navigate({ to: path });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar produtos, bolsas, exames, notícias…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground border border-border hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            Esc
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">

          {/* Zero state — no query */}
          {!term && (
            <div className="px-4 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Explorar por categoria
              </p>
              <ul className="space-y-1">
                {SUGGESTIONS.map(({ icon: Icon, label, desc }) => (
                  <li key={label}>
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-default">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Loading state */}
          {term && loading && (
            <div className="divide-y divide-border">
              <SectionSkeleton label="Produtos" />
              <SectionSkeleton label="Bolsas" />
            </div>
          )}

          {/* Results */}
          {term && !loading && hasResults && (
            <div className="divide-y divide-border/60 px-2 py-2 space-y-1">
              {results.products.length > 0 && (
                <Section label="Produtos">
                  {results.products.map((p) => (
                    <ResultRow
                      key={p.id}
                      icon={Package}
                      title={p.name}
                      subtitle={`${Number(p.price).toLocaleString("pt-AO")} Kz`}
                      onClick={() => go(`/loja/produto/${p.id}`)}
                    />
                  ))}
                </Section>
              )}

              {results.bolsas.length > 0 && (
                <Section label="Bolsas">
                  {results.bolsas.map((b) => (
                    <ResultRow
                      key={b.id}
                      icon={Award}
                      title={b.title}
                      subtitle={b.institution ?? b.status ?? ""}
                      onClick={() => go(`/hub/bolsas/${b.id}`)}
                    />
                  ))}
                </Section>
              )}

              {results.exames.length > 0 && (
                <Section label="Exames">
                  {results.exames.map((ex) => (
                    <ResultRow
                      key={ex.id}
                      icon={FileText}
                      title={ex.title}
                      subtitle={[ex.subject, ex.institution].filter(Boolean).join(" · ")}
                      onClick={() => go(`/hub/exames/${ex.id}`)}
                    />
                  ))}
                </Section>
              )}

              {results.noticias.length > 0 && (
                <Section label="Notícias">
                  {results.noticias.map((n) => (
                    <ResultRow
                      key={n.id}
                      icon={Newspaper}
                      title={n.title}
                      subtitle={n.category ?? ""}
                      onClick={() => go(`/hub/noticias/${n.id}`)}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}

          {/* Empty state */}
          {term && !loading && !hasResults && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
              <Search className="h-10 w-10 opacity-20" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Sem resultados para "{term}"</p>
                <p className="text-xs text-muted-foreground mt-1">Tente termos diferentes ou mais curtos.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground/60">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> selecionar</span>
          <span><kbd className="font-mono">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ZoomIn, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import printing from "@/assets/printing.jpg";
import repair from "@/assets/computer-repair.jpg";
import network from "@/assets/network.jpg";
import stationery from "@/assets/stationery.jpg";
import router from "@/assets/router.jpg";
import windows from "@/assets/windows-install.jpg";
import documents from "@/assets/documents.jpg";
import cabling from "@/assets/blog-cabling.jpg";
import { GALLERY_CATEGORIES, categoryLabel } from "@/data/gallery-categories";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria — Giseveral e Services" },
      {
        name: "description",
        content:
          "Portfólio de trabalhos da Giseveral: impressão, informática, redes, design e mais.",
      },
    ],
  }),
  component: GaleriaPage,
});

type GalleryImg = { image_url: string; is_cover: boolean | null; step_order: number | null };
type PortfolioProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  client_name: string | null;
  project_date: string | null;
  is_featured: boolean | null;
  gallery_images: GalleryImg[] | null;
};

type StaticItem = {
  id: string;
  img: string;
  category: string;
  title: string;
  description: string;
  client?: string;
  rating?: number;
};

const staticItems: StaticItem[] = [
  {
    id: "s1",
    img: printing,
    category: "Impressão",
    title: "Impressão a cores profissional",
    description: "Brochuras, relatórios e materiais de marketing com alta definição.",
    client: "Cliente empresarial",
    rating: 5,
  },
  {
    id: "s2",
    img: documents,
    category: "Impressão",
    title: "Documentos e fotocópias",
    description: "Impressão de documentos empresariais em papel A4 80g.",
    rating: 5,
  },
  {
    id: "s3",
    img: repair,
    category: "Informática",
    title: "Reparação de computadores",
    description: "Diagnóstico, substituição de componentes e limpeza interna.",
    client: "Particular",
    rating: 5,
  },
  {
    id: "s4",
    img: windows,
    category: "Informática",
    title: "Instalação de Windows",
    description: "Formatação completa, Windows 10/11 e drivers actualizados.",
    rating: 4,
  },
  {
    id: "s5",
    img: router,
    category: "Redes",
    title: "Configuração de routers Wi-Fi",
    description: "Router configurado com cobertura e segurança WPA2.",
    rating: 5,
  },
  {
    id: "s6",
    img: network,
    category: "Redes",
    title: "Redes LAN empresariais",
    description: "Instalação de rede local com switch e cablagem organizada.",
    client: "Empresa local",
    rating: 5,
  },
  {
    id: "s7",
    img: cabling,
    category: "Redes",
    title: "Cabeamento estruturado",
    description: "Infraestrutura de rede com identificação de pontos.",
    rating: 4,
  },
  {
    id: "s8",
    img: stationery,
    category: "Papelaria",
    title: "Material escolar e escritório",
    description: "Cadernos, canetas, pastas e papel para escola ou empresa.",
    rating: 5,
  },
];

function coverUrl(images: GalleryImg[] | null | undefined): string | undefined {
  if (!images?.length) return undefined;
  const sorted = [...images].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
  return (sorted.find((i) => i.is_cover) ?? sorted[sorted.length - 1])?.image_url;
}

function GaleriaPage() {
  const [portfolio, setPortfolio] = useState<PortfolioProject[] | null>(null);
  const [filter, setFilter] = useState<string>("todos");
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("gallery_projects")
        .select(
          "id, slug, title, description, category, client_name, project_date, is_featured, gallery_images(image_url, is_cover, step_order)",
        )
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("project_date", { ascending: false });
      setPortfolio((data as PortfolioProject[] | null) ?? []);
    })();
  }, []);

  const usePortfolio = (portfolio?.length ?? 0) > 0;

  const filteredPortfolio =
    !usePortfolio || !portfolio
      ? []
      : filter === "todos"
        ? portfolio
        : portfolio.filter((p) => p.category === filter);

  const staticCats = new Set(staticItems.map((i) => i.category));
  const staticFilterList = ["Todos", ...Array.from(staticCats)];

  const filteredStatic =
    filter === "todos"
      ? staticItems
      : staticItems.filter(
          (i) => i.category === (GALLERY_CATEGORIES.find((c) => c.id === filter)?.label ?? filter),
        );

  const featured = usePortfolio ? (portfolio ?? []).filter((p) => p.is_featured).slice(0, 4) : [];

  return (
    <Layout>
      <PageHero
        title="Galeria de trabalhos"
        subtitle="Qualidade visível em cada projecto que realizamos para os nossos clientes."
      />

      <section className="container mx-auto px-4 py-12 max-w-7xl">
        {portfolio === null && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {usePortfolio && featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-brand mb-4">Em destaque</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((p) => {
                const src = coverUrl(p.gallery_images);
                if (!src) return null;
                return (
                  <Link
                    key={p.id}
                    to="/galeria/$slug"
                    params={{ slug: p.slug }}
                    className="group rounded-xl border border-border overflow-hidden bg-card shadow-card hover:shadow-elegant transition-all"
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img
                        src={src}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold uppercase text-gold">
                        {categoryLabel(p.category)}
                      </p>
                      <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-brand">
                        {p.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative flex flex-wrap justify-center gap-2 mb-10">
          {(usePortfolio
            ? GALLERY_CATEGORIES
            : staticFilterList.map((c) => ({ id: c === "Todos" ? "todos" : c, label: c, icon: "" }))
          ).map((cat) => {
            const id = "id" in cat ? cat.id : (cat as { id: string }).id;
            const label = "label" in cat ? cat.label : (cat as { label: string }).label;
            const icon = "icon" in cat ? cat.icon : "";
            const fid = usePortfolio ? id : id === "Todos" ? "todos" : id;
            const active =
              filter === fid ||
              (!usePortfolio && ((filter === "todos" && label === "Todos") || filter === label));
            const displayFilter = usePortfolio ? fid : label === "Todos" ? "todos" : label;
            const isActive = usePortfolio ? filter === fid : filter === displayFilter;
            return (
              <button
                key={String(label) + String(fid)}
                type="button"
                onClick={() => setFilter(usePortfolio ? fid : displayFilter)}
                className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-brand-foreground"
                    : "border border-border bg-card text-muted-foreground hover:border-gold/50 hover:text-brand"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="galeria-filter-pill"
                    className="absolute inset-0 rounded-full bg-gradient-brand -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {icon ? `${icon} ${label}` : label}
              </button>
            );
          })}
        </div>

        {usePortfolio ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
            >
              {filteredPortfolio.map((p) => {
                const src = coverUrl(p.gallery_images);
                if (!src) return null;
                return (
                  <div key={p.id} className="break-inside-avoid mb-4">
                    <Link
                      to="/galeria/$slug"
                      params={{ slug: p.slug }}
                      className="group block w-full text-left relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="overflow-hidden bg-muted">
                        <img
                          src={src}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gold mb-1">
                          {categoryLabel(p.category)}
                        </span>
                        <p className="text-sm font-semibold text-brand-foreground leading-snug line-clamp-2">
                          {p.title}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-brand-foreground/80 text-xs">
                          <ZoomIn className="h-3.5 w-3.5" /> Ver projecto
                        </div>
                      </div>
                      <div className="p-3 border-t border-border/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                          {categoryLabel(p.category)}
                        </span>
                        <p className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1">
                          {p.title}
                        </p>
                        {p.client_name && (
                          <p className="text-xs text-muted-foreground mt-1">{p.client_name}</p>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
            >
              {(filter === "todos" ? staticItems : filteredStatic).map((item, idx) => (
                <div key={item.id} className="break-inside-avoid mb-4">
                  <button
                    type="button"
                    onClick={() => setLightbox(idx)}
                    className="group w-full text-left relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elegant transition-all duration-300"
                  >
                    <div className="overflow-hidden bg-muted">
                      <img
                        src={item.img}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                        {item.category}
                      </span>
                      <p className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1">
                        {item.title}
                      </p>
                      {item.rating && (
                        <div className="mt-1 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${s <= item.rating! ? "fill-gold text-gold" : "text-border"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {usePortfolio && filteredPortfolio.length === 0 && portfolio !== null && (
          <p className="text-center text-muted-foreground py-16 text-sm">
            Nenhum projecto nesta categoria.
          </p>
        )}
      </section>

      {!usePortfolio && lightbox !== null && (
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-3xl w-full bg-card rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={(filter === "todos" ? staticItems : filteredStatic)[lightbox]?.img}
              alt=""
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-4 text-left">
              <p className="font-bold">
                {(filter === "todos" ? staticItems : filteredStatic)[lightbox]?.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {(filter === "todos" ? staticItems : filteredStatic)[lightbox]?.description}
              </p>
            </div>
          </div>
        </button>
      )}

      <WhatsAppFab />
    </Layout>
  );
}

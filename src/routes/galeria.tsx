import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, Star, ZoomIn,
  ArrowLeftRight, ExternalLink, Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import printing from "@/assets/printing.jpg";
import repair from "@/assets/computer-repair.jpg";
import network from "@/assets/network.jpg";
import stationery from "@/assets/stationery.jpg";
import router from "@/assets/router.jpg";
import windows from "@/assets/windows-install.jpg";
import documents from "@/assets/documents.jpg";
import cabling from "@/assets/blog-cabling.jpg";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria — Giseveral e Services" },
      { name: "description", content: "Portfólio de trabalhos da Giseveral: impressão, reparação de computadores, instalação de redes e muito mais." },
    ],
  }),
  component: GaleriaPage,
});

type Item = {
  id: string;
  img?: string;
  url?: string;
  before_url?: string | null;
  title: string;
  description: string;
  category: string;
  client?: string;
  rating?: number;
  project_url?: string | null;
};

const staticItems: Item[] = [
  { id: "s1", img: printing,   category: "Impressão",   title: "Impressão a cores profissional",   description: "Brochuras, relatórios e materiais de marketing com alta definição e cores vibrantes.", client: "Cliente empresarial", rating: 5 },
  { id: "s2", img: documents,  category: "Impressão",   title: "Documentos e fotocópias",          description: "Impressão de documentos empresariais em papel A4 80g com encadernação profissional.", rating: 5 },
  { id: "s3", img: repair,     category: "Informática", title: "Reparação de computadores",        description: "Diagnóstico, substituição de componentes, limpeza interna e testes de performance.", client: "Particular", rating: 5 },
  { id: "s4", img: windows,    category: "Informática", title: "Instalação de Windows",            description: "Formatação completa, Windows 10/11, drivers atualizados e software essencial.", rating: 4 },
  { id: "s5", img: router,     category: "Redes",       title: "Configuração de routers Wi-Fi",   description: "Router doméstico ou empresarial configurado com cobertura máxima e segurança WPA2.", rating: 5 },
  { id: "s6", img: network,    category: "Redes",       title: "Redes LAN empresariais",          description: "Instalação de rede local em escritório com switch, patch panel e cablagem organizada.", client: "Empresa local", rating: 5 },
  { id: "s7", img: cabling,    category: "Redes",       title: "Cabeamento estruturado",          description: "Infraestrutura de rede com identificação de pontos, condutas e organização de cabos.", rating: 4 },
  { id: "s8", img: stationery, category: "Papelaria",   title: "Material escolar e escritório",   description: "Cadernos, canetas, pastas, papel e tudo o que precisas para a escola ou empresa.", rating: 5 },
];

const CATEGORY_ORDER = ["Todos", "Impressão", "Informática", "Redes", "Papelaria", "Design", "Outro"];

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: Item[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const [showBefore, setShowBefore] = useState(false);

  // Reset before/after when item changes
  useEffect(() => setShowBefore(false), [index]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  const imgSrc = showBefore ? (item.before_url ?? item.img ?? item.url) : (item.img ?? item.url);
  const hasBeforeAfter = Boolean(item.before_url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-4xl rounded-2xl bg-card overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            {item.category}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">{index + 1} / {items.length}</span>
            {item.project_url && (
              <a href={item.project_url} target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="relative bg-black aspect-video overflow-hidden">
          <AnimatePresence mode="sync">
            <motion.img
              key={showBefore ? "before" : "after"}
              src={imgSrc}
              alt={item.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-contain"
            />
          </AnimatePresence>

          {/* Before/After toggle */}
          {hasBeforeAfter && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => setShowBefore((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-4 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {showBefore ? "Ver Depois" : "Ver Antes"}
              </button>
            </div>
          )}

          {/* Prev / Next */}
          <button onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Info panel */}
        <div className="p-5 grid sm:grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-snug">{item.title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            {item.client && (
              <p className="mt-2 text-xs text-muted-foreground">
                Cliente: <span className="font-medium text-foreground">{item.client}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            {item.rating && (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= (item.rating ?? 0) ? "fill-gold text-gold" : "text-border"}`} />
                ))}
              </div>
            )}
            <a
              href={`https://wa.me/258874383621?text=${encodeURIComponent(`Vi o trabalho "${item.title}" na vossa galeria e gostaria de saber mais.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Share2 className="h-3.5 w-3.5" /> Pedir similar
            </a>
          </div>
        </div>

        {/* Dot nav */}
        <div className="flex justify-center gap-1.5 pb-4">
          {items.map((_, i) => (
            <span key={i} className={`inline-block rounded-full transition-all ${i === index ? "w-5 h-1.5 bg-brand" : "w-1.5 h-1.5 bg-border"}`} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function GaleriaPage() {
  const [items, setItems] = useState<Item[]>(staticItems);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState("Todos");

  useEffect(() => {
    (supabase as any)
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => {
        if (data && data.length > 0) {
          const dbItems: Item[] = data.map((d) => ({
            id: d.id,
            img: d.url,
            url: d.url,
            before_url: d.before_url ?? null,
            title: d.title,
            description: d.description,
            category: d.category,
            client: d.client || undefined,
            rating: d.rating,
            project_url: d.project_url ?? null,
          }));
          setItems([...dbItems, ...staticItems]);
        }
      });
  }, []);

  const usedCats = new Set(items.map((i) => i.category));
  const categories = CATEGORY_ORDER.filter((c) => c === "Todos" || usedCats.has(c));

  const filtered = filter === "Todos" ? items : items.filter((i) => i.category === filter);

  const openItem = (idx: number) => setActiveIdx(idx);
  const closeItem = () => setActiveIdx(null);
  const prevItem = useCallback(() => setActiveIdx((i) => i !== null ? (i - 1 + filtered.length) % filtered.length : null), [filtered.length]);
  const nextItem = useCallback(() => setActiveIdx((i) => i !== null ? (i + 1) % filtered.length : null), [filtered.length]);

  return (
    <Layout>
      <PageHero
        title="Galeria de trabalhos"
        subtitle="Qualidade visível em cada projecto que realizamos para os nossos clientes."
      />

      <section className="container mx-auto px-4 py-12 max-w-7xl">

        {/* Category filters with animated indicator */}
        <div className="relative flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const active = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  active
                    ? "text-brand-foreground"
                    : "border border-border bg-card text-muted-foreground hover:border-gold/50 hover:text-brand"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-gradient-brand"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {cat}
                {cat !== "Todos" && (
                  <span className={`ml-1.5 text-xs ${active ? "text-brand-foreground/60" : "text-muted-foreground/60"}`}>
                    {items.filter((i) => i.category === cat).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Masonry grid using CSS columns */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
          >
            {filtered.map((item, idx) => (
              <div key={item.id} className="break-inside-avoid mb-4">
                <button
                  onClick={() => openItem(idx)}
                  className="group w-full text-left relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5"
                >
                  {/* Image */}
                  <div className="overflow-hidden bg-muted">
                    <img
                      src={item.img ?? item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/50 to-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold mb-1">{item.category}</span>
                    <p className="text-sm font-semibold text-brand-foreground leading-snug line-clamp-2">{item.title}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <ZoomIn className="h-3.5 w-3.5 text-brand-foreground/70" />
                      <span className="text-xs text-brand-foreground/70">Ver em destaque</span>
                      {item.before_url && (
                        <span className="ml-auto text-[10px] bg-gold/20 text-gold rounded px-1.5 py-0.5 font-semibold">Antes/Depois</span>
                      )}
                    </div>
                  </div>

                  {/* Card footer (always visible) */}
                  <div className="p-3 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{item.category}</span>
                    <p className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
                    {item.rating && (
                      <div className="mt-1 flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= item.rating! ? "fill-gold text-gold" : "text-border"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-sm">Nenhum trabalho nesta categoria ainda.</p>
          </div>
        )}
      </section>

      {/* Premium Lightbox */}
      <AnimatePresence>
        {activeIdx !== null && (
          <Lightbox
            items={filtered}
            index={activeIdx}
            onClose={closeItem}
            onPrev={prevItem}
            onNext={nextItem}
          />
        )}
      </AnimatePresence>

      <WhatsAppFab />
    </Layout>
  );
}

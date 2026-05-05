import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useEffect, useState } from "react";
import { X, ZoomIn, Star } from "lucide-react";
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
      { name: "description", content: "Portfólio de trabalhos da Giseveral: impressão, reparação de computadores, instalação de redes e mais." },
    ],
  }),
  component: GaleriaPage,
});

type Item = {
  id: string;
  img?: string;
  url?: string;
  title: string;
  description: string;
  category: string;
  client?: string;
  rating?: number;
};

const staticItems: Item[] = [
  { id: "s1", img: printing,   category: "Impressão",  title: "Impressão a cores profissional",    description: "Brochuras, relatórios e materiais de marketing com alta definição e cores vibrantes." },
  { id: "s2", img: documents,  category: "Impressão",  title: "Documentos e fotocópias",           description: "Impressão de documentos empresariais em papel A4 80g com encadernação profissional." },
  { id: "s3", img: repair,     category: "Informática", title: "Reparação de computadores",        description: "Diagnóstico, substituição de componentes, limpeza interna e testes de performance." },
  { id: "s4", img: windows,    category: "Informática", title: "Instalação de Windows",            description: "Formatação completa, Windows 10/11, drivers atualizados e software essencial." },
  { id: "s5", img: router,     category: "Redes",       title: "Configuração de routers Wi-Fi",   description: "Router doméstico ou empresarial configurado com cobertura máxima e segurança WPA2." },
  { id: "s6", img: network,    category: "Redes",       title: "Redes LAN empresariais",          description: "Instalação de rede local em escritório com switch, patch panel e cablagem organizada." },
  { id: "s7", img: cabling,    category: "Redes",       title: "Cabeamento estruturado",          description: "Infraestrutura de rede com identificação de pontos, condutas e organização de cabos." },
  { id: "s8", img: stationery, category: "Papelaria",   title: "Material escolar e escritório",   description: "Cadernos, canetas, pastas, papel e tudo o que precisas para a escola ou empresa." },
];

const ALL_CATEGORIES = ["Todos", "Impressão", "Informática", "Redes", "Papelaria", "Design", "Outro"];

function GaleriaPage() {
  const [items, setItems] = useState<Item[]>(staticItems);
  const [active, setActive] = useState<Item | null>(null);
  const [filter, setFilter] = useState("Todos");

  useEffect(() => {
    (supabase as any)
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => {
        if (data && data.length > 0) {
          setItems(data.map((d) => ({ ...d, img: d.url })));
        }
      });
  }, []);

  const usedCategories = ["Todos", ...Array.from(new Set(items.map((i) => i.category)))];
  const categories = ALL_CATEGORIES.filter((c) => usedCategories.includes(c));
  const filtered = filter === "Todos" ? items : items.filter((i) => i.category === filter);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <Layout>
      <PageHero
        title="Galeria de trabalhos"
        subtitle="Qualidade que se vê em cada serviço que realizamos."
      />

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-smooth ${
                filter === cat
                  ? "bg-gradient-brand text-brand-foreground shadow-card"
                  : "border border-border bg-card text-muted-foreground hover:border-gold/50 hover:text-brand"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => setActive(it)}
              className="group relative overflow-hidden rounded-2xl bg-card text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={it.img ?? it.url}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-smooth duration-500 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/40 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex flex-col justify-end p-5">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-1">{it.category}</span>
                <p className="text-sm font-semibold text-brand-foreground leading-snug">{it.title}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand-foreground/70">
                  <ZoomIn className="h-3 w-3" /> Clica para ver
                </span>
              </div>
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold">{it.category}</span>
                <p className="mt-0.5 text-sm font-semibold text-brand line-clamp-1">{it.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand/80 backdrop-blur text-brand-foreground hover:bg-brand transition-smooth"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video overflow-hidden">
              <img src={active.img ?? active.url} alt={active.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-6">
              <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
                {active.category}
              </span>
              <h2 className="mt-3 text-xl font-bold text-brand">{active.title}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{active.description}</p>
              {active.client && (
                <p className="mt-2 text-sm text-muted-foreground">Cliente: <span className="font-medium text-foreground">{active.client}</span></p>
              )}
              {active.rating && (
                <div className="mt-3 flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= (active.rating ?? 0) ? "fill-gold text-gold" : "text-border"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <WhatsAppFab />
    </Layout>
  );
}

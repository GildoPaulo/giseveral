import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";
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

type Item = { img: string; title: string; description: string; category: string };

const items: Item[] = [
  { img: printing,   category: "Impressão",  title: "Impressão a cores profissional",    description: "Brochuras, relatórios e materiais de marketing com alta definição e cores vibrantes." },
  { img: documents,  category: "Impressão",  title: "Documentos e fotocópias",           description: "Impressão de documentos empresariais em papel A4 80g com encadernação profissional." },
  { img: repair,     category: "Informática", title: "Reparação de computadores",        description: "Diagnóstico, substituição de componentes, limpeza interna e testes de performance." },
  { img: windows,    category: "Informática", title: "Instalação de Windows",            description: "Formatação completa, Windows 10/11, drivers atualizados e software essencial." },
  { img: router,     category: "Redes",       title: "Configuração de routers Wi-Fi",   description: "Router doméstico ou empresarial configurado com cobertura máxima e segurança WPA2." },
  { img: network,    category: "Redes",       title: "Redes LAN empresariais",          description: "Instalação de rede local em escritório com switch, patch panel e cablagem organizada." },
  { img: cabling,    category: "Redes",       title: "Cabeamento estruturado",          description: "Infraestrutura de rede com identificação de pontos, condutas e organização de cabos." },
  { img: stationery, category: "Papelaria",   title: "Material escolar e escritório",   description: "Cadernos, canetas, pastas, papel e tudo o que precisas para a escola ou empresa." },
];

const categories = ["Todos", "Impressão", "Informática", "Redes", "Papelaria"];

function GaleriaPage() {
  const [active, setActive] = useState<Item | null>(null);
  const [filter, setFilter] = useState("Todos");

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
        {/* Category filter pills */}
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

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((it) => (
            <button
              key={it.title}
              onClick={() => setActive(it)}
              className="group relative overflow-hidden rounded-2xl bg-card text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={it.img}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-smooth duration-500 group-hover:scale-110"
                />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/40 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex flex-col justify-end p-5">
                <span className="text-xs font-bold uppercase tracking-widest text-gold mb-1">{it.category}</span>
                <p className="text-sm font-semibold text-brand-foreground leading-snug">{it.title}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand-foreground/70">
                  <ZoomIn className="h-3 w-3" /> Clica para ver
                </span>
              </div>
              {/* Static caption */}
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold">{it.category}</span>
                <p className="mt-0.5 text-sm font-semibold text-brand line-clamp-1">{it.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Modal */}
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
              <img src={active.img} alt={active.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-6">
              <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
                {active.category}
              </span>
              <h2 className="mt-3 text-xl font-bold text-brand">{active.title}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{active.description}</p>
            </div>
          </div>
        </div>
      )}

      <WhatsAppFab />
    </Layout>
  );
}

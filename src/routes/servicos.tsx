import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Printer, BookOpen, Palette, Laptop, Network } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Giseveral e Services" },
      { name: "description", content: "Reprografia, papelaria, design gráfico, informática e redes. Conheça todos os serviços da Giseveral." },
    ],
  }),
  component: ServicosPage,
});

const categorias = [
  {
    icon: Printer, title: "Reprografia",
    items: ["Impressão a cores e preto e branco", "Fotocópias", "Digitalização de documentos", "Encadernação e plastificação"],
  },
  {
    icon: BookOpen, title: "Papelaria",
    items: ["Material escolar", "Material de escritório", "Pastas, cadernos, canetas", "Organização de arquivos"],
  },
  {
    icon: Palette, title: "Design Gráfico",
    items: ["Flyers e panfletos", "Cartazes e banners", "Convites personalizados", "Edição básica de imagens"],
  },
  {
    icon: Laptop, title: "Informática",
    items: ["Formatação de computadores", "Instalação de Windows e programas", "Remoção de vírus", "Configuração de sistemas"],
  },
  {
    icon: Network, title: "Redes e Tecnologia",
    items: ["Instalação de internet (Wi-Fi e LAN)", "Configuração de routers", "Cabeamento de rede", "Diagnóstico de rede"],
  },
];

function ServicosPage() {
  return (
    <Layout>
      <PageHero title="Os nossos serviços" subtitle="Soluções completas em papel, informática e redes." />
      <section className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-6">
        {categorias.map((cat) => (
          <article key={cat.title} className="rounded-xl border border-border bg-card p-6 shadow-card transition-smooth hover:shadow-elegant">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground">
                <cat.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-brand">{cat.title}</h3>
            </div>
            <ul className="mt-5 space-y-2.5">
              {cat.items.map((it) => (
                <li key={it} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                  {it}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <WhatsAppFab />
    </Layout>
  );
}

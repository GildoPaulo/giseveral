import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { CheckCircle2 } from "lucide-react";
import repair from "@/assets/computer-repair.jpg";
import windows from "@/assets/windows-install.jpg";

export const Route = createFileRoute("/informatica")({
  head: () => ({
    meta: [
      { title: "Informática — Giseveral e Services" },
      { name: "description", content: "Formatação de PCs, instalação de Windows, software, antivírus e otimização de desempenho na Beira." },
    ],
  }),
  component: InformaticaPage,
});

const services = [
  "Formatação de PCs e laptops",
  "Instalação de sistemas operativos (Windows)",
  "Instalação de software (Office, antivírus, etc.)",
  "Remoção de vírus e malware",
  "Otimização de desempenho",
  "Reparação básica de hardware",
];

function InformaticaPage() {
  return (
    <Layout>
      <PageHero title="Assistência Informática" subtitle="O seu computador a funcionar como novo." />
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand">Serviços técnicos</h2>
          <p className="mt-3 text-muted-foreground">Soluções rápidas e confiáveis para o seu equipamento.</p>
          <ul className="mt-6 space-y-3">
            {services.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-gold shrink-0" />
                <span className="text-foreground/85">{s}</span>
              </li>
            ))}
          </ul>
          <Link to="/contactos" className="mt-8 inline-flex items-center justify-center rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
            Pedir Assistência
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <img src={repair} alt="Técnico a reparar computador" loading="lazy" className="rounded-xl shadow-card aspect-[3/4] object-cover" />
          <img src={windows} alt="Instalação de Windows" loading="lazy" className="rounded-xl shadow-card aspect-[3/4] object-cover mt-8" />
        </div>
      </section>
      <WhatsAppFab />
    </Layout>
  );
}

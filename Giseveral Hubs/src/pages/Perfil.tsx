import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/DocumentCard";
import { DOCUMENTS } from "@/data/documents";
import { Coins, Crown, Download, Upload, Settings, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Perfil = () => {
  const meusDocs = DOCUMENTS.slice(0, 3);
  const baixados = DOCUMENTS.slice(3, 6);

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground py-10">
        <div className="container mx-auto container-px">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-accent text-accent-foreground font-display font-bold text-3xl shadow-elegant">
              CM
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl sm:text-3xl mb-1">Carlos Mucavele</h1>
              <p className="opacity-80 text-sm">carlos@email.com · Membro desde Set 2024</p>
            </div>
            <Button variant="hero">
              <Settings className="h-4 w-4" /> Editar perfil
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { icon: Coins, label: "Créditos", value: "3", accent: true },
              { icon: Upload, label: "Enviados", value: meusDocs.length },
              { icon: Download, label: "Baixados", value: baixados.length },
              { icon: Crown, label: "Plano", value: "Grátis" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <s.icon className={`h-5 w-5 mb-2 ${s.accent ? "text-accent" : "opacity-80"}`} />
                <div className="font-display font-bold text-2xl">{s.value}</div>
                <div className="text-xs opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto container-px py-10 space-y-12">
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Os meus documentos
            </h2>
            <Button asChild size="sm">
              <Link to="/upload"><Upload className="h-4 w-4" /> Enviar novo</Link>
            </Button>
          </div>
          {meusDocs.length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-card border border-border">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-3">Ainda não enviou nenhum documento</p>
              <Button asChild><Link to="/upload">Enviar o primeiro</Link></Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {meusDocs.map((d) => <DocumentCard key={d.id} doc={d} />)}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2 mb-5">
            <Download className="h-5 w-5 text-primary" /> Histórico de downloads
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {baixados.map((d) => <DocumentCard key={d.id} doc={d} />)}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Perfil;

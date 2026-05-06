import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PdfViewer } from "@/components/PdfViewer";
import { PrintModal } from "@/components/PrintModal";
import { ReportModal } from "@/components/ReportModal";
import { DocumentCard } from "@/components/DocumentCard";
import { getDocById, DOCUMENTS, CATEGORIES } from "@/data/documents";
import { useToast } from "@/hooks/use-toast";
import { Download, Printer, Flag, Share2, Calendar, FileText, Eye, Coins, Crown, ChevronLeft, User } from "lucide-react";

const Documento = () => {
  const { id } = useParams();
  const doc = id ? getDocById(id) : null;
  const [printOpen, setPrintOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { toast } = useToast();

  if (!doc) {
    return (
      <Layout>
        <div className="container mx-auto container-px py-20 text-center">
          <h1 className="font-display font-bold text-2xl mb-3">Documento não encontrado</h1>
          <Button asChild><Link to="/explorar">Voltar a explorar</Link></Button>
        </div>
      </Layout>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === doc.category)!;
  const related = DOCUMENTS.filter((d) => d.category === doc.category && d.id !== doc.id).slice(0, 4);

  return (
    <Layout>
      <div className="container mx-auto container-px py-6">
        <Link to="/explorar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-smooth mb-4">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* MAIN */}
          <div>
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Link to={`/explorar?cat=${cat.id}`}>
                  <Badge variant="secondary" className="font-medium">{cat.icon} {cat.label}</Badge>
                </Link>
                {doc.premium && (
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                    <Crown className="h-3 w-3 mr-1" /> Premium
                  </Badge>
                )}
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-balance mb-3">{doc.title}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {doc.author}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(doc.uploadedAt).toLocaleDateString("pt-PT")}</span>
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {doc.pages} páginas</span>
                <span className="flex items-center gap-1.5"><Download className="h-4 w-4" /> {doc.downloads.toLocaleString()} downloads</span>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {doc.views.toLocaleString()} vistas</span>
              </div>
            </div>

            <PdfViewer pages={doc.pages} title={doc.title} />

            <div className="mt-8 rounded-xl bg-card border border-border p-6">
              <h3 className="font-display font-bold text-lg mb-3">Sobre este documento</h3>
              <p className="text-muted-foreground leading-relaxed">{doc.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {doc.tags.map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">#{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <div className="rounded-2xl bg-gradient-hero text-primary-foreground p-6 shadow-elegant">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider opacity-90">
                <Coins className="h-4 w-4 text-accent" /> Custo do download
              </div>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-5xl font-display font-bold text-accent">1</span>
                <span className="opacity-80">crédito</span>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="w-full mb-2"
                onClick={() => toast({ title: "Download iniciado", description: "1 crédito foi descontado da sua conta." })}
              >
                <Download className="h-5 w-5" /> Descarregar PDF
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-white/10 border-white/20 text-primary-foreground hover:bg-white hover:text-primary"
                onClick={() => setPrintOpen(true)}
              >
                <Printer className="h-5 w-5" /> Imprimir na Giseveral
              </Button>
              <p className="text-[11px] opacity-70 mt-3 text-center">Premium = downloads ilimitados</p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5">
              <h4 className="font-semibold mb-3 text-sm">Acções</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { navigator.clipboard?.writeText(window.location.href); toast({ title: "Link copiado!" }); }}
                >
                  <Share2 className="h-4 w-4" /> Partilhar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4" /> Denunciar
                </Button>
              </div>
            </div>

            <div className="rounded-2xl bg-secondary/60 border border-border p-5 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Crown className="h-4 w-4 text-accent" /> Vire Premium
              </div>
              <p className="text-muted-foreground text-xs mb-3">Sem créditos, sem anúncios, downloads ilimitados.</p>
              <Button asChild variant="accent" size="sm" className="w-full">
                <Link to="/premium">Saber mais</Link>
              </Button>
            </div>
          </aside>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-bold text-2xl mb-5">Documentos relacionados</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((d) => <DocumentCard key={d.id} doc={d} />)}
            </div>
          </section>
        )}
      </div>

      <PrintModal doc={doc} open={printOpen} onOpenChange={setPrintOpen} />
      <ReportModal doc={doc} open={reportOpen} onOpenChange={setReportOpen} />
    </Layout>
  );
};

export default Documento;

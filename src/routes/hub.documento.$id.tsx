import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { PdfViewer } from "@/components/hub/PdfViewer";
import { PrintModal } from "@/components/hub/PrintModal";
import { DocumentCard } from "@/components/hub/DocumentCard";
import { HUB_DOCUMENTS, DOC_CATEGORIES, type DocItem } from "@/data/hub-documents";
import { fetchHubDocumentById, fetchUserCredits, spendCredit } from "@/lib/hub";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download, Printer, Share2, Calendar, FileText, Eye, Crown,
  ChevronLeft, User, Coins, LogIn, CheckCircle2, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/hub/documento/$id")({
  loader: async ({ params }) => {
    const doc = await fetchHubDocumentById(params.id);
    return { doc: doc ?? null };
  },
  head: ({ loaderData }) => {
    const doc = loaderData?.doc;
    if (!doc) return { meta: [{ title: "Documento — Giseveral Hub" }] };
    return {
      meta: [
        { title: `${doc.title} — Giseveral Hub` },
        { name: "description", content: doc.description },
        { property: "og:title", content: doc.title },
        { property: "og:description", content: doc.description },
      ],
    };
  },
  component: HubDocumentoPage,
});

function HubDocumentoPage() {
  const { doc: maybeDoc } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [printOpen, setPrintOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [credits, setCredits] = useState<number>(3);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserCredits(user.id).then(({ hub_credits, hub_premium }) => {
      setCredits(hub_credits);
      setPremium(hub_premium);
    });
  }, [user]);

  if (!maybeDoc) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-3xl">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-brand mb-3">Documento não encontrado</h1>
          <p className="text-muted-foreground mb-6">O documento que procura pode ter sido removido ou o link está incorrecto.</p>
          <Link
            to="/hub/explorar"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            <FileText className="h-4 w-4" /> Voltar a explorar
          </Link>
        </div>
      </Layout>
    );
  }

  const doc = maybeDoc;
  const cat = DOC_CATEGORIES.find((c) => c.id === doc.category);
  const related = HUB_DOCUMENTS
    .filter((d) => d.category === doc.category && d.id !== doc.id)
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 4);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: doc.title, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copiado!"));
    } else {
      toast.info("Copie o link da barra de endereços.");
    }
  }

  async function handleDownload() {
    if (!user) {
      toast.error("Precisa de entrar para descarregar.", {
        description: "Crie uma conta gratuita e receba 3 créditos.",
        action: { label: "Entrar", onClick: () => navigate({ to: "/login" }) },
      });
      return;
    }
    if (!premium && !doc.premium && credits <= 0) {
      toast.error("Sem créditos suficientes.", {
        description: "Compre créditos ou torne-se Premium para downloads ilimitados.",
        action: { label: "Obter créditos", onClick: () => navigate({ to: "/hub/creditos" }) },
      });
      return;
    }

    setDownloading(true);

    if (!doc.premium && !premium) {
      const result = await spendCredit(user.id, doc.id, credits);
      if (!result.success) {
        toast.error(result.message);
        setDownloading(false);
        return;
      }
      setCredits(result.remaining);
    }

    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
    }

    setDownloaded(true);
    setDownloading(false);
    toast.success("Download iniciado!", {
      description: doc.premium || premium
        ? "Documento Premium — crédito não descontado."
        : `1 crédito descontado. Restam ${credits - 1} crédito${credits - 1 !== 1 ? "s" : ""}.`,
    });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <Link to="/hub" className="hover:text-brand transition-colors">Hub</Link>
          <span>/</span>
          <Link to="/hub/explorar" className="hover:text-brand transition-colors">Explorar</Link>
          <span>/</span>
          <span className="text-foreground/70 truncate max-w-[200px]">{doc.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* ── MAIN ───────────────────────────────────────────────────────── */}
          <div>
            {/* Meta */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {cat && (
                  <Link to="/hub/explorar" search={{ cat: cat.id }}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-semibold hover:bg-brand/20 transition-smooth">
                      {cat.icon} {cat.label}
                    </span>
                  </Link>
                )}
                {doc.premium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold text-gold-foreground px-2.5 py-0.5 text-xs font-bold">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-brand mb-3 leading-tight">{doc.title}</h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {doc.author}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(doc.uploadedAt).toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {doc.pages} páginas</span>
                <span className="flex items-center gap-1.5"><Download className="h-4 w-4" /> {doc.downloads.toLocaleString()} downloads</span>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {doc.views.toLocaleString()} visualizações</span>
              </div>
            </div>

            {/* PDF Preview */}
            <PdfViewer pages={doc.pages} title={doc.title} previewPages={2} url={doc.fileUrl} />

            {/* Description */}
            <div className="mt-6 rounded-xl bg-card border border-border p-6">
              <h3 className="font-bold text-base text-brand mb-3">Sobre este documento</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{doc.description}</p>
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {doc.tags.map((t) => (
                    <Link
                      key={t}
                      to="/hub/explorar"
                      search={{ q: t }}
                      className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-smooth"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Actions bar (mobile) */}
            <div className="mt-5 lg:hidden space-y-3">
              <DownloadButton
                doc={doc}
                user={user}
                credits={credits}
                premium={premium}
                downloading={downloading}
                downloaded={downloaded}
                onDownload={handleDownload}
                onPrint={() => setPrintOpen(true)}
              />
            </div>
          </div>

          {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start space-y-4">
            <DownloadButton
              doc={doc}
              user={user}
              credits={credits}
              premium={premium}
              downloading={downloading}
              downloaded={downloaded}
              onDownload={handleDownload}
              onPrint={() => setPrintOpen(true)}
            />

            {/* Credits display */}
            {user && (
              <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15">
                  <Coins className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{premium ? "Conta Premium" : "Os seus créditos"}</p>
                  <p className="font-bold text-foreground">
                    {premium ? "∞ ilimitados" : `${credits} crédito${credits !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {!premium && (
                  <Link
                    to="/hub/creditos"
                    className="text-[11px] font-semibold text-brand hover:text-gold transition-colors flex-shrink-0"
                  >
                    + Obter
                  </Link>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h4 className="font-semibold mb-3 text-sm text-foreground">Acções</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent transition-smooth"
                >
                  <Share2 className="h-4 w-4" /> Partilhar
                </button>
                <Link
                  to="/contactos"
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent transition-smooth"
                >
                  <AlertTriangle className="h-4 w-4" /> Reportar
                </Link>
              </div>
            </div>

            {/* Premium upsell */}
            {!premium && (
              <div className="rounded-xl bg-gradient-hero text-brand-foreground p-5">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <Crown className="h-4 w-4 text-gold" /> Torne-se Premium
                </div>
                <ul className="space-y-1.5 text-xs opacity-85 mb-4">
                  {["Downloads ilimitados", "Sem créditos necessários", "Acesso antecipado a novos docs"].map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/hub/creditos"
                  className="flex items-center justify-center rounded-md bg-gradient-gold px-3 py-2 text-sm font-semibold text-gold-foreground"
                >
                  Ver planos
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* Related documents */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-brand">Documentos relacionados</h2>
              <Link to="/hub/explorar" search={{ cat: doc.category }} className="text-sm text-gold hover:underline">
                Ver tudo →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((d) => <DocumentCard key={d.id} doc={d} />)}
            </div>
          </section>
        )}
      </div>

      <PrintModal doc={doc} open={printOpen} onOpenChange={setPrintOpen} />
    </Layout>
  );
}

// ── Download Button ─────────────────────────────────────────────────────────

function DownloadButton({
  doc, user, credits, premium, downloading, downloaded, onDownload, onPrint,
}: {
  doc: DocItem;
  user: unknown;
  credits: number;
  premium: boolean;
  downloading: boolean;
  downloaded: boolean;
  onDownload: () => void;
  onPrint: () => void;
}) {
  const hasAccess = premium || doc.premium || credits > 0;
  const canDownload = !!user && hasAccess;

  return (
    <div className="rounded-2xl bg-gradient-hero text-brand-foreground p-6 shadow-elegant">
      <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">Descarregar documento</div>
      <div className="flex items-baseline gap-2 mb-5">
        {doc.premium || premium ? (
          <>
            <Crown className="h-6 w-6 text-gold" />
            <span className="text-lg font-bold text-gold">{doc.premium ? "Premium" : "Ilimitado"}</span>
          </>
        ) : (
          <>
            <span className="text-5xl font-bold text-gold">1</span>
            <span className="opacity-75">crédito</span>
          </>
        )}
      </div>

      {!user ? (
        <>
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-semibold text-brand-foreground hover:bg-white/25 transition-smooth mb-2"
          >
            <LogIn className="h-4 w-4" /> Entrar para descarregar
          </Link>
          <p className="text-[11px] opacity-60 text-center">Conta gratuita · 3 créditos de boas-vindas</p>
        </>
      ) : (
        <>
          <button
            onClick={onDownload}
            disabled={downloading || !canDownload}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> A preparar…</>
            ) : downloaded ? (
              <><CheckCircle2 className="h-4 w-4" /> Descarregado!</>
            ) : (
              <><Download className="h-4 w-4" /> Descarregar PDF</>
            )}
          </button>

          {!canDownload && (
            <p className="text-[11px] text-center opacity-70 mb-2">
              Sem créditos — <Link to="/orcamento" className="underline">torne-se Premium</Link>
            </p>
          )}
        </>
      )}

      <button
        onClick={onPrint}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-brand-foreground hover:bg-white/20 transition-smooth"
      >
        <Printer className="h-4 w-4" /> Imprimir na Giseveral
      </button>
      <p className="text-[10px] opacity-55 mt-3 text-center">Premium = downloads ilimitados</p>
    </div>
  );
}

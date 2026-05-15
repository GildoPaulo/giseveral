import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import { PrintModal } from "@/components/hub/PrintModal";
import { DocumentCard } from "@/components/hub/DocumentCard";
import { HUB_DOCUMENTS, DOC_CATEGORIES, type DocItem } from "@/data/hub-documents";
import { fetchHubDocumentById, fetchUserCredits, spendCredit } from "@/lib/hub";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Download, Printer, Share2, Bookmark, ThumbsUp, Flag, Eye, FileText,
  Calendar, User, Coins, Crown, Sparkles, Loader2, ArrowRight,
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
  const [credits, setCredits] = useState<number | null>(null);
  const [premium, setPremium] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [voted, setVoted] = useState<1 | -1 | 0>(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  useEffect(() => {
    if (!user) { setCredits(null); return; }
    fetchUserCredits(user.id).then(({ hub_credits, hub_premium }) => {
      setCredits(hub_credits);
      setPremium(hub_premium);
    });
  }, [user]);

  // Load user-specific reactions for this document.
  useEffect(() => {
    if (!user || !maybeDoc) return;
    const docId = maybeDoc.id;
    const op = supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            eq: (k: string, v: unknown) => {
              maybeSingle: () => Promise<{ data: { vote?: number } | null }>;
            };
          };
        };
      };
    };
    op.from("document_votes").select("vote").eq("document_id", docId).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.vote === 1 || data?.vote === -1) setVoted(data.vote as 1 | -1); });
    op.from("document_bookmarks").select("id").eq("document_id", docId).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { setBookmarked(!!data); });
  }, [user, maybeDoc]);

  if (!maybeDoc) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-3xl">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-brand mb-3">Documento não encontrado</h1>
          <p className="text-muted-foreground mb-6">O documento que procura pode ter sido removido ou o link está incorrecto.</p>
          <Link to="/hub/documentos" className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
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

  const totalVotes = (doc as DocItem & { votes_up?: number; votes_down?: number }).votes_up || 0;
  const totalDown = (doc as DocItem & { votes_up?: number; votes_down?: number }).votes_down || 0;
  const ratio = totalVotes + totalDown > 0
    ? Math.round((totalVotes / (totalVotes + totalDown)) * 100)
    : null;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: doc.title, url: window.location.href }).catch(() => undefined);
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copiado"));
      return;
    }
    toast.info("Copie o link da barra de endereços.");
  }

  async function handleVote(value: 1 | -1) {
    if (!user) { toast.error("Inicia sessão para votar."); return; }
    setVoteBusy(true);
    try {
      if (voted === value) {
        // remove vote
        await (supabase as unknown as {
          from: (t: string) => {
            delete: () => {
              eq: (k: string, v: unknown) => {
                eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
              };
            };
          };
        }).from("document_votes").delete().eq("document_id", doc.id).eq("user_id", user.id);
        setVoted(0);
      } else {
        await (supabase as unknown as {
          from: (t: string) => {
            upsert: (payload: unknown, opts?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>;
          };
        }).from("document_votes").upsert(
          { document_id: doc.id, user_id: user.id, vote: value },
          { onConflict: "document_id,user_id" },
        );
        setVoted(value);
      }
    } catch (e) {
      toast.error("Erro ao votar");
    } finally {
      setVoteBusy(false);
    }
  }

  async function handleBookmark() {
    if (!user) { toast.error("Inicia sessão para guardar."); return; }
    setBookmarkBusy(true);
    try {
      if (bookmarked) {
        await (supabase as unknown as {
          from: (t: string) => {
            delete: () => {
              eq: (k: string, v: unknown) => {
                eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
              };
            };
          };
        }).from("document_bookmarks").delete().eq("document_id", doc.id).eq("user_id", user.id);
        setBookmarked(false);
        toast.success("Removido dos guardados");
      } else {
        await (supabase as unknown as {
          from: (t: string) => {
            insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
          };
        }).from("document_bookmarks").insert({ document_id: doc.id, user_id: user.id });
        setBookmarked(true);
        toast.success("Guardado");
      }
    } catch (e) {
      toast.error("Erro");
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function handleDownload() {
    if (!user) {
      toast.error("Precisa de entrar para descarregar.", {
        action: { label: "Entrar", onClick: () => navigate({ to: "/login" }) },
      });
      return;
    }
    if (!doc.fileUrl) { toast.error("Ficheiro não disponível."); return; }
    if (doc.premium && !premium) {
      toast.error("Documento Premium", {
        description: "Subscreve Premium para aceder a documentos exclusivos.",
        action: { label: "Ver planos", onClick: () => navigate({ to: "/hub/creditos" }) },
      });
      return;
    }

    const isFree = premium;
    const currentCredits = credits ?? 0;
    if (!isFree && currentCredits <= 0) {
      toast.error("Sem créditos.", {
        description: "Compra créditos para descarregar.",
        action: { label: "Comprar", onClick: () => navigate({ to: "/hub/creditos" }) },
      });
      return;
    }

    setDownloading(true);
    if (!isFree) {
      const r = await spendCredit(user.id, doc.id, currentCredits);
      if (!r.success) { toast.error(r.message); setDownloading(false); return; }
      setCredits(r.remaining);
    }

    // Build a fresh signed URL and trigger the download.
    const path = doc.fileUrl.includes("/hub-documents/")
      ? doc.fileUrl.split("/hub-documents/")[1].split("?")[0]
      : doc.fileUrl;
    const { data, error } = await supabase.storage.from("hub-documents").createSignedUrl(path, 60, { download: `${doc.title}.pdf` });
    if (error || !data?.signedUrl) {
      toast.error("Falha a preparar o download");
      setDownloading(false);
      return;
    }

    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.rel = "noopener";
    a.click();

    toast.success("Download iniciado", {
      description: isFree ? "Acesso Premium · sem custo" : `1 crédito descontado. Restam ${(credits ?? 1) - 1}.`,
    });
    setDownloading(false);
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <Link to="/hub" className="hover:text-brand transition-colors">Hub</Link>
          <span>/</span>
          <Link to="/hub/documentos" className="hover:text-brand transition-colors">Documentos</Link>
          <span>/</span>
          <span className="text-foreground/70 truncate max-w-[200px]">{doc.title}</span>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6 lg:gap-8">
          {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
          <aside className="space-y-5">
            {/* Title + meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {cat && (
                  <Link to="/hub/documentos" search={{ cat: cat.id }}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-semibold hover:bg-brand/20 transition-smooth">
                      {cat.label}
                    </span>
                  </Link>
                )}
                {doc.premium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold text-gold-foreground px-2.5 py-0.5 text-xs font-bold">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/8 text-foreground/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> IA
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                {doc.title}
              </h1>

              <div className="mt-3 text-sm text-muted-foreground">
                <p className={expanded ? "" : "line-clamp-3"}>{doc.description}</p>
                {doc.description.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 text-xs font-semibold text-brand hover:text-gold transition-colors"
                  >
                    {expanded ? "Mostrar menos" : "Ver completo"}
                  </button>
                )}
              </div>
            </div>

            {/* Uploader */}
            <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-brand-foreground font-bold text-sm">
                {doc.author?.[0]?.toUpperCase() ?? "G"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Enviado por</p>
                <p className="text-sm font-bold text-foreground truncate">{doc.author}</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  icon: ThumbsUp,
                  value: ratio !== null ? `${ratio}%` : "—",
                  label: "Útil",
                },
                {
                  icon: Eye,
                  value: doc.views.toLocaleString("pt-MZ"),
                  label: "Visualizações",
                },
                {
                  icon: FileText,
                  value: `${doc.pages}`,
                  label: "Páginas",
                },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                  <Icon className="h-4 w-4 mx-auto text-brand mb-1" />
                  <p className="text-sm font-extrabold text-foreground tabular-nums">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Main download button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || credits === null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1e408f] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-bold text-white shadow-card transition-smooth"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {premium ? "Descarregar PDF · Premium" : `Descarregar PDF · 1 crédito`}
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={() => setPrintOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-smooth"
            >
              <Printer className="h-4 w-4" /> Imprimir na Giseveral
            </button>

            {/* Actions grid 2x3 */}
            <div className="grid grid-cols-3 gap-2">
              <ActionTile icon={Bookmark} label={bookmarked ? "Guardado" : "Salvar"} onClick={handleBookmark} busy={bookmarkBusy} active={bookmarked} />
              <ActionTile icon={Share2}  label="Partilhar" onClick={handleShare} />
              <ActionTile icon={ThumbsUp} label={voted === 1 ? "Votado" : "Votar"} onClick={() => handleVote(1)} busy={voteBusy} active={voted === 1} />
              <ActionTile icon={Flag}    label="Reportar"  onClick={() => navigate({ to: "/contactos" })} />
              <ActionTile icon={User}    label="Perfil"    onClick={() => navigate({ to: "/conta" })} />
              <ActionTile icon={ArrowRight} label="Mais" onClick={() => navigate({ to: "/hub/documentos" })} />
            </div>

            {/* Credits widget */}
            {user && (
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold">
                  <Coins className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{premium ? "Conta" : "Os teus créditos"}</p>
                  <p className="text-sm font-extrabold text-foreground">
                    {premium ? "Premium · ilimitado" : credits === null ? "A carregar…" : `${credits} crédito${credits !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {!premium && (
                  <Link to="/hub/creditos" className="text-xs font-bold text-brand hover:text-gold transition-colors">+ Obter</Link>
                )}
              </div>
            )}
          </aside>

          {/* ── VIEWER ─────────────────────────────────────────────────────── */}
          <main className="min-w-0">
            {doc.fileUrl ? (
              <DocumentViewer
                fileUrl={doc.fileUrl}
                title={doc.title}
                knownPages={doc.pages}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-16 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Pré-visualização indisponível</p>
                <p className="mt-1 text-xs text-muted-foreground">Este documento ainda não tem ficheiro associado.</p>
              </div>
            )}
          </main>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">Documentos relacionados</h2>
              <Link to="/hub/documentos" search={{ cat: doc.category }} className="text-sm text-brand hover:text-gold transition-colors flex items-center gap-1">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((d) => <DocumentCard key={d.id} doc={d} />)}
            </div>
          </section>
        )}
      </div>

      <PrintModal doc={doc} open={printOpen} onOpenChange={setPrintOpen} />
    </Layout>
  );
}

function ActionTile({
  icon: Icon, label, onClick, busy, active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  busy?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-smooth disabled:opacity-50 ${
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-border bg-card text-foreground hover:bg-muted"
      }`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

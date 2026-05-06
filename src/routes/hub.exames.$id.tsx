import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EXAMS, getExam } from "@/data/hub-exams";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, FileText, Eye, MessageCircle, Download,
  Copy, ThumbsUp, Send, GraduationCap, CheckCircle2, ExternalLink,
  ChevronDown, ChevronUp, BookOpen, Users, Zap,
} from "lucide-react";

const SITE_URL = "https://giseveral.pages.dev";

type GuideStep = { title: string; description: string; tip?: string; link?: string };
type Material = { title: string; type: string; url: string };

type DbRow = {
  id: string; title: string; institution: string; course: string; year: number;
  subjects: string[]; difficulty: string; description: string | null;
  content_rich: string | null; guides: unknown; materials: unknown;
  tips: string[]; image_url: string | null; file_url: string | null;
  solution_url: string | null; active: boolean; featured: boolean;
  comments_enabled: boolean; allow_registrations: boolean;
  registration_url: string | null; registration_deadline: string | null;
  registration_fee: string | null; views: number; downloads: number; created_at: string;
};

type CommentRow = {
  id: string; content: string; author_name: string; is_admin: boolean;
  helpful_count: number; created_at: string;
};

function parseJson<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

const DIFFICULTY_COLOR: Record<string, string> = {
  "Fácil": "bg-emerald-500/15 text-emerald-600",
  "Médio": "bg-amber-500/15 text-amber-700",
  "Difícil": "bg-red-500/15 text-red-600",
};

const HELP_OPTIONS = [
  "Preparação para o exame",
  "Impressão de materiais de estudo",
  "Simulado cronometrado",
  "Revisão das matérias",
  "Orientação sobre inscrição",
  "Digitação de requerimentos",
  "Outro",
];

export const Route = createFileRoute("/hub/exames/$id")({
  loader: ({ params }) => {
    const staticData = getExam(params.id);
    return { staticData: staticData ?? null, id: params.id };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.staticData;
    if (!e) return { meta: [{ title: "Exame — Giseveral Hub" }] };
    const title = `${e.title} | Giseveral Hub`;
    const canonical = `${SITE_URL}/hub/exames/${e.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: e.description ?? title },
        { name: "keywords", content: `exame admissão ${e.institution}, ${e.course}, ${e.subjects.join(", ")}, Moçambique` },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: e.description ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-brand">Exame não encontrado</h1>
        <Link to="/hub/exames" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
          <ArrowLeft className="h-4 w-4" /> Ver todos os exames
        </Link>
      </section>
    </Layout>
  ),
  component: ExameDetailPage,
});

function ExameDetailPage() {
  const { staticData, id } = Route.useLoaderData();
  const { user } = useAuth();

  const [dbData, setDbData] = useState<DbRow | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSending, setHelpSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpForm, setHelpForm] = useState({
    name: "", email: "", whatsapp: "", help_needed: [] as string[], notes: "",
  });

  useEffect(() => {
    supabase.from("hub_exams").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (data) {
          setDbData(data as DbRow);
          supabase.from("hub_exams").update({ views: (data.views ?? 0) + 1 }).eq("id", id);
        } else if (!staticData) {
          setNotFoundState(true);
        }
      });

    supabase.from("unified_comments")
      .select("id, content, author_name, is_admin, helpful_count, created_at")
      .eq("content_type", "exame")
      .eq("content_id", id)
      .eq("approved", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setComments(data as CommentRow[]); });
  }, [id, staticData]);

  if (notFoundState) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-brand">Exame não encontrado</h1>
          <Link to="/hub/exames" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
            <ArrowLeft className="h-4 w-4" /> Ver todos os exames
          </Link>
        </section>
      </Layout>
    );
  }

  if (!staticData && !dbData) {
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const e = {
    id,
    title: dbData?.title ?? staticData!.title,
    institution: dbData?.institution ?? staticData!.institution,
    course: dbData?.course ?? staticData!.course,
    year: dbData?.year ?? staticData!.year,
    subjects: dbData?.subjects ?? staticData!.subjects,
    difficulty: dbData?.difficulty ?? staticData!.difficulty,
    description: dbData?.description ?? staticData!.description,
    content_rich: dbData?.content_rich ?? null,
    guides: parseJson<GuideStep>(dbData?.guides),
    materials: parseJson<Material>(dbData?.materials),
    tips: dbData?.tips ?? staticData!.tips ?? [],
    image_url: dbData?.image_url ?? null,
    file_url: dbData?.file_url ?? staticData!.fileUrl ?? null,
    solution_url: dbData?.solution_url ?? staticData!.solutionUrl ?? null,
    comments_enabled: dbData?.comments_enabled ?? true,
    allow_registrations: dbData?.allow_registrations ?? staticData!.allowRegistrations ?? false,
    registration_url: dbData?.registration_url ?? staticData!.registrationUrl ?? null,
    registration_deadline: dbData?.registration_deadline ?? staticData!.registrationDeadline ?? null,
    registration_fee: dbData?.registration_fee ?? staticData!.registrationFee ?? null,
    processSteps: staticData!.processSteps ?? [],
    views: dbData?.views ?? 0,
    downloads: dbData?.downloads ?? 0,
  };

  const pageUrl = `${SITE_URL}/hub/exames/${id}`;
  const diffColor = DIFFICULTY_COLOR[e.difficulty] ?? "bg-muted text-muted-foreground";
  const related = EXAMS.filter((x) => x.id !== id).slice(0, 3);

  async function submitComment() {
    if (!user || !commentText.trim()) return;
    setSending(true);
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const { error } = await supabase.from("unified_comments").insert({
      content_type: "exame",
      content_id: id,
      user_id: user.id,
      content: commentText.trim(),
      author_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Utilizador",
    });
    if (error) toast.error("Erro ao enviar.");
    else { toast.success("Comentário enviado! Aguarda aprovação."); setCommentText(""); }
    setSending(false);
  }

  async function submitHelp() {
    if (!user) { toast.error("Inicia sessão para pedir ajuda."); return; }
    if (!helpForm.name.trim() || !helpForm.whatsapp.trim()) {
      toast.error("Nome e WhatsApp são obrigatórios.");
      return;
    }
    setHelpSending(true);
    const { error } = await supabase.from("help_requests").insert({
      content_type: "exame",
      content_id: id,
      user_id: user.id,
      name: helpForm.name.trim(),
      email: helpForm.email.trim() || user.email || "",
      whatsapp: helpForm.whatsapp.trim(),
      help_needed: helpForm.help_needed,
      notes: helpForm.notes.trim() || null,
    });
    if (error) toast.error("Erro ao enviar pedido.");
    else {
      toast.success("Pedido enviado! Contactamos em breve.");
      setHelpForm({ name: "", email: "", whatsapp: "", help_needed: [], notes: "" });
      setHelpOpen(false);
    }
    setHelpSending(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function toggleHelp(opt: string) {
    setHelpForm((p) => ({
      ...p,
      help_needed: p.help_needed.includes(opt) ? p.help_needed.filter((o) => o !== opt) : [...p.help_needed, opt],
    }));
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero text-brand-foreground">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
          <Link to="/hub/exames" className="inline-flex items-center gap-1.5 text-sm text-brand-foreground/70 hover:text-gold transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Todos os exames
          </Link>
          <div className="mt-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${diffColor}`}>
                {e.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold">
                {e.year}
              </span>
              {e.subjects.slice(0, 3).map((s) => (
                <span key={s} className="rounded-full bg-brand-foreground/10 px-2.5 py-0.5 text-xs text-brand-foreground/80">{s}</span>
              ))}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight">{e.title}</h1>
            <p className="text-sm md:text-base text-brand-foreground/70 mt-1">{e.institution} · {e.course}</p>
          </div>

          {(e.views > 0 || e.downloads > 0) && (
            <div className="mt-3 flex gap-4 text-xs text-brand-foreground/60">
              {e.views > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {e.views} visualizações</span>}
              {e.downloads > 0 && <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {e.downloads} downloads</span>}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-3">
            {e.file_url && (
              <a href={e.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
              >
                <Download className="h-4 w-4" /> Descarregar exame
              </a>
            )}
            {e.solution_url && (
              <a href={e.solution_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-brand-foreground/10 border border-brand-foreground/20 px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/20 transition-smooth"
              >
                <CheckCircle2 className="h-4 w-4" /> Ver gabarito
              </a>
            )}
            <div className="flex gap-2 ml-auto">
              <a href={`https://wa.me/?text=${encodeURIComponent(e.title + "\n" + pageUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-smooth"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </a>
              <button onClick={copyLink}
                className="flex items-center justify-center h-9 w-9 rounded-md bg-brand-foreground/10 hover:bg-brand-foreground/20 transition-smooth"
              >
                {copied ? <ThumbsUp className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4 text-brand-foreground/70" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick info */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-brand" /> {e.institution}</span>
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-brand" /> {e.course}</span>
            <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-brand" /> {e.subjects.join(", ")}</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-brand" /> Dificuldade: {e.difficulty}</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-10">

        {/* PDF Preview */}
        {e.file_url && e.file_url.endsWith(".pdf") && (
          <section>
            <h2 className="text-xl font-bold text-brand mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" /> Pré-visualização
            </h2>
            <div className="rounded-2xl border border-border overflow-hidden shadow-card">
              <iframe
                src={`${e.file_url}#page=1`}
                className="w-full"
                style={{ height: "500px" }}
                title={`Pré-visualização: ${e.title}`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Pré-visualização das primeiras páginas · <a href={e.file_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Abrir PDF completo</a>
            </p>
          </section>
        )}

        {/* Description */}
        {(e.content_rich || e.description) && (
          <section>
            <h2 className="text-xl font-bold text-brand mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold" /> Sobre este exame
            </h2>
            <div className="space-y-3 text-foreground/80 prose prose-sm prose-headings:text-brand prose-a:text-gold">
              {e.content_rich ? (
                /<[^>]+>/.test(e.content_rich) ? (
                  <div dangerouslySetInnerHTML={{ __html: e.content_rich }} />
                ) : (
                  e.content_rich.split("\n\n").map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)
                )
              ) : (
                <p className="leading-relaxed">{e.description}</p>
              )}
            </div>
          </section>
        )}

        {/* Preparation guide */}
        {(e.guides.length > 0 || e.processSteps.length > 0) && (
          <section>
            <h2 className="text-xl font-bold text-brand mb-5 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gold" /> Guia de preparação
            </h2>
            <ol className="space-y-4">
              {e.guides.length > 0
                ? e.guides.map((step, i) => (
                    <li key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{step.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                        {step.tip && <p className="mt-2 text-xs text-gold bg-gold/10 rounded-lg px-3 py-1.5">💡 {step.tip}</p>}
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand hover:underline">
                            <ExternalLink className="h-3 w-3" /> Abrir link
                          </a>
                        )}
                      </div>
                    </li>
                  ))
                : e.processSteps.map((step, i) => (
                    <li key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-bold text-sm">{i + 1}</div>
                      <p className="text-sm text-foreground/85 self-center">{step}</p>
                    </li>
                  ))
              }
            </ol>
          </section>
        )}

        {/* Materials */}
        {e.materials.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-bold text-brand mb-4 flex items-center gap-2">
              <Download className="h-4 w-4 text-gold" /> Materiais de apoio
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {e.materials.map((m, i) => (
                <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 hover:shadow-card hover:-translate-y-0.5 transition-smooth"
                >
                  <span className="text-xl">{m.type === "pdf" ? "📄" : m.type === "video" ? "🎥" : m.type === "whatsapp" ? "💬" : "🔗"}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{m.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Tips */}
        {e.tips.length > 0 && (
          <section className="rounded-2xl bg-gradient-hero p-5 shadow-elegant">
            <h3 className="font-bold text-brand-foreground mb-3">💡 Dicas de preparação</h3>
            <ul className="space-y-2">
              {e.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-brand-foreground/85">
                  <span className="mt-1 shrink-0">→</span>{tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Registration */}
        {e.allow_registrations && (
          <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <h3 className="font-bold text-brand mb-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" /> Inscrição no exame
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 mt-3 text-sm">
              {e.registration_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Prazo de inscrição</p>
                  <p className="font-semibold text-foreground">{e.registration_deadline}</p>
                </div>
              )}
              {e.registration_fee && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Taxa</p>
                  <p className="font-semibold text-foreground">{e.registration_fee}</p>
                </div>
              )}
              {e.registration_url && (
                <a href={e.registration_url} target="_blank" rel="noopener noreferrer"
                  className="self-end inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
                >
                  <ExternalLink className="h-4 w-4" /> Inscrever-me agora
                </a>
              )}
            </div>
          </section>
        )}

        {/* Help from Giseveral */}
        <section className="rounded-2xl border-2 border-brand/20 bg-brand/5 p-5">
          <button className="flex w-full items-center justify-between text-left" onClick={() => setHelpOpen((o) => !o)}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">Serviço Giseveral</p>
              <h3 className="text-lg font-bold text-brand">Precisa de ajuda para se preparar?</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Impressão de materiais, simulados, orientação no processo de inscrição — tratamos de tudo.
              </p>
            </div>
            {helpOpen ? <ChevronUp className="h-5 w-5 text-brand ml-4 shrink-0" /> : <ChevronDown className="h-5 w-5 text-brand ml-4 shrink-0" />}
          </button>

          {helpOpen && (
            <div className="mt-5 space-y-4 border-t border-brand/15 pt-5">
              {!user ? (
                <div className="rounded-xl bg-muted p-4 text-sm text-center">
                  <Link to="/login" className="font-semibold text-brand hover:underline">Inicia sessão</Link> para submeter um pedido.
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome *</label>
                      <input value={helpForm.name} onChange={(e) => setHelpForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="O seu nome"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                      <input value={helpForm.email} onChange={(e) => setHelpForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder={user.email ?? ""}
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp *</label>
                      <input value={helpForm.whatsapp} onChange={(e) => setHelpForm((p) => ({ ...p, whatsapp: e.target.value }))}
                        placeholder="8X X XXX XXX"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Que ajuda precisa?</label>
                    <div className="flex flex-wrap gap-2">
                      {HELP_OPTIONS.map((opt) => (
                        <button key={opt} onClick={() => toggleHelp(opt)}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${helpForm.help_needed.includes(opt) ? "bg-brand text-brand-foreground border-brand" : "border-border text-muted-foreground hover:border-brand hover:text-brand"}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={helpForm.notes} onChange={(e) => setHelpForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3} placeholder="Observações adicionais..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <div className="flex gap-3">
                    <button onClick={submitHelp} disabled={helpSending}
                      className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50"
                    >
                      {helpSending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> : <Send className="h-4 w-4" />}
                      Enviar pedido
                    </button>
                    <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-card hover:shadow-glow transition-smooth"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Comments */}
        {e.comments_enabled && (
          <section>
            <h2 className="text-xl font-bold text-brand mb-5 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gold" /> Perguntas e Respostas
              {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}
            </h2>

            {user ? (
              <div className="mb-6 rounded-xl border border-border bg-card p-4">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3}
                  placeholder="Faça uma pergunta sobre este exame..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <div className="mt-3 flex justify-end">
                  <button onClick={submitComment} disabled={sending || !commentText.trim()}
                    className="flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                  >
                    {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> : <Send className="h-4 w-4" />}
                    Enviar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-center text-muted-foreground">
                <Link to="/login" className="font-semibold text-brand hover:underline">Inicia sessão</Link> para fazer perguntas.
              </div>
            )}

            {comments.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Sem perguntas ainda. Sê o primeiro!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className={`rounded-xl border p-4 ${c.is_admin ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-brand flex items-center justify-center text-brand-foreground font-bold text-xs">
                          {c.author_name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-semibold">{c.author_name}</span>
                        {c.is_admin && <span className="text-[10px] font-bold rounded-full bg-gold/20 text-gold px-2 py-0.5">Equipa</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-PT")}</span>
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{c.content}</p>
                    {c.helpful_count > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" /> {c.helpful_count} útil
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Related exams */}
        <section>
          <h2 className="text-xl font-bold text-brand mb-5">Outros exames</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((x) => (
              <Link key={x.id} to="/hub/exames/$id" params={{ id: x.id }}
                className="group rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth"
              >
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold mb-2 ${DIFFICULTY_COLOR[x.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                  {x.difficulty}
                </span>
                <p className="text-xs text-muted-foreground">{x.institution}</p>
                <p className="font-semibold text-sm text-brand line-clamp-2 group-hover:text-gold transition-smooth mt-0.5">{x.title}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <WhatsAppFab />
    </Layout>
  );
}

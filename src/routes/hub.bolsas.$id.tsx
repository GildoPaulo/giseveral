import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SCHOLARSHIPS, getScholarship } from "@/data/hub-bolsas";
import { toast } from "sonner";
import documentsDefaultImg from "@/assets/documents.jpg";
import {
  ArrowLeft, Calendar, Globe, CheckCircle2, BookOpen, FileText,
  MessageCircle, Phone, Share2, Copy, MapPin, Wallet, Languages,
  Clock, ChevronDown, ChevronUp, Send, ThumbsUp, ExternalLink,
  GraduationCap, Video, Link2, FileDown, Users, Eye, Linkedin,
} from "lucide-react";

const SITE_URL = "https://giseveral.pages.dev";

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, object, embed, form, meta, base").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on") || (attr.name === "href" && /^(javascript|vbscript):/i.test(attr.value))) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

type GuideStep = { title: string; description: string; tip?: string; link?: string };
type Material = { title: string; type: "pdf" | "link" | "video" | "whatsapp"; url: string };
type CommentRow = {
  id: string; scholarship_id: string; user_id: string; parent_id: string | null;
  content: string; author_name: string; is_admin: boolean; helpful_count: number;
  approved: boolean; created_at: string;
};

type DbRow = {
  id: string; title: string; country: string; flag: string; level: string;
  area: string; coverage: string; language: string; deadline: string;
  institution: string; description: string | null; apply_url: string;
  benefits: string[]; requirements: string[]; process_steps: string[];
  documents: string[]; tips: string[]; featured: boolean; active: boolean;
  content_rich: string | null; guides: unknown; materials: unknown;
  image_url: string | null; comments_enabled: boolean; allow_applications: boolean;
  views: number; applications_count: number; created_at: string;
};

function parseJsonArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  return [];
}

export const Route = createFileRoute("/hub/bolsas/$id")({
  loader: ({ params }) => {
    const staticData = getScholarship(params.id);
    return { staticData: staticData ?? null, id: params.id };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.staticData;
    if (!s) return { meta: [{ title: "Bolsa — Giseveral Hub" }] };
    const title = `${s.title} | Giseveral Hub — Beira`;
    const desc = s.description ?? `Bolsa ${s.title} para estudantes moçambicanos. Candidatura, requisitos e guia passo a passo.`;
    const canonical = `${SITE_URL}/hub/bolsas/${s.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: `${s.title}, bolsa, ${s.country}, Moçambique, ${s.level}, candidatura` },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:locale", content: "pt_MZ" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-brand">Bolsa não encontrada</h1>
        <p className="mt-3 text-muted-foreground">Esta bolsa não existe ou foi removida.</p>
        <Link to="/hub/bolsas" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">
          <ArrowLeft className="h-4 w-4" /> Ver todas as bolsas
        </Link>
      </section>
    </Layout>
  ),
  component: BolsaDetailPage,
});

// ─── Shared helpers ──────────────────────────────────────────────────────────

type TocEntry = { id: string; text: string; level: 2 | 3 };

function CountdownBadge({ deadline }: { deadline: string }) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
      <Clock className="h-3.5 w-3.5" /> Prazo encerrado
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
      <Clock className="h-3.5 w-3.5" /> Último dia!
    </span>
  );
  const color = days <= 30 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      <Clock className="h-3.5 w-3.5" /> {days} dias restantes
    </span>
  );
}

const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileDown className="h-4 w-4 text-red-500" />,
  video: <Video className="h-4 w-4 text-purple-500" />,
  whatsapp: <MessageCircle className="h-4 w-4 text-green-500" />,
  link: <Link2 className="h-4 w-4 text-blue-500" />,
};

const HELP_OPTIONS = [
  "Revisão da carta de motivação",
  "Revisão do currículo",
  "Tradução de documentos",
  "Preparação para entrevista",
  "Orientação no processo de candidatura",
  "Digitação e impressão de documentos",
  "Autenticação de documentos",
  "Outro",
];

function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-brand to-gold transition-[width] duration-75 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TocPanel({ entries, activeId }: { entries: TocEntry[]; activeId: string }) {
  if (!entries.length) return null;
  return (
    <nav>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Nesta página</p>
      <ul className="space-y-0.5">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => { ev.preventDefault(); document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth" }); }}
              className={`block text-sm py-1 pl-2 leading-snug border-l-2 transition-colors ${
                activeId === e.id
                  ? "border-brand text-brand font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
              } ${e.level === 3 ? "ml-3" : ""}`}
            >
              {e.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SharePanel({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Partilhar</p>
      <div className="flex gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/25 text-[#25D366] transition-smooth">
          <MessageCircle className="h-4 w-4" />
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" title="Facebook"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/25 text-[#1877F2] transition-smooth">
          <Share2 className="h-4 w-4" />
        </a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" title="LinkedIn"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/25 text-[#0A66C2] transition-smooth">
          <Linkedin className="h-4 w-4" />
        </a>
        <button onClick={copy} title="Copiar link"
          className="flex flex-1 items-center justify-center h-9 rounded-lg bg-muted hover:bg-muted/70 transition-smooth">
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function BolsaDetailPage() {
  const { staticData, id } = Route.useLoaderData();
  const { user } = useAuth();

  const [dbData, setDbData] = useState<DbRow | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSending, setHelpSending] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [helpForm, setHelpForm] = useState({
    name: "", email: "", whatsapp: "", course: "", university: "",
    help_needed: [] as string[], notes: "",
  });

  useEffect(() => {
    setDbData(null);
    setNotFoundState(false);
    setComments([]);

    supabase.from("hub_scholarships").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (data) {
          setDbData(data as DbRow);
          (supabase as any).rpc("increment_scholarship_views", { scholarship_id: id });
        } else if (!staticData) {
          setNotFoundState(true);
        }
      });

    supabase.from("bolsa_comments")
      .select("*")
      .eq("scholarship_id", id)
      .eq("approved", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setComments(data as CommentRow[]); });
  }, [id]);

  // Build TOC from available data (before early returns so hooks are unconditional)
  const tocEntries = useMemo<TocEntry[]>(() => {
    const desc = dbData?.description ?? staticData?.description;
    const rich = dbData?.content_rich;
    const benefits = dbData?.benefits ?? staticData?.benefits ?? [];
    const requirements = dbData?.requirements ?? staticData?.requirements ?? [];
    const guides = parseJsonArray(dbData?.guides);
    const steps = dbData?.process_steps ?? staticData?.process ?? [];
    const docs = dbData?.documents ?? staticData?.documents ?? [];
    const materials = parseJsonArray(dbData?.materials);
    const tips = dbData?.tips ?? staticData?.tips ?? [];
    const allowApps = dbData?.allow_applications ?? true;
    const commentsEnabled = dbData?.comments_enabled ?? true;

    const entries: TocEntry[] = [];
    if (desc || rich) entries.push({ id: "s-descricao", text: "Sobre a bolsa", level: 2 });
    if (benefits.length > 0) entries.push({ id: "s-beneficios", text: "O que inclui", level: 2 });
    if (requirements.length > 0) entries.push({ id: "s-requisitos", text: "Requisitos", level: 2 });
    if (guides.length > 0 || steps.length > 0) entries.push({ id: "s-guia", text: "Guia de candidatura", level: 2 });
    if (docs.length > 0) entries.push({ id: "s-documentos", text: "Documentos", level: 2 });
    if (materials.length > 0) entries.push({ id: "s-materiais", text: "Materiais", level: 2 });
    if (tips.length > 0) entries.push({ id: "s-dicas", text: "Dicas", level: 2 });
    if (allowApps) entries.push({ id: "s-ajuda", text: "Pedir ajuda", level: 2 });
    if (commentsEnabled) entries.push({ id: "s-qa", text: "Q&A", level: 2 });
    entries.push({ id: "s-outras", text: "Outras bolsas", level: 2 });
    return entries;
  }, [dbData, staticData]);

  useEffect(() => {
    if (!tocEntries.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActiveId(hit.target.id);
      },
      { rootMargin: "-10% 0px -75% 0px" }
    );
    tocEntries.forEach(({ id: sid }) => { const el = document.getElementById(sid); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [tocEntries]);

  if (notFoundState) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-brand">Bolsa não encontrada</h1>
          <p className="mt-3 text-muted-foreground">Esta bolsa não existe ou foi removida.</p>
          <Link to="/hub/bolsas" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
            <ArrowLeft className="h-4 w-4" /> Ver todas as bolsas
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

  const s = {
    id,
    title: dbData?.title ?? staticData?.title ?? "",
    country: dbData?.country ?? staticData?.country ?? "",
    flag: dbData?.flag ?? staticData?.flag ?? "🌍",
    level: dbData?.level ?? staticData?.level ?? "",
    area: dbData?.area ?? staticData?.area ?? "",
    coverage: dbData?.coverage ?? staticData?.coverage ?? "",
    language: dbData?.language ?? staticData?.language ?? "",
    deadline: dbData?.deadline ?? staticData?.deadline ?? "",
    institution: dbData?.institution ?? staticData?.institution ?? "",
    description: dbData?.description ?? staticData?.description ?? "",
    apply_url: dbData?.apply_url ?? staticData?.applyUrl ?? "#",
    benefits: dbData?.benefits ?? staticData?.benefits ?? [],
    requirements: dbData?.requirements ?? staticData?.requirements ?? [],
    process_steps: dbData?.process_steps ?? staticData?.process ?? [],
    documents: dbData?.documents ?? staticData?.documents ?? [],
    tips: dbData?.tips ?? staticData?.tips ?? [],
    content_rich: dbData?.content_rich ?? null,
    guides: parseJsonArray<GuideStep>(dbData?.guides),
    materials: parseJsonArray<Material>(dbData?.materials),
    image_url: dbData?.image_url ?? null,
    comments_enabled: dbData?.comments_enabled ?? true,
    allow_applications: dbData?.allow_applications ?? true,
    views: dbData?.views ?? 0,
    applications_count: dbData?.applications_count ?? 0,
    edital_url: (dbData as any)?.edital_url ?? null,
  };

  const expired = new Date(s.deadline).getTime() < Date.now();
  const pageUrl = `${SITE_URL}/hub/bolsas/${id}`;
  const shareText = `${s.flag} ${s.title} — Candidatura aberta para estudantes moçambicanos!`;

  async function submitComment() {
    if (!user || !commentText.trim()) return;
    setCommentSending(true);
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const { error } = await supabase.from("bolsa_comments").insert({
      scholarship_id: id,
      user_id: user.id,
      content: commentText.trim(),
      author_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Utilizador",
    });
    if (error) { toast.error("Erro ao enviar comentário."); }
    else { toast.success("Comentário enviado! Aguarda aprovação."); setCommentText(""); }
    setCommentSending(false);
  }

  async function submitHelp() {
    if (!user) { toast.error("Inicia sessão para pedir ajuda."); return; }
    if (!helpForm.name.trim() || !helpForm.whatsapp.trim()) {
      toast.error("Nome e WhatsApp são obrigatórios.");
      return;
    }
    setHelpSending(true);
    const { error } = await supabase.from("bolsa_applications").insert({
      scholarship_id: id,
      user_id: user.id,
      name: helpForm.name.trim(),
      email: helpForm.email.trim() || user.email || "",
      whatsapp: helpForm.whatsapp.trim(),
      course: helpForm.course.trim() || null,
      university: helpForm.university.trim() || null,
      help_needed: helpForm.help_needed,
      notes: helpForm.notes.trim() || null,
    });
    if (error) { toast.error("Erro ao enviar pedido."); }
    else {
      toast.success("Pedido enviado! A nossa equipa contacta-te em breve.");
      setHelpForm({ name: "", email: "", whatsapp: "", course: "", university: "", help_needed: [], notes: "" });
      setHelpOpen(false);
    }
    setHelpSending(false);
  }

  function toggleHelpOption(opt: string) {
    setHelpForm((prev) => ({
      ...prev,
      help_needed: prev.help_needed.includes(opt)
        ? prev.help_needed.filter((o) => o !== opt)
        : [...prev.help_needed, opt],
    }));
  }

  return (
    <Layout>
      <ReadingProgress />

      {/* ── Hero — full-width background image, dark overlay ──────────────── */}
      <section className="relative overflow-hidden min-h-[52vh] flex items-end bg-brand">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${s.image_url ?? documentsDefaultImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/55 to-black/15" />
        <div className="relative container mx-auto px-4 pb-12 pt-28 max-w-5xl">
          <Link to="/hub/bolsas" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-gold transition-smooth mb-5">
            <ArrowLeft className="h-4 w-4" /> Todas as bolsas
          </Link>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <span className="text-5xl">{s.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-gold/25 px-2.5 py-0.5 text-xs font-bold text-gold">
                  {s.level}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80">
                  {s.coverage}
                </span>
                <CountdownBadge deadline={s.deadline} />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight text-white drop-shadow-lg">{s.title}</h1>
              <p className="text-sm md:text-base text-white/70 mt-1">{s.institution}</p>
            </div>
          </div>

          {(s.views > 0 || s.applications_count > 0) && (
            <div className="flex gap-4 text-xs text-white/50 mb-5">
              {s.views > 0 && (
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {s.views} visualizações</span>
              )}
              {s.applications_count > 0 && (
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.applications_count} pedidos de ajuda</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!expired && (
              <a href={s.apply_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth">
                <ExternalLink className="h-4 w-4" /> Candidatar agora
              </a>
            )}
            {s.allow_applications && !expired && (
              <button onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-smooth">
                <GraduationCap className="h-4 w-4" /> Pedir ajuda à Giseveral
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + pageUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-smooth"
                title="Partilhar no WhatsApp">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-[#1877F2]/20 hover:bg-[#1877F2]/30 transition-smooth"
                title="Partilhar no Facebook">
                <Share2 className="h-4 w-4 text-[#1877F2]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick info strip ─────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {s.country}</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-brand" /> {s.area}</span>
            <span className="flex items-center gap-1.5"><Languages className="h-4 w-4 text-brand" /> {s.language}</span>
            <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-brand" /> {s.coverage}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand" />
              Prazo: {new Date(s.deadline).toLocaleDateString("pt-PT")}
            </span>
          </div>
        </div>
      </section>

      {/* ── Main — 2-column: content + sticky TOC ────────────────────────── */}
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_220px]">

          {/* Main content */}
          <div className="space-y-10">

            {/* Description */}
            {(s.content_rich || s.description) && (
              <section id="s-descricao">
                <h2 className="text-xl font-bold text-brand mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gold" /> Sobre esta bolsa
                </h2>
                <div className="prose prose-sm max-w-none text-foreground/80 space-y-3">
                  {s.content_rich ? (
                    /<[^>]+>/.test(s.content_rich) ? (
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.content_rich) }} />
                    ) : (
                      s.content_rich.split("\n\n").map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)
                    )
                  ) : (
                    <p className="leading-relaxed">{s.description}</p>
                  )}
                </div>
                {s.edital_url && (
                  <div className="mt-5 flex items-center gap-4 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
                    <FileDown className="h-6 w-6 text-gold flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">Edital oficial disponível</p>
                      <p className="text-xs text-muted-foreground">Podes baixar o edital completo em PDF</p>
                    </div>
                    <a href={s.edital_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-xs font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth flex-shrink-0">
                      <FileDown className="h-3.5 w-3.5" /> Baixar PDF
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* Benefits + Requirements */}
            <div className="grid md:grid-cols-2 gap-6">
              {s.benefits.length > 0 && (
                <section id="s-beneficios" className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="font-bold text-brand mb-3 flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> O que inclui
                  </h3>
                  <ul className="space-y-2">
                    {s.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {s.requirements.length > 0 && (
                <section id="s-requisitos" className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="font-bold text-brand mb-3 flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-gold" /> Requisitos
                  </h3>
                  <ul className="space-y-2">
                    {s.requirements.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Application Guide */}
            {(s.guides.length > 0 || s.process_steps.length > 0) && (
              <section id="s-guia">
                <h2 className="text-xl font-bold text-brand mb-5 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-gold" /> Guia de candidatura
                </h2>
                <ol className="space-y-4">
                  {s.guides.length > 0
                    ? s.guides.map((step, i) => (
                        <li key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-bold text-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm">{step.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                            {step.tip && (
                              <p className="mt-2 text-xs text-gold bg-gold/10 rounded-lg px-3 py-1.5">💡 {step.tip}</p>
                            )}
                            {step.link && (
                              <a href={step.link} target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline">
                                <ExternalLink className="h-3 w-3" /> Abrir link
                              </a>
                            )}
                          </div>
                        </li>
                      ))
                    : s.process_steps.map((step, i) => (
                        <li key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-bold text-sm">
                            {i + 1}
                          </div>
                          <p className="text-sm text-foreground/85 self-center">{step}</p>
                        </li>
                      ))
                  }
                </ol>
              </section>
            )}

            {/* Documents */}
            {s.documents.length > 0 && (
              <section id="s-documentos" className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h3 className="font-bold text-brand mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold" /> Documentos necessários
                </h3>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {s.documents.map((doc) => (
                    <li key={doc} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />{doc}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Materials */}
            {s.materials.length > 0 && (
              <section id="s-materiais">
                <h2 className="text-xl font-bold text-brand mb-4 flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-gold" /> Materiais e recursos
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {s.materials.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-smooth">
                      {MATERIAL_ICONS[m.type] ?? <Link2 className="h-4 w-4 text-brand" />}
                      <span className="text-sm font-medium text-foreground">{m.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Tips */}
            {s.tips.length > 0 && (
              <section id="s-dicas" className="rounded-2xl bg-gradient-hero p-5 shadow-elegant">
                <h3 className="font-bold text-brand-foreground mb-3 flex items-center gap-2">
                  💡 Dicas dos nossos especialistas
                </h3>
                <ul className="space-y-2">
                  {s.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-brand-foreground/85">
                      <span className="mt-1 shrink-0">→</span>{tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Help from Giseveral */}
            {s.allow_applications && (
              <section id="s-ajuda" className="rounded-2xl border-2 border-gold/30 bg-gold/5 p-6">
                <button
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setHelpOpen((o) => !o)}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">Serviço Giseveral</p>
                    <h3 className="text-lg font-bold text-brand">Precisa de ajuda para se candidatar?</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      A nossa equipa acompanha todo o processo — revisão de documentos, carta de motivação, impressão e muito mais.
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    {helpOpen ? <ChevronUp className="h-5 w-5 text-gold" /> : <ChevronDown className="h-5 w-5 text-gold" />}
                  </div>
                </button>

                {helpOpen && (
                  <div className="mt-5 space-y-4 border-t border-gold/20 pt-5">
                    {!user && (
                      <div className="rounded-xl bg-muted p-4 text-sm text-center">
                        <Link to="/login" className="font-semibold text-brand hover:underline">Inicia sessão</Link> para submeter um pedido de ajuda.
                      </div>
                    )}
                    {user && (
                      <>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome *</label>
                            <input value={helpForm.name} onChange={(e) => setHelpForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="O seu nome completo"
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
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Curso pretendido</label>
                            <input value={helpForm.course} onChange={(e) => setHelpForm((p) => ({ ...p, course: e.target.value }))}
                              placeholder="Ex: Engenharia Informática"
                              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Universidade de origem</label>
                            <input value={helpForm.university} onChange={(e) => setHelpForm((p) => ({ ...p, university: e.target.value }))}
                              placeholder="Ex: Universidade Pedagógica"
                              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                            De que precisa? (seleccione todos)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {HELP_OPTIONS.map((opt) => (
                              <button key={opt}
                                onClick={() => toggleHelpOption(opt)}
                                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${helpForm.help_needed.includes(opt) ? "bg-brand text-brand-foreground border-brand" : "border-border text-muted-foreground hover:border-brand hover:text-brand"}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações adicionais</label>
                          <textarea value={helpForm.notes} onChange={(e) => setHelpForm((p) => ({ ...p, notes: e.target.value }))}
                            rows={3} placeholder="Descreva a sua situação, dúvidas ou pedidos específicos..."
                            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={submitHelp} disabled={helpSending}
                            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50">
                            {helpSending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> : <Send className="h-4 w-4" />}
                            Enviar pedido
                          </button>
                          <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-card hover:shadow-glow transition-smooth">
                            <MessageCircle className="h-4 w-4" /> WhatsApp directo
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> Beira, Esturro · Rua Alfredo Lawley · Seg–Sáb 8h–18h
                        </p>
                      </>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Comments / Q&A */}
            {s.comments_enabled && (
              <section id="s-qa">
                <h2 className="text-xl font-bold text-brand mb-5 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gold" /> Perguntas & Respostas
                  {comments.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
                  )}
                </h2>

                {user ? (
                  <div className="mb-6 rounded-xl border border-border bg-card p-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      placeholder="Faça uma pergunta ou partilhe a sua experiência..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <div className="mt-3 flex justify-end">
                      <button onClick={submitComment} disabled={commentSending || !commentText.trim()}
                        className="flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-card disabled:opacity-50">
                        {commentSending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> : <Send className="h-4 w-4" />}
                        Enviar pergunta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-center text-muted-foreground">
                    <Link to="/login" className="font-semibold text-brand hover:underline">Inicia sessão</Link> para fazer perguntas ou partilhar a tua experiência.
                  </div>
                )}

                {comments.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Ainda não há perguntas. Sê o primeiro!</p>
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
                            <span className="text-sm font-semibold text-foreground">{c.author_name}</span>
                            {c.is_admin && (
                              <span className="text-[10px] font-bold rounded-full bg-gold/20 text-gold px-2 py-0.5">Equipa Giseveral</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("pt-PT")}
                          </span>
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

            {/* Related scholarships */}
            <section id="s-outras">
              <h2 className="text-xl font-bold text-brand mb-5">Outras bolsas</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {SCHOLARSHIPS.filter((x) => x.id !== id).slice(0, 3).map((x) => (
                  <Link key={x.id} to="/hub/bolsas/$id" params={{ id: x.id }}
                    className="group rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{x.flag}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">{x.institution}</p>
                        <p className="font-semibold text-sm text-brand leading-snug group-hover:text-gold transition-smooth line-clamp-2">{x.title}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <CountdownBadge deadline={x.deadline} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

          </div>{/* end main content */}

          {/* Right sidebar — sticky TOC, desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <TocPanel entries={tocEntries} activeId={activeId} />
              <SharePanel url={pageUrl} title={`${s.flag} ${s.title}`} />
            </div>
          </aside>

        </div>
      </div>

      <WhatsAppFab />
    </Layout>
  );
}

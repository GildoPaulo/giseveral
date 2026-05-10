import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  User, GraduationCap, Briefcase, Star, Eye,
  Plus, Trash2, ChevronLeft, ChevronRight, Download,
  MessageCircle, CheckCircle2, FileText, Loader2,
} from "lucide-react";
import {
  TemplateSelector,
  ModernCVPreview, CreativeCVPreview, ATSCVPreview,
  exportCvToPdf, downloadBlob,
} from "@/components/cv-builder";
import type { CvData, CvTemplate, SkillLevel } from "@/components/cv-builder";

export const Route = createFileRoute("/hub/cv")({
  head: () => ({
    meta: [
      { title: "CV Builder — Giseveral Hub" },
      { name: "description", content: "Crie um CV profissional em minutos e exporte para PDF grátis." },
    ],
  }),
  component: HubCvPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4 | 5;

// ── Helpers ────────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyEdu    = () => ({ id: uid(), grau: "", instituicao: "", curso: "", anoInicio: "", anoFim: "", nota: "" });
const emptyExp    = () => ({ id: uid(), empresa: "", cargo: "", inicio: "", fim: "", atual: false, descricao: "" });
const emptySkill  = () => ({ id: uid(), nome: "", nivel: "Intermédio" as SkillLevel });
const emptyIdioma = () => ({ id: uid(), idioma: "", nivel: "" });

const SKILL_LEVELS: SkillLevel[] = ["Básico", "Intermédio", "Avançado", "Expert"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slide: any = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] } },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48, transition: { duration: 0.22 } }),
};

const STEPS: { id: StepId; label: string; icon: React.ElementType }[] = [
  { id: 1, label: "Dados Pessoais",  icon: User },
  { id: 2, label: "Educação",        icon: GraduationCap },
  { id: 3, label: "Experiência",     icon: Briefcase },
  { id: 4, label: "Skills & Idiomas",icon: Star },
  { id: 5, label: "Pré-visualização",icon: Eye },
];

// ── UI atoms ───────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: StepId }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-10 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth ${active ? "bg-gradient-brand text-brand-foreground shadow-card" : done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

const inp = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth ${err ? "border-destructive" : "border-border"}`;

// ── Main component ─────────────────────────────────────────────────────────────

function HubCvPage() {
  const [step, setStep] = useState<StepId>(1);
  const [dir,  setDir]  = useState(1);
  const [template, setTemplate] = useState<CvTemplate>("modern");
  const [exporting, setExporting] = useState(false);

  // Form state — matches CvData exactly
  const [personal, setPersonal] = useState({
    nome: "", titulo: "", email: "", telefone: "", localizacao: "", linkedin: "", objetivo: "",
  });
  const [educacao,   setEducacao]   = useState([emptyEdu()]);
  const [experiencia,setExperiencia]= useState([emptyExp()]);
  const [skills,     setSkills]     = useState([emptySkill()]);
  const [idiomas,    setIdiomas]    = useState([emptyIdioma()]);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof personal, string>>>({});

  // Build the shared CvData object
  const cvData: CvData = { personal, educacao, experiencia, skills, idiomas };

  function goTo(next: StepId) {
    if (next === 2 && step === 1) {
      const errs: Partial<Record<keyof typeof personal, string>> = {};
      if (!personal.nome.trim())  errs.nome  = "Campo obrigatório";
      if (!personal.email.trim()) errs.email = "Campo obrigatório";
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
    }
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function upPersonal<K extends keyof typeof personal>(k: K, v: string) {
    setPersonal((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const blob = await exportCvToPdf(cvData, template);
      downloadBlob(blob, `cv-${(personal.nome || "curriculum").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      toast.success("PDF gerado!", { description: "O ficheiro foi descarregado." });
    } catch (e) {
      toast.error("Erro ao gerar PDF.", { description: e instanceof Error ? e.message : "Tente novamente." });
    } finally {
      setExporting(false);
    }
  }

  function handleDownloadRtf() {
    const lines = [
      personal.nome, personal.titulo, "",
      personal.email, personal.telefone, personal.localizacao, personal.linkedin, "",
      personal.objetivo, "",
      "EXPERIÊNCIA", ...experiencia.filter((e) => e.empresa).flatMap((e) => [
        `${e.cargo} — ${e.empresa}`,
        e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`,
        e.descricao, "",
      ]),
      "EDUCAÇÃO", ...educacao.filter((e) => e.instituicao).flatMap((e) => [
        `${e.grau}${e.curso ? ` em ${e.curso}` : ""} — ${e.instituicao}`,
        `${e.anoInicio}${e.anoFim ? ` – ${e.anoFim}` : ""}${e.nota ? `  |  Nota: ${e.nota}` : ""}`, "",
      ]),
      "COMPETÊNCIAS", skills.filter((s) => s.nome).map((s) => `${s.nome} (${s.nivel})`).join("  ·  "), "",
      "IDIOMAS", idiomas.filter((i) => i.idioma).map((i) => `${i.idioma}: ${i.nivel}`).join("  ·  "),
    ].filter((l) => l !== undefined);

    const rtfLines = lines.map((l) =>
      `${l.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`)}\\par`
    ).join("\n");

    const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\n{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}\n\\f0\\fs24\\sl360\\slmult1\n${rtfLines}\n}`;
    const blob = new Blob([rtf], { type: "application/rtf" });
    downloadBlob(blob, `cv-${(personal.nome || "curriculum").toLowerCase().replace(/\s+/g, "-")}.rtf`);
    toast.success("RTF descarregado!", { description: "Abre com Word, LibreOffice ou Google Docs." });
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`Olá! O meu CV foi criado no Giseveral Hub.\n\nNome: ${personal.nome}\nTítulo: ${personal.titulo}\nEmail: ${personal.email}\nTelefone: ${personal.telefone}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const navBtns = (prev?: StepId, next?: StepId) => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
      {prev ? (
        <button onClick={() => goTo(prev)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
      ) : <span />}
      {next && (
        <button onClick={() => goTo(next)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth">
          Continuar <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  // Template → preview component map
  const PreviewMap: Record<CvTemplate, React.ElementType> = {
    modern:   ModernCVPreview,
    creative: CreativeCVPreview,
    ats:      ATSCVPreview,
  };
  const ActivePreview = PreviewMap[template];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand mb-4">
            <FileText className="h-4 w-4 text-gold" /> CV Builder
          </div>
          <h1 className="text-4xl font-bold text-brand mb-3">Crie o seu CV profissional</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Preencha os dados, escolha o template e exporte como PDF real — sem diálogos de impressão.
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit">

            {/* ── Step 1: Personal ── */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground"><User className="h-5 w-5" /></div>
                  <div><h2 className="font-bold text-lg text-foreground">Dados Pessoais</h2><p className="text-sm text-muted-foreground">Informação básica de contacto</p></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Nome completo" required error={errors.nome}>
                    <input type="text" placeholder="ex: João Manuel Silva" value={personal.nome} onChange={(e) => upPersonal("nome", e.target.value)} className={inp(errors.nome)} />
                  </Field>
                  <Field label="Título profissional">
                    <input type="text" placeholder="ex: Engenheiro Informático" value={personal.titulo} onChange={(e) => upPersonal("titulo", e.target.value)} className={inp()} />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input type="email" placeholder="ex: joao@email.com" value={personal.email} onChange={(e) => upPersonal("email", e.target.value)} className={inp(errors.email)} />
                  </Field>
                  <Field label="Telefone">
                    <input type="tel" placeholder="ex: +258 84 000 0000" value={personal.telefone} onChange={(e) => upPersonal("telefone", e.target.value)} className={inp()} />
                  </Field>
                  <Field label="Localização">
                    <input type="text" placeholder="ex: Beira, Moçambique" value={personal.localizacao} onChange={(e) => upPersonal("localizacao", e.target.value)} className={inp()} />
                  </Field>
                  <Field label="LinkedIn">
                    <input type="text" placeholder="ex: linkedin.com/in/joaosilva" value={personal.linkedin} onChange={(e) => upPersonal("linkedin", e.target.value)} className={inp()} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Objetivo / Perfil profissional">
                      <textarea rows={3} placeholder="Descreva brevemente o seu perfil e objetivos..." value={personal.objetivo} onChange={(e) => upPersonal("objetivo", e.target.value)} className={`${inp()} resize-y`} />
                    </Field>
                  </div>
                </div>
                {navBtns(undefined, 2)}
              </div>
            )}

            {/* ── Step 2: Education ── */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground"><GraduationCap className="h-5 w-5" /></div>
                    <div><h2 className="font-bold text-lg text-foreground">Educação</h2><p className="text-sm text-muted-foreground">Formação académica</p></div>
                  </div>
                  <button onClick={() => setEducacao((l) => [...l, emptyEdu()])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-smooth"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
                </div>
                <div className="space-y-6">
                  {educacao.map((edu, idx) => (
                    <div key={edu.id} className="rounded-xl border border-border p-5 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Formação {idx + 1}</span>
                        {educacao.length > 1 && <button onClick={() => setEducacao((l) => l.filter((e) => e.id !== edu.id))} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Grau académico"><input type="text" placeholder="ex: Licenciatura" value={edu.grau} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, grau: e.target.value } : x))} className={inp()} /></Field>
                        <Field label="Instituição"><input type="text" placeholder="ex: UEM, UCM" value={edu.instituicao} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, instituicao: e.target.value } : x))} className={inp()} /></Field>
                        <div className="sm:col-span-2"><Field label="Curso"><input type="text" placeholder="ex: Engenharia Informática" value={edu.curso} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, curso: e.target.value } : x))} className={inp()} /></Field></div>
                        <Field label="Ano início"><input type="text" placeholder="ex: 2018" value={edu.anoInicio} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, anoInicio: e.target.value } : x))} className={inp()} /></Field>
                        <Field label="Ano conclusão"><input type="text" placeholder="ex: 2022" value={edu.anoFim} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, anoFim: e.target.value } : x))} className={inp()} /></Field>
                        <div className="sm:col-span-2"><Field label="Nota (opcional)"><input type="text" placeholder="ex: 16 valores" value={edu.nota} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, nota: e.target.value } : x))} className={inp()} /></Field></div>
                      </div>
                    </div>
                  ))}
                </div>
                {navBtns(1, 3)}
              </div>
            )}

            {/* ── Step 3: Experience ── */}
            {step === 3 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground"><Briefcase className="h-5 w-5" /></div>
                    <div><h2 className="font-bold text-lg text-foreground">Experiência Profissional</h2><p className="text-sm text-muted-foreground">Histórico de trabalho</p></div>
                  </div>
                  <button onClick={() => setExperiencia((l) => [...l, emptyExp()])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-smooth"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
                </div>
                <div className="space-y-6">
                  {experiencia.map((exp, idx) => (
                    <div key={exp.id} className="rounded-xl border border-border p-5 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Experiência {idx + 1}</span>
                        {experiencia.length > 1 && <button onClick={() => setExperiencia((l) => l.filter((e) => e.id !== exp.id))} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Empresa"><input type="text" placeholder="ex: Vodacom Moçambique" value={exp.empresa} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, empresa: e.target.value } : x))} className={inp()} /></Field>
                        <Field label="Cargo"><input type="text" placeholder="ex: Desenvolvedor Full-Stack" value={exp.cargo} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, cargo: e.target.value } : x))} className={inp()} /></Field>
                        <Field label="Data início"><input type="text" placeholder="ex: Jan 2022" value={exp.inicio} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, inicio: e.target.value } : x))} className={inp()} /></Field>
                        <Field label="Data fim"><input type="text" placeholder="ex: Dez 2023" value={exp.fim} disabled={exp.atual} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, fim: e.target.value } : x))} className={`${inp()} disabled:opacity-50`} /></Field>
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input type="checkbox" id={`atual-${exp.id}`} checked={exp.atual} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, atual: e.target.checked } : x))} className="h-4 w-4 accent-brand" />
                          <label htmlFor={`atual-${exp.id}`} className="text-sm cursor-pointer select-none">Emprego atual</label>
                        </div>
                        <div className="sm:col-span-2"><Field label="Descrição"><textarea rows={3} placeholder="Responsabilidades e conquistas..." value={exp.descricao} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, descricao: e.target.value } : x))} className={`${inp()} resize-y`} /></Field></div>
                      </div>
                    </div>
                  ))}
                </div>
                {navBtns(2, 4)}
              </div>
            )}

            {/* ── Step 4: Skills & Languages ── */}
            {step === 4 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground"><Star className="h-5 w-5" /></div>
                  <div><h2 className="font-bold text-lg text-foreground">Skills & Idiomas</h2></div>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Competências</h3>
                      <button onClick={() => setSkills((l) => [...l, emptySkill()])} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-smooth"><Plus className="h-3 w-3" /> Adicionar</button>
                    </div>
                    <div className="space-y-3">
                      {skills.map((sk) => (
                        <div key={sk.id} className="flex items-center gap-2">
                          <input type="text" placeholder="ex: React, Python" value={sk.nome} onChange={(e) => setSkills((l) => l.map((s) => s.id === sk.id ? { ...s, nome: e.target.value } : s))} className={`${inp()} flex-1`} />
                          <select value={sk.nivel} onChange={(e) => setSkills((l) => l.map((s) => s.id === sk.id ? { ...s, nivel: e.target.value as SkillLevel } : s))} className="rounded-lg border border-border px-2 py-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-brand/30">
                            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          {skills.length > 1 && <button onClick={() => setSkills((l) => l.filter((s) => s.id !== sk.id))} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Idiomas</h3>
                      <button onClick={() => setIdiomas((l) => [...l, emptyIdioma()])} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-smooth"><Plus className="h-3 w-3" /> Adicionar</button>
                    </div>
                    <div className="space-y-3">
                      {idiomas.map((id) => (
                        <div key={id.id} className="flex items-center gap-2">
                          <input type="text" placeholder="ex: Português" value={id.idioma} onChange={(e) => setIdiomas((l) => l.map((i) => i.id === id.id ? { ...i, idioma: e.target.value } : i))} className={`${inp()} flex-1`} />
                          <input type="text" placeholder="ex: Nativo" value={id.nivel} onChange={(e) => setIdiomas((l) => l.map((i) => i.id === id.id ? { ...i, nivel: e.target.value } : i))} className={`${inp()} flex-1`} />
                          {idiomas.length > 1 && <button onClick={() => setIdiomas((l) => l.filter((i) => i.id !== id.id))} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {navBtns(3, 5)}
              </div>
            )}

            {/* ── Step 5: Template + Preview + Export ── */}
            {step === 5 && (
              <div className="space-y-5">
                <TemplateSelector selected={template} onSelect={setTemplate} />

                {/* Action bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Eye className="h-4 w-4 text-brand" /> Pré-visualização
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportPdf}
                      disabled={exporting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-60"
                    >
                      {exporting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> A gerar PDF…</> : <><Download className="h-3.5 w-3.5" /> Descarregar PDF</>}
                    </button>
                    <button onClick={handleDownloadRtf} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth">
                      <Download className="h-3.5 w-3.5" /> Word (.RTF)
                    </button>
                    <button onClick={handleWhatsApp} className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                    <button onClick={() => goTo(4)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-smooth">
                      <ChevronLeft className="h-3.5 w-3.5" /> Editar
                    </button>
                  </div>
                </div>

                {/* Live preview — swaps instantly on template change */}
                <div className="rounded-2xl border border-border shadow-elegant overflow-hidden">
                  <ActivePreview data={cvData} />
                </div>

                <div className="text-center pt-2">
                  <button onClick={() => goTo(1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors">
                    <ChevronLeft className="h-4 w-4" /> Recomeçar do início
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
      <WhatsAppFab />
    </Layout>
  );
}

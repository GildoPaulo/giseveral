import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  User, GraduationCap, Briefcase, Star, Eye,
  Plus, Trash2, ChevronLeft, ChevronRight, Printer,
  Download, MessageCircle, CheckCircle2, FileText,
} from "lucide-react";

export const Route = createFileRoute("/hub/cv")({
  head: () => ({
    meta: [
      { title: "CV Builder — Giseveral Hub" },
      { name: "description", content: "Crie um CV profissional em minutos e exporte para PDF ou Word grátis." },
    ],
  }),
  component: HubCvPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type SkillLevel = "Básico" | "Intermédio" | "Avançado" | "Expert";

interface PersonalData {
  nome: string;
  titulo: string;
  email: string;
  telefone: string;
  localizacao: string;
  linkedin: string;
  objetivo: string;
}

interface EducacaoEntry {
  id: string;
  grau: string;
  instituicao: string;
  curso: string;
  anoInicio: string;
  anoFim: string;
  nota: string;
}

interface ExperienciaEntry {
  id: string;
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  atual: boolean;
  descricao: string;
}

interface SkillEntry {
  id: string;
  nome: string;
  nivel: SkillLevel;
}

interface IdiomaEntry {
  id: string;
  idioma: string;
  nivel: string;
}

type StepId = 1 | 2 | 3 | 4 | 5;

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function emptyEducacao(): EducacaoEntry {
  return { id: uid(), grau: "", instituicao: "", curso: "", anoInicio: "", anoFim: "", nota: "" };
}

function emptyExperiencia(): ExperienciaEntry {
  return { id: uid(), empresa: "", cargo: "", inicio: "", fim: "", atual: false, descricao: "" };
}

function emptySkill(): SkillEntry {
  return { id: uid(), nome: "", nivel: "Intermédio" };
}

function emptyIdioma(): IdiomaEntry {
  return { id: uid(), idioma: "", nivel: "" };
}

const SKILL_LEVELS: SkillLevel[] = ["Básico", "Intermédio", "Avançado", "Expert"];

const SKILL_BAR: Record<SkillLevel, number> = {
  Básico: 25,
  Intermédio: 50,
  Avançado: 75,
  Expert: 100,
};

// ── Animation variants ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slideVariants: any = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48, transition: { duration: 0.22 } }),
};

// ── RTF export ─────────────────────────────────────────────────────────────────

function escapeRtf(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
}

function buildRtf(
  personal: PersonalData,
  educacao: EducacaoEntry[],
  experiencia: ExperienciaEntry[],
  skills: SkillEntry[],
  idiomas: IdiomaEntry[],
): string {
  const lines: string[] = [];
  const add = (text: string, bold = false, size = 24) => {
    const t = escapeRtf(text);
    lines.push(`{\\fs${size}${bold ? "\\b" : ""} ${t}\\b0}\\par`);
  };
  const sep = () => lines.push("\\par");

  add(personal.nome, true, 36);
  if (personal.titulo) add(personal.titulo, false, 26);
  sep();
  if (personal.email) add(`Email: ${personal.email}`);
  if (personal.telefone) add(`Telefone: ${personal.telefone}`);
  if (personal.localizacao) add(`Localização: ${personal.localizacao}`);
  if (personal.linkedin) add(`LinkedIn: ${personal.linkedin}`);
  sep();
  if (personal.objetivo) {
    add("OBJETIVO PROFISSIONAL", true, 26);
    add(personal.objetivo);
    sep();
  }
  if (experiencia.some((e) => e.empresa)) {
    add("EXPERIÊNCIA PROFISSIONAL", true, 26);
    for (const e of experiencia) {
      if (!e.empresa) continue;
      const period = e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`;
      add(`${e.cargo} — ${e.empresa}`, true);
      add(period, false, 22);
      if (e.descricao) add(e.descricao, false, 22);
      sep();
    }
  }
  if (educacao.some((e) => e.instituicao)) {
    add("EDUCAÇÃO", true, 26);
    for (const e of educacao) {
      if (!e.instituicao) continue;
      add(`${e.grau}${e.curso ? ` em ${e.curso}` : ""} — ${e.instituicao}`, true);
      const period = `${e.anoInicio}${e.anoFim ? ` – ${e.anoFim}` : ""}`;
      add(period + (e.nota ? `  |  Nota: ${e.nota}` : ""), false, 22);
      sep();
    }
  }
  if (skills.some((s) => s.nome)) {
    add("COMPETÊNCIAS", true, 26);
    add(skills.filter((s) => s.nome).map((s) => `${s.nome} (${s.nivel})`).join("  ·  "));
    sep();
  }
  if (idiomas.some((i) => i.idioma)) {
    add("IDIOMAS", true, 26);
    add(idiomas.filter((i) => i.idioma).map((i) => `${i.idioma}: ${i.nivel}`).join("  ·  "));
  }

  return `{\\rtf1\\ansi\\ansicpg1252\\deff0\n{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}\n{\\*\\generator Giseveral CV Builder;}\n\\f0\\sl360\\slmult1\n${lines.join("\n")}\n}`;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS: { id: StepId; label: string; icon: React.ElementType }[] = [
  { id: 1, label: "Dados Pessoais", icon: User },
  { id: 2, label: "Educação", icon: GraduationCap },
  { id: 3, label: "Experiência", icon: Briefcase },
  { id: 4, label: "Skills & Idiomas", icon: Star },
  { id: 5, label: "Pré-visualização", icon: Eye },
];

function StepIndicator({ current }: { current: StepId }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-10 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth
                ${active ? "bg-gradient-brand text-brand-foreground shadow-card"
                  : done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"}`}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground/50
   focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth
   ${err ? "border-destructive" : "border-border"}`;

// ── Main component ─────────────────────────────────────────────────────────────

function HubCvPage() {
  const [step, setStep] = useState<StepId>(1);
  const [dir, setDir] = useState(1);

  const [personal, setPersonal] = useState<PersonalData>({
    nome: "", titulo: "", email: "", telefone: "",
    localizacao: "", linkedin: "", objetivo: "",
  });

  const [educacao, setEducacao] = useState<EducacaoEntry[]>([emptyEducacao()]);
  const [experiencia, setExperiencia] = useState<ExperienciaEntry[]>([emptyExperiencia()]);
  const [skills, setSkills] = useState<SkillEntry[]>([emptySkill()]);
  const [idiomas, setIdiomas] = useState<IdiomaEntry[]>([emptyIdioma()]);

  const [errors, setErrors] = useState<Partial<Record<keyof PersonalData, string>>>({});

  const cvRef = useRef<HTMLDivElement>(null);

  function goTo(next: StepId) {
    if (next === 2 && step === 1) {
      const errs: Partial<Record<keyof PersonalData, string>> = {};
      if (!personal.nome.trim()) errs.nome = "Campo obrigatório";
      if (!personal.email.trim()) errs.email = "Campo obrigatório";
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
    }
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updatePersonal<K extends keyof PersonalData>(key: K, val: string) {
    setPersonal((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function updateEducacao(id: string, key: keyof EducacaoEntry, val: string | boolean) {
    setEducacao((list) => list.map((e) => e.id === id ? { ...e, [key]: val } : e));
  }

  function updateExperiencia(id: string, key: keyof ExperienciaEntry, val: string | boolean) {
    setExperiencia((list) => list.map((e) => e.id === id ? { ...e, [key]: val } : e));
  }

  function updateSkill(id: string, key: keyof SkillEntry, val: string) {
    setSkills((list) => list.map((s) => s.id === id ? { ...s, [key]: val } : s));
  }

  function updateIdioma(id: string, key: keyof IdiomaEntry, val: string) {
    setIdiomas((list) => list.map((i) => i.id === id ? { ...i, [key]: val } : i));
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadRtf() {
    const rtf = buildRtf(personal, educacao, experiencia, skills, idiomas);
    const blob = new Blob([rtf], { type: "application/rtf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cv-${(personal.nome || "curriculum").toLowerCase().replace(/\s+/g, "-")}.rtf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CV descarregado!", { description: "Abre com Word, LibreOffice ou Google Docs." });
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `Olá! O meu CV foi criado no Giseveral Hub.\n\n` +
      `Nome: ${personal.nome}\nTítulo: ${personal.titulo}\nEmail: ${personal.email}\nTelefone: ${personal.telefone}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const navButtons = (prevStep?: StepId, nextStep?: StepId) => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
      {prevStep ? (
        <button
          onClick={() => goTo(prevStep)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
      ) : <span />}
      {nextStep && (
        <button
          onClick={() => goTo(nextStep)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
        >
          Continuar <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <Layout>
      <style>{`
        @media print {
          header, footer, nav, #hub-cv-ui { display: none !important; }
          #cv-print-area {
            display: block !important;
            position: fixed;
            inset: 0;
            margin: 0;
            padding: 0;
            background: #fff;
          }
        }
      `}</style>

      <div id="cv-print-area" style={{ display: "none" }}>
        <CvPreview
          personal={personal}
          educacao={educacao}
          experiencia={experiencia}
          skills={skills}
          idiomas={idiomas}
          printMode
        />
      </div>

      <div id="hub-cv-ui" className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand mb-4">
            <FileText className="h-4 w-4 text-gold" /> CV Builder
          </div>
          <h1 className="text-4xl font-bold text-brand mb-3">Crie o seu CV profissional</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Preencha os seus dados, pré-visualize e exporte gratuitamente para PDF ou Word.
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">Dados Pessoais</h2>
                    <p className="text-sm text-muted-foreground">Informação básica de contacto</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Nome completo" required error={errors.nome}>
                    <input
                      type="text"
                      placeholder="ex: João Manuel Silva"
                      value={personal.nome}
                      onChange={(e) => updatePersonal("nome", e.target.value)}
                      className={inputCls(errors.nome)}
                    />
                  </Field>
                  <Field label="Título profissional" error={errors.titulo}>
                    <input
                      type="text"
                      placeholder="ex: Engenheiro Informático"
                      value={personal.titulo}
                      onChange={(e) => updatePersonal("titulo", e.target.value)}
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input
                      type="email"
                      placeholder="ex: joao@email.com"
                      value={personal.email}
                      onChange={(e) => updatePersonal("email", e.target.value)}
                      className={inputCls(errors.email)}
                    />
                  </Field>
                  <Field label="Telefone">
                    <input
                      type="tel"
                      placeholder="ex: +258 84 000 0000"
                      value={personal.telefone}
                      onChange={(e) => updatePersonal("telefone", e.target.value)}
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Localização">
                    <input
                      type="text"
                      placeholder="ex: Maputo, Moçambique"
                      value={personal.localizacao}
                      onChange={(e) => updatePersonal("localizacao", e.target.value)}
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <input
                      type="text"
                      placeholder="ex: linkedin.com/in/joaosilva"
                      value={personal.linkedin}
                      onChange={(e) => updatePersonal("linkedin", e.target.value)}
                      className={inputCls()}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Objetivo profissional">
                      <textarea
                        rows={3}
                        placeholder="Descreva brevemente o seu perfil e objetivos de carreira..."
                        value={personal.objetivo}
                        onChange={(e) => updatePersonal("objetivo", e.target.value)}
                        className={`${inputCls()} resize-y`}
                      />
                    </Field>
                  </div>
                </div>

                {navButtons(undefined, 2)}
              </div>
            )}

            {step === 2 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-foreground">Educação</h2>
                      <p className="text-sm text-muted-foreground">Formação académica</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEducacao((list) => [...list, emptyEducacao()])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-smooth"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>

                <div className="space-y-6">
                  {educacao.map((edu, idx) => (
                    <div key={edu.id} className="relative rounded-xl border border-border p-5 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Formação {idx + 1}
                        </span>
                        {educacao.length > 1 && (
                          <button
                            onClick={() => setEducacao((list) => list.filter((e) => e.id !== edu.id))}
                            className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Grau académico">
                          <input
                            type="text"
                            placeholder="ex: Licenciatura, Mestrado, Bacharelato"
                            value={edu.grau}
                            onChange={(e) => updateEducacao(edu.id, "grau", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <Field label="Instituição">
                          <input
                            type="text"
                            placeholder="ex: UEM, UCM, ISCTEM"
                            value={edu.instituicao}
                            onChange={(e) => updateEducacao(edu.id, "instituicao", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label="Curso">
                            <input
                              type="text"
                              placeholder="ex: Engenharia Informática"
                              value={edu.curso}
                              onChange={(e) => updateEducacao(edu.id, "curso", e.target.value)}
                              className={inputCls()}
                            />
                          </Field>
                        </div>
                        <Field label="Ano de início">
                          <input
                            type="text"
                            placeholder="ex: 2018"
                            value={edu.anoInicio}
                            onChange={(e) => updateEducacao(edu.id, "anoInicio", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <Field label="Ano de conclusão">
                          <input
                            type="text"
                            placeholder="ex: 2022"
                            value={edu.anoFim}
                            onChange={(e) => updateEducacao(edu.id, "anoFim", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label="Nota final (opcional)">
                            <input
                              type="text"
                              placeholder="ex: 16 valores, Muito Bom"
                              value={edu.nota}
                              onChange={(e) => updateEducacao(edu.id, "nota", e.target.value)}
                              className={inputCls()}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {navButtons(1, 3)}
              </div>
            )}

            {step === 3 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-foreground">Experiência Profissional</h2>
                      <p className="text-sm text-muted-foreground">Histórico de trabalho</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExperiencia((list) => [...list, emptyExperiencia()])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-smooth"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>

                <div className="space-y-6">
                  {experiencia.map((exp, idx) => (
                    <div key={exp.id} className="relative rounded-xl border border-border p-5 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Experiência {idx + 1}
                        </span>
                        {experiencia.length > 1 && (
                          <button
                            onClick={() => setExperiencia((list) => list.filter((e) => e.id !== exp.id))}
                            className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Empresa">
                          <input
                            type="text"
                            placeholder="ex: Vodacom Moçambique"
                            value={exp.empresa}
                            onChange={(e) => updateExperiencia(exp.id, "empresa", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <Field label="Cargo">
                          <input
                            type="text"
                            placeholder="ex: Desenvolvedor Full-Stack"
                            value={exp.cargo}
                            onChange={(e) => updateExperiencia(exp.id, "cargo", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <Field label="Data de início">
                          <input
                            type="text"
                            placeholder="ex: Jan 2022"
                            value={exp.inicio}
                            onChange={(e) => updateExperiencia(exp.id, "inicio", e.target.value)}
                            className={inputCls()}
                          />
                        </Field>
                        <Field label="Data de fim">
                          <input
                            type="text"
                            placeholder="ex: Dez 2023"
                            value={exp.fim}
                            disabled={exp.atual}
                            onChange={(e) => updateExperiencia(exp.id, "fim", e.target.value)}
                            className={`${inputCls()} disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </Field>
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`atual-${exp.id}`}
                            checked={exp.atual}
                            onChange={(e) => updateExperiencia(exp.id, "atual", e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-brand"
                          />
                          <label htmlFor={`atual-${exp.id}`} className="text-sm text-foreground cursor-pointer select-none">
                            Emprego atual
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <Field label="Descrição de funções">
                            <textarea
                              rows={3}
                              placeholder="Descreva as suas responsabilidades e conquistas principais..."
                              value={exp.descricao}
                              onChange={(e) => updateExperiencia(exp.id, "descricao", e.target.value)}
                              className={`${inputCls()} resize-y`}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {navButtons(2, 4)}
              </div>
            )}

            {step === 4 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">Skills & Idiomas</h2>
                    <p className="text-sm text-muted-foreground">Competências e línguas</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground text-sm">Competências</h3>
                      <button
                        onClick={() => setSkills((list) => [...list, emptySkill()])}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-smooth"
                      >
                        <Plus className="h-3 w-3" /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {skills.map((sk) => (
                        <div key={sk.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="ex: React, Python, Photoshop"
                            value={sk.nome}
                            onChange={(e) => updateSkill(sk.id, "nome", e.target.value)}
                            className={`${inputCls()} flex-1`}
                          />
                          <select
                            value={sk.nivel}
                            onChange={(e) => updateSkill(sk.id, "nivel", e.target.value)}
                            className="rounded-lg border border-border px-2 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth"
                          >
                            {SKILL_LEVELS.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                          {skills.length > 1 && (
                            <button
                              onClick={() => setSkills((list) => list.filter((s) => s.id !== sk.id))}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground text-sm">Idiomas</h3>
                      <button
                        onClick={() => setIdiomas((list) => [...list, emptyIdioma()])}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-smooth"
                      >
                        <Plus className="h-3 w-3" /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {idiomas.map((id) => (
                        <div key={id.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="ex: Português"
                            value={id.idioma}
                            onChange={(e) => updateIdioma(id.id, "idioma", e.target.value)}
                            className={`${inputCls()} flex-1`}
                          />
                          <input
                            type="text"
                            placeholder="ex: Nativo, Fluente"
                            value={id.nivel}
                            onChange={(e) => updateIdioma(id.id, "nivel", e.target.value)}
                            className={`${inputCls()} flex-1`}
                          />
                          {idiomas.length > 1 && (
                            <button
                              onClick={() => setIdiomas((list) => list.filter((i) => i.id !== id.id))}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {navButtons(3, 5)}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Eye className="h-4 w-4 text-brand" /> Pré-visualização do CV
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
                    >
                      <Printer className="h-3.5 w-3.5" /> Descarregar PDF
                    </button>
                    <button
                      onClick={handleDownloadRtf}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth"
                    >
                      <Download className="h-3.5 w-3.5" /> Descarregar Word (.RTF)
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => goTo(4)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Editar
                    </button>
                  </div>
                </div>

                <div
                  ref={cvRef}
                  className="rounded-2xl border border-border shadow-elegant overflow-hidden"
                >
                  <CvPreview
                    personal={personal}
                    educacao={educacao}
                    experiencia={experiencia}
                    skills={skills}
                    idiomas={idiomas}
                  />
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => goTo(1)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
                  >
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

// ── CV Preview component ───────────────────────────────────────────────────────

function CvPreview({
  personal, educacao, experiencia, skills, idiomas, printMode = false,
}: {
  personal: PersonalData;
  educacao: EducacaoEntry[];
  experiencia: ExperienciaEntry[];
  skills: SkillEntry[];
  idiomas: IdiomaEntry[];
  printMode?: boolean;
}) {
  const filledEducacao = educacao.filter((e) => e.instituicao);
  const filledExperiencia = experiencia.filter((e) => e.empresa);
  const filledSkills = skills.filter((s) => s.nome);
  const filledIdiomas = idiomas.filter((i) => i.idioma);

  const sidebarStyle = printMode
    ? { backgroundColor: "#1e2a4a", color: "#ffffff", minHeight: "100vh", padding: "32px 24px" }
    : undefined;

  const mainStyle = printMode
    ? { backgroundColor: "#ffffff", color: "#1a1a2e", padding: "32px 28px" }
    : undefined;

  return (
    <div
      className={printMode ? "flex min-h-screen" : "grid md:grid-cols-[260px_1fr] min-h-[800px]"}
      style={printMode ? { display: "flex", minHeight: "100vh" } : undefined}
    >
      {/* Sidebar */}
      <div
        className={printMode ? "" : "bg-brand text-brand-foreground p-7"}
        style={sidebarStyle ?? undefined}
      >
        <div
          className={printMode ? "" : "flex flex-col items-center text-center mb-8"}
          style={printMode ? { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32 } : undefined}
        >
          <div
            className={printMode ? "" : "h-24 w-24 rounded-full bg-brand-foreground/20 border-4 border-brand-foreground/30 flex items-center justify-center mb-4 text-4xl font-bold"}
            style={printMode ? {
              height: 96, width: 96, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)",
              border: "4px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center",
              justifyContent: "center", marginBottom: 16, fontSize: 32, fontWeight: 700,
            } : undefined}
          >
            {personal.nome ? personal.nome.charAt(0).toUpperCase() : "?"}
          </div>
          <h1
            className={printMode ? "" : "text-xl font-extrabold leading-tight mb-1"}
            style={printMode ? { fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 } : undefined}
          >
            {personal.nome || "O Seu Nome"}
          </h1>
          {personal.titulo && (
            <p
              className={printMode ? "" : "text-sm text-brand-foreground/80 font-medium"}
              style={printMode ? { fontSize: 13, opacity: 0.8, fontWeight: 500 } : undefined}
            >
              {personal.titulo}
            </p>
          )}
        </div>

        {(personal.email || personal.telefone || personal.localizacao || personal.linkedin) && (
          <SideSection title="Contacto" printMode={printMode}>
            {personal.email && <ContactLine icon="✉" value={personal.email} printMode={printMode} />}
            {personal.telefone && <ContactLine icon="📞" value={personal.telefone} printMode={printMode} />}
            {personal.localizacao && <ContactLine icon="📍" value={personal.localizacao} printMode={printMode} />}
            {personal.linkedin && <ContactLine icon="🔗" value={personal.linkedin} printMode={printMode} />}
          </SideSection>
        )}

        {filledSkills.length > 0 && (
          <SideSection title="Competências" printMode={printMode}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filledSkills.map((sk) => (
                <div key={sk.id}>
                  <div
                    className={printMode ? "" : "flex justify-between text-xs mb-1"}
                    style={printMode ? { display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 } : undefined}
                  >
                    <span style={printMode ? { fontWeight: 600 } : undefined} className={printMode ? "" : "font-semibold"}>{sk.nome}</span>
                    <span style={printMode ? { opacity: 0.7 } : undefined} className={printMode ? "" : "opacity-70"}>{sk.nivel}</span>
                  </div>
                  <div
                    className={printMode ? "" : "h-1.5 rounded-full bg-brand-foreground/20 overflow-hidden"}
                    style={printMode ? { height: 5, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" } : undefined}
                  >
                    <div
                      className={printMode ? "" : "h-full bg-gold rounded-full"}
                      style={{
                        ...(printMode ? { height: "100%", borderRadius: 99, backgroundColor: "#c9a84c" } : undefined),
                        width: `${SKILL_BAR[sk.nivel]}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {filledIdiomas.length > 0 && (
          <SideSection title="Idiomas" printMode={printMode}>
            <div style={printMode ? { display: "flex", flexDirection: "column", gap: 6 } : undefined} className={printMode ? "" : "space-y-2"}>
              {filledIdiomas.map((id) => (
                <div
                  key={id.id}
                  className={printMode ? "" : "flex justify-between text-xs"}
                  style={printMode ? { display: "flex", justifyContent: "space-between", fontSize: 11 } : undefined}
                >
                  <span style={printMode ? { fontWeight: 600 } : undefined} className={printMode ? "" : "font-semibold"}>{id.idioma}</span>
                  <span style={printMode ? { opacity: 0.7 } : undefined} className={printMode ? "" : "opacity-70"}>{id.nivel}</span>
                </div>
              ))}
            </div>
          </SideSection>
        )}
      </div>

      {/* Main content */}
      <div
        className={printMode ? "" : "bg-white dark:bg-card p-7 sm:p-10"}
        style={mainStyle ?? undefined}
      >
        {personal.objetivo && (
          <MainSection title="Objetivo Profissional" printMode={printMode}>
            <p
              className={printMode ? "" : "text-sm text-gray-700 leading-relaxed"}
              style={printMode ? { fontSize: 13, lineHeight: 1.7, color: "#374151" } : undefined}
            >
              {personal.objetivo}
            </p>
          </MainSection>
        )}

        {filledExperiencia.length > 0 && (
          <MainSection title="Experiência Profissional" printMode={printMode}>
            <div style={printMode ? { display: "flex", flexDirection: "column", gap: 20 } : undefined} className={printMode ? "" : "space-y-5"}>
              {filledExperiencia.map((exp) => (
                <div key={exp.id}>
                  <div
                    className={printMode ? "" : "flex items-start justify-between gap-2 mb-0.5"}
                    style={printMode ? { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 } : undefined}
                  >
                    <h3
                      className={printMode ? "" : "font-bold text-brand text-sm"}
                      style={printMode ? { fontWeight: 700, fontSize: 14, color: "#1e2a4a" } : undefined}
                    >
                      {exp.cargo}
                    </h3>
                    <span
                      className={printMode ? "" : "text-xs text-muted-foreground flex-shrink-0"}
                      style={printMode ? { fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" } : undefined}
                    >
                      {exp.atual ? `${exp.inicio} – Presente` : `${exp.inicio}${exp.fim ? ` – ${exp.fim}` : ""}`}
                    </span>
                  </div>
                  <p
                    className={printMode ? "" : "text-xs font-semibold text-gold mb-1"}
                    style={printMode ? { fontSize: 11, fontWeight: 600, color: "#b8860b", marginBottom: 4 } : undefined}
                  >
                    {exp.empresa}
                  </p>
                  {exp.descricao && (
                    <p
                      className={printMode ? "" : "text-xs text-gray-600 leading-relaxed"}
                      style={printMode ? { fontSize: 12, color: "#4b5563", lineHeight: 1.65 } : undefined}
                    >
                      {exp.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {filledEducacao.length > 0 && (
          <MainSection title="Educação" printMode={printMode}>
            <div style={printMode ? { display: "flex", flexDirection: "column", gap: 16 } : undefined} className={printMode ? "" : "space-y-4"}>
              {filledEducacao.map((edu) => (
                <div key={edu.id}>
                  <div
                    className={printMode ? "" : "flex items-start justify-between gap-2 mb-0.5"}
                    style={printMode ? { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 } : undefined}
                  >
                    <h3
                      className={printMode ? "" : "font-bold text-brand text-sm"}
                      style={printMode ? { fontWeight: 700, fontSize: 14, color: "#1e2a4a" } : undefined}
                    >
                      {edu.grau}{edu.curso ? ` em ${edu.curso}` : ""}
                    </h3>
                    <span
                      className={printMode ? "" : "text-xs text-muted-foreground flex-shrink-0"}
                      style={printMode ? { fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" } : undefined}
                    >
                      {edu.anoInicio}{edu.anoFim ? ` – ${edu.anoFim}` : ""}
                    </span>
                  </div>
                  <p
                    className={printMode ? "" : "text-xs font-semibold text-gold"}
                    style={printMode ? { fontSize: 11, fontWeight: 600, color: "#b8860b" } : undefined}
                  >
                    {edu.instituicao}
                  </p>
                  {edu.nota && (
                    <p
                      className={printMode ? "" : "text-xs text-muted-foreground mt-0.5"}
                      style={printMode ? { fontSize: 11, color: "#6b7280", marginTop: 2 } : undefined}
                    >
                      Nota: {edu.nota}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {filledExperiencia.length === 0 && filledEducacao.length === 0 && !personal.objetivo && (
          <div
            className={printMode ? "" : "flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground"}
            style={printMode ? { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", textAlign: "center", color: "#9ca3af" } : undefined}
          >
            <FileText
              className={printMode ? "" : "h-12 w-12 opacity-20 mb-3"}
              style={printMode ? { width: 48, height: 48, opacity: 0.2, marginBottom: 12 } : undefined}
            />
            <p style={printMode ? { fontSize: 14 } : undefined} className={printMode ? "" : "text-sm"}>
              Preencha os dados para visualizar o seu CV aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SideSection({
  title, children, printMode,
}: {
  title: string; children: React.ReactNode; printMode?: boolean;
}) {
  if (printMode) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
          opacity: 0.6, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}>
          {title}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="mb-6">
      <div className="text-[10px] font-extrabold tracking-widest uppercase opacity-60 mb-2 pb-1 border-b border-brand-foreground/20">
        {title}
      </div>
      {children}
    </div>
  );
}

function ContactLine({ icon, value, printMode }: { icon: string; value: string; printMode?: boolean }) {
  if (printMode) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6, fontSize: 11 }}>
        <span>{icon}</span>
        <span style={{ wordBreak: "break-all" }}>{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 text-xs mb-2">
      <span>{icon}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function MainSection({
  title, children, printMode,
}: {
  title: string; children: React.ReactNode; printMode?: boolean;
}) {
  if (printMode) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 14, fontWeight: 800, color: "#1e2a4a", letterSpacing: "0.05em",
          textTransform: "uppercase", paddingBottom: 6, marginBottom: 12,
          borderBottom: "2px solid #c9a84c",
        }}>
          {title}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="mb-7">
      <h2 className="text-xs font-extrabold tracking-widest uppercase text-brand mb-3 pb-2 border-b-2 border-gold">
        {title}
      </h2>
      {children}
    </div>
  );
}

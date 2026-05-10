import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  User, GraduationCap, Briefcase, Star, Eye,
  Plus, Trash2, ChevronLeft, ChevronRight, Download,
  MessageCircle, CheckCircle2, FileText, Printer,
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
type CvTemplate = "moderno" | "classico" | "minimalista";

interface PersonalData {
  nome: string; titulo: string; email: string; telefone: string;
  localizacao: string; linkedin: string; objetivo: string;
}
interface EducacaoEntry {
  id: string; grau: string; instituicao: string; curso: string;
  anoInicio: string; anoFim: string; nota: string;
}
interface ExperienciaEntry {
  id: string; empresa: string; cargo: string; inicio: string;
  fim: string; atual: boolean; descricao: string;
}
interface SkillEntry { id: string; nome: string; nivel: SkillLevel }
interface IdiomaEntry { id: string; idioma: string; nivel: string }

type StepId = 1 | 2 | 3 | 4 | 5;

// ── Helpers ────────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);
const emptyEducacao = (): EducacaoEntry => ({ id: uid(), grau: "", instituicao: "", curso: "", anoInicio: "", anoFim: "", nota: "" });
const emptyExperiencia = (): ExperienciaEntry => ({ id: uid(), empresa: "", cargo: "", inicio: "", fim: "", atual: false, descricao: "" });
const emptySkill = (): SkillEntry => ({ id: uid(), nome: "", nivel: "Intermédio" });
const emptyIdioma = (): IdiomaEntry => ({ id: uid(), idioma: "", nivel: "" });

const SKILL_LEVELS: SkillLevel[] = ["Básico", "Intermédio", "Avançado", "Expert"];
const SKILL_BAR: Record<SkillLevel, number> = { Básico: 25, Intermédio: 50, Avançado: 75, Expert: 100 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slideVariants: any = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48, transition: { duration: 0.22 } }),
};

const TEMPLATES: { id: CvTemplate; label: string; desc: string; preview: string }[] = [
  { id: "moderno",      label: "Moderno",      desc: "Sidebar escura, barras de skills",   preview: "bg-[#1e2a4a]" },
  { id: "classico",     label: "Clássico",     desc: "Cabeçalho completo, elegante",        preview: "bg-gray-800" },
  { id: "minimalista",  label: "Minimalista",  desc: "Uma coluna, tipografia limpa",         preview: "bg-gray-100 border" },
];

// ── RTF export ─────────────────────────────────────────────────────────────────

function escapeRtf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
}

function buildRtf(p: PersonalData, edu: EducacaoEntry[], exp: ExperienciaEntry[], sk: SkillEntry[], id: IdiomaEntry[]): string {
  const lines: string[] = [];
  const add = (text: string, bold = false, size = 24) => {
    lines.push(`{\\fs${size}${bold ? "\\b" : ""} ${escapeRtf(text)}\\b0}\\par`);
  };
  const sep = () => lines.push("\\par");
  add(p.nome, true, 36);
  if (p.titulo) add(p.titulo, false, 26);
  sep();
  if (p.email) add(`Email: ${p.email}`);
  if (p.telefone) add(`Telefone: ${p.telefone}`);
  if (p.localizacao) add(`Localização: ${p.localizacao}`);
  if (p.linkedin) add(`LinkedIn: ${p.linkedin}`);
  sep();
  if (p.objetivo) { add("OBJETIVO PROFISSIONAL", true, 26); add(p.objetivo); sep(); }
  if (exp.some((e) => e.empresa)) {
    add("EXPERIÊNCIA PROFISSIONAL", true, 26);
    for (const e of exp) {
      if (!e.empresa) continue;
      add(`${e.cargo} — ${e.empresa}`, true);
      add(e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`, false, 22);
      if (e.descricao) add(e.descricao, false, 22);
      sep();
    }
  }
  if (edu.some((e) => e.instituicao)) {
    add("EDUCAÇÃO", true, 26);
    for (const e of edu) {
      if (!e.instituicao) continue;
      add(`${e.grau}${e.curso ? ` em ${e.curso}` : ""} — ${e.instituicao}`, true);
      add(`${e.anoInicio}${e.anoFim ? ` – ${e.anoFim}` : ""}${e.nota ? `  |  Nota: ${e.nota}` : ""}`, false, 22);
      sep();
    }
  }
  if (sk.some((s) => s.nome)) { add("COMPETÊNCIAS", true, 26); add(sk.filter((s) => s.nome).map((s) => `${s.nome} (${s.nivel})`).join("  ·  ")); sep(); }
  if (id.some((i) => i.idioma)) { add("IDIOMAS", true, 26); add(id.filter((i) => i.idioma).map((i) => `${i.idioma}: ${i.nivel}`).join("  ·  ")); }
  return `{\\rtf1\\ansi\\ansicpg1252\\deff0\n{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}\n\\f0\\sl360\\slmult1\n${lines.join("\n")}\n}`;
}

// ── PDF HTML builders ──────────────────────────────────────────────────────────

function htmlDoc(title: string, body: string, extraCss = ""): string {
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e}
@page{margin:0;size:A4}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
${extraCss}
</style></head><body>${body}</body></html>`;
}

function buildPdfModerno(p: PersonalData, edu: EducacaoEntry[], exp: ExperienciaEntry[], sk: SkillEntry[], id: IdiomaEntry[]): string {
  const filledSk = sk.filter((s) => s.nome);
  const filledId = id.filter((i) => i.idioma);
  const filledEdu = edu.filter((e) => e.instituicao);
  const filledExp = exp.filter((e) => e.empresa);
  const initials = p.nome ? p.nome.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() : "?";

  const sideHtml = `
<div style="width:230px;min-height:100vh;background:#1e2a4a;color:#fff;padding:32px 20px;flex-shrink:0">
  <div style="text-align:center;margin-bottom:28px">
    <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;margin:0 auto 12px">${initials}</div>
    <div style="font-size:17px;font-weight:800;line-height:1.2;margin-bottom:4px">${p.nome || "O seu nome"}</div>
    ${p.titulo ? `<div style="font-size:12px;opacity:0.75;font-weight:500">${p.titulo}</div>` : ""}
  </div>
  ${(p.email || p.telefone || p.localizacao || p.linkedin) ? `
  <div style="margin-bottom:20px">
    <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.18)">Contacto</div>
    ${p.email ? `<div style="font-size:11px;margin-bottom:5px">✉ ${p.email}</div>` : ""}
    ${p.telefone ? `<div style="font-size:11px;margin-bottom:5px">📞 ${p.telefone}</div>` : ""}
    ${p.localizacao ? `<div style="font-size:11px;margin-bottom:5px">📍 ${p.localizacao}</div>` : ""}
    ${p.linkedin ? `<div style="font-size:11px;margin-bottom:5px">🔗 ${p.linkedin}</div>` : ""}
  </div>` : ""}
  ${filledSk.length ? `
  <div style="margin-bottom:20px">
    <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.18)">Competências</div>
    ${filledSk.map((s) => `
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="font-weight:600">${s.nome}</span><span style="opacity:0.65">${s.nivel}</span></div>
      <div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.18)"><div style="height:100%;width:${SKILL_BAR[s.nivel]}%;background:#c9a84c;border-radius:99px"></div></div>
    </div>`).join("")}
  </div>` : ""}
  ${filledId.length ? `
  <div>
    <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.18)">Idiomas</div>
    ${filledId.map((i) => `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="font-weight:600">${i.idioma}</span><span style="opacity:0.7">${i.nivel}</span></div>`).join("")}
  </div>` : ""}
</div>`;

  const mainSection = (title: string, content: string) =>
    `<div style="margin-bottom:24px"><div style="font-size:11px;font-weight:800;color:#1e2a4a;letter-spacing:0.06em;text-transform:uppercase;padding-bottom:5px;margin-bottom:10px;border-bottom:2px solid #c9a84c">${title}</div>${content}</div>`;

  let mainContent = "";
  if (p.objetivo) mainContent += mainSection("Objetivo Profissional", `<p style="font-size:12px;line-height:1.7;color:#374151">${p.objetivo}</p>`);
  if (filledExp.length) mainContent += mainSection("Experiência Profissional", filledExp.map((e) => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px">
        <span style="font-size:13px;font-weight:700;color:#1e2a4a">${e.cargo}</span>
        <span style="font-size:10px;color:#6b7280;white-space:nowrap">${e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span>
      </div>
      <div style="font-size:11px;font-weight:600;color:#b8860b;margin-bottom:3px">${e.empresa}</div>
      ${e.descricao ? `<div style="font-size:11px;color:#4b5563;line-height:1.6">${e.descricao}</div>` : ""}
    </div>`).join(""));
  if (filledEdu.length) mainContent += mainSection("Educação", filledEdu.map((e) => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:2px">
        <span style="font-size:13px;font-weight:700;color:#1e2a4a">${e.grau}${e.curso ? ` em ${e.curso}` : ""}</span>
        <span style="font-size:10px;color:#6b7280;white-space:nowrap">${e.anoInicio}${e.anoFim ? ` – ${e.anoFim}` : ""}</span>
      </div>
      <div style="font-size:11px;font-weight:600;color:#b8860b">${e.instituicao}</div>
      ${e.nota ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">Nota: ${e.nota}</div>` : ""}
    </div>`).join(""));

  const body = `<div style="display:flex;min-height:100vh">${sideHtml}<div style="flex:1;padding:32px 28px;background:#fff">${mainContent}</div></div>`;
  return htmlDoc(`CV – ${p.nome}`, body);
}

function buildPdfClassico(p: PersonalData, edu: EducacaoEntry[], exp: ExperienciaEntry[], sk: SkillEntry[], id: IdiomaEntry[]): string {
  const filledSk = sk.filter((s) => s.nome);
  const filledId = id.filter((i) => i.idioma);
  const filledEdu = edu.filter((e) => e.instituicao);
  const filledExp = exp.filter((e) => e.empresa);

  const header = `<div style="background:#1a1a2e;color:#fff;padding:32px 40px 24px">
    <h1 style="font-size:28px;font-weight:800;margin-bottom:4px;letter-spacing:-0.01em">${p.nome || "O seu nome"}</h1>
    ${p.titulo ? `<div style="font-size:14px;color:#c9a84c;font-weight:600;margin-bottom:12px">${p.titulo}</div>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:11px;opacity:0.85">
      ${p.email ? `<span>✉ ${p.email}</span>` : ""}
      ${p.telefone ? `<span>📞 ${p.telefone}</span>` : ""}
      ${p.localizacao ? `<span>📍 ${p.localizacao}</span>` : ""}
      ${p.linkedin ? `<span>🔗 ${p.linkedin}</span>` : ""}
    </div>
  </div>`;

  const section = (title: string, content: string) =>
    `<div style="margin-bottom:22px"><h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a2e;border-bottom:2px solid #c9a84c;padding-bottom:5px;margin-bottom:10px">${title}</h2>${content}</div>`;

  let body2col = "";
  let leftCol = "";
  let rightCol = "";

  if (p.objetivo) body2col += section("Objetivo Profissional", `<p style="font-size:12px;line-height:1.7;color:#374151">${p.objetivo}</p>`);
  if (filledExp.length) body2col += section("Experiência Profissional", filledExp.map((e) => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:1px">
        <strong style="font-size:13px;color:#1a1a2e">${e.cargo}</strong>
        <span style="font-size:10px;color:#6b7280">${e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span>
      </div>
      <div style="font-size:11px;font-weight:600;color:#b8860b;margin-bottom:3px">${e.empresa}</div>
      ${e.descricao ? `<div style="font-size:11px;color:#4b5563;line-height:1.6">${e.descricao}</div>` : ""}
    </div>`).join(""));
  if (filledEdu.length) leftCol += section("Educação", filledEdu.map((e) => `
    <div style="margin-bottom:10px">
      <strong style="font-size:12px;color:#1a1a2e">${e.grau}${e.curso ? ` em ${e.curso}` : ""}</strong>
      <div style="font-size:11px;color:#6b7280">${e.anoInicio}${e.anoFim ? ` – ${e.anoFim}` : ""}</div>
      <div style="font-size:11px;font-weight:600;color:#b8860b">${e.instituicao}</div>
      ${e.nota ? `<div style="font-size:10px;color:#6b7280">Nota: ${e.nota}</div>` : ""}
    </div>`).join(""));
  if (filledSk.length) rightCol += section("Competências", filledSk.map((s) => `
    <div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:600">${s.nome}</span><span style="color:#6b7280">${s.nivel}</span></div>
      <div style="height:4px;border-radius:99px;background:#e5e7eb"><div style="height:100%;width:${SKILL_BAR[s.nivel]}%;background:#c9a84c;border-radius:99px"></div></div>
    </div>`).join(""));
  if (filledId.length) rightCol += section("Idiomas", filledId.map((i) => `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span style="font-weight:600">${i.idioma}</span><span style="color:#6b7280">${i.nivel}</span></div>`).join(""));

  const twoCol = (leftCol || rightCol) ? `
    <div style="display:flex;gap:28px">
      <div style="flex:1">${leftCol}</div>
      ${rightCol ? `<div style="width:220px;flex-shrink:0">${rightCol}</div>` : ""}
    </div>` : "";

  const body = `${header}<div style="padding:28px 40px">${body2col}${twoCol}</div>`;
  return htmlDoc(`CV – ${p.nome}`, body);
}

function buildPdfMinimalista(p: PersonalData, edu: EducacaoEntry[], exp: ExperienciaEntry[], sk: SkillEntry[], id: IdiomaEntry[]): string {
  const filledSk = sk.filter((s) => s.nome);
  const filledId = id.filter((i) => i.idioma);
  const filledEdu = edu.filter((e) => e.instituicao);
  const filledExp = exp.filter((e) => e.empresa);

  const section = (title: string, content: string) =>
    `<div style="margin-bottom:24px"><h2 style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#555;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #d1d5db">${title}</h2>${content}</div>`;

  let main = "";
  if (p.objetivo) main += section("Perfil", `<p style="font-size:12.5px;line-height:1.75;color:#374151">${p.objetivo}</p>`);
  if (filledExp.length) main += section("Experiência", filledExp.map((e) => `
    <div style="margin-bottom:14px;padding-left:12px;border-left:2px solid #e5e7eb">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <strong style="font-size:13px">${e.cargo}</strong>
        <span style="font-size:10px;color:#9ca3af">${e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span>
      </div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:3px">${e.empresa}</div>
      ${e.descricao ? `<div style="font-size:11.5px;color:#4b5563;line-height:1.65">${e.descricao}</div>` : ""}
    </div>`).join(""));
  if (filledEdu.length) main += section("Educação", filledEdu.map((e) => `
    <div style="margin-bottom:10px;padding-left:12px;border-left:2px solid #e5e7eb">
      <strong style="font-size:12.5px">${e.grau}${e.curso ? ` em ${e.curso}` : ""}</strong>
      <div style="font-size:11px;color:#6b7280">${e.instituicao} · ${e.anoInicio}${e.anoFim ? ` – ${e.anoFim}` : ""}${e.nota ? ` · Nota: ${e.nota}` : ""}</div>
    </div>`).join(""));
  if (filledSk.length) main += section("Competências", `<div style="display:flex;flex-wrap:wrap;gap:6px">${filledSk.map((s) => `<span style="background:#f3f4f6;border-radius:4px;padding:3px 8px;font-size:11px">${s.nome} <span style="color:#9ca3af">· ${s.nivel}</span></span>`).join("")}</div>`);
  if (filledId.length) main += section("Idiomas", `<div style="display:flex;flex-wrap:wrap;gap:6px">${filledId.map((i) => `<span style="background:#f3f4f6;border-radius:4px;padding:3px 8px;font-size:11px">${i.idioma} <span style="color:#9ca3af">· ${i.nivel}</span></span>`).join("")}</div>`);

  const contacts = [p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean).join("  ·  ");
  const header = `<div style="border-bottom:2px solid #1a1a2e;padding-bottom:16px;margin-bottom:28px">
    <h1 style="font-size:30px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px">${p.nome || "O seu nome"}</h1>
    ${p.titulo ? `<div style="font-size:14px;color:#6b7280;margin-bottom:8px">${p.titulo}</div>` : ""}
    ${contacts ? `<div style="font-size:11px;color:#6b7280">${contacts}</div>` : ""}
  </div>`;

  const body = `<div style="max-width:700px;margin:0 auto;padding:40px 40px 32px">${header}${main}</div>`;
  return htmlDoc(`CV – ${p.nome}`, body);
}

function buildPdfHtml(template: CvTemplate, p: PersonalData, edu: EducacaoEntry[], exp: ExperienciaEntry[], sk: SkillEntry[], id: IdiomaEntry[]): string {
  if (template === "classico") return buildPdfClassico(p, edu, exp, sk, id);
  if (template === "minimalista") return buildPdfMinimalista(p, edu, exp, sk, id);
  return buildPdfModerno(p, edu, exp, sk, id);
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

// ── Field wrapper ──────────────────────────────────────────────────────────────

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

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth ${err ? "border-destructive" : "border-border"}`;

// ── Main component ─────────────────────────────────────────────────────────────

function HubCvPage() {
  const [step, setStep] = useState<StepId>(1);
  const [dir, setDir] = useState(1);
  const [template, setTemplate] = useState<CvTemplate>("moderno");

  const [personal, setPersonal] = useState<PersonalData>({ nome: "", titulo: "", email: "", telefone: "", localizacao: "", linkedin: "", objetivo: "" });
  const [educacao, setEducacao] = useState<EducacaoEntry[]>([emptyEducacao()]);
  const [experiencia, setExperiencia] = useState<ExperienciaEntry[]>([emptyExperiencia()]);
  const [skills, setSkills] = useState<SkillEntry[]>([emptySkill()]);
  const [idiomas, setIdiomas] = useState<IdiomaEntry[]>([emptyIdioma()]);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalData, string>>>({});

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

  function handlePdfDownload() {
    const html = buildPdfHtml(template, personal, educacao, experiencia, skills, idiomas);
    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup bloqueado. Permita popups para este site."); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
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
    const text = encodeURIComponent(`Olá! O meu CV foi criado no Giseveral Hub.\n\nNome: ${personal.nome}\nTítulo: ${personal.titulo}\nEmail: ${personal.email}\nTelefone: ${personal.telefone}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const navButtons = (prevStep?: StepId, nextStep?: StepId) => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
      {prevStep ? (
        <button onClick={() => goTo(prevStep)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
      ) : <span />}
      {nextStep && (
        <button onClick={() => goTo(nextStep)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth">
          Continuar <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand mb-4">
            <FileText className="h-4 w-4 text-gold" /> CV Builder
          </div>
          <h1 className="text-4xl font-bold text-brand mb-3">Crie o seu CV profissional</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Preencha os seus dados, escolha um template e exporte gratuitamente para PDF ou Word.
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">

            {/* ── Step 1: Personal ── */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground"><User className="h-5 w-5" /></div>
                  <div><h2 className="font-bold text-lg text-foreground">Dados Pessoais</h2><p className="text-sm text-muted-foreground">Informação básica de contacto</p></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Nome completo" required error={errors.nome}>
                    <input type="text" placeholder="ex: João Manuel Silva" value={personal.nome} onChange={(e) => updatePersonal("nome", e.target.value)} className={inputCls(errors.nome)} />
                  </Field>
                  <Field label="Título profissional">
                    <input type="text" placeholder="ex: Engenheiro Informático" value={personal.titulo} onChange={(e) => updatePersonal("titulo", e.target.value)} className={inputCls()} />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input type="email" placeholder="ex: joao@email.com" value={personal.email} onChange={(e) => updatePersonal("email", e.target.value)} className={inputCls(errors.email)} />
                  </Field>
                  <Field label="Telefone">
                    <input type="tel" placeholder="ex: +258 84 000 0000" value={personal.telefone} onChange={(e) => updatePersonal("telefone", e.target.value)} className={inputCls()} />
                  </Field>
                  <Field label="Localização">
                    <input type="text" placeholder="ex: Maputo, Moçambique" value={personal.localizacao} onChange={(e) => updatePersonal("localizacao", e.target.value)} className={inputCls()} />
                  </Field>
                  <Field label="LinkedIn">
                    <input type="text" placeholder="ex: linkedin.com/in/joaosilva" value={personal.linkedin} onChange={(e) => updatePersonal("linkedin", e.target.value)} className={inputCls()} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Objetivo profissional">
                      <textarea rows={3} placeholder="Descreva brevemente o seu perfil e objetivos de carreira..." value={personal.objetivo} onChange={(e) => updatePersonal("objetivo", e.target.value)} className={`${inputCls()} resize-y`} />
                    </Field>
                  </div>
                </div>
                {navButtons(undefined, 2)}
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
                  <button onClick={() => setEducacao((l) => [...l, emptyEducacao()])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-smooth"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
                </div>
                <div className="space-y-6">
                  {educacao.map((edu, idx) => (
                    <div key={edu.id} className="rounded-xl border border-border p-5 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Formação {idx + 1}</span>
                        {educacao.length > 1 && <button onClick={() => setEducacao((l) => l.filter((e) => e.id !== edu.id))} className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Grau académico"><input type="text" placeholder="ex: Licenciatura, Mestrado" value={edu.grau} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, grau: e.target.value } : x))} className={inputCls()} /></Field>
                        <Field label="Instituição"><input type="text" placeholder="ex: UEM, UCM, ISCTEM" value={edu.instituicao} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, instituicao: e.target.value } : x))} className={inputCls()} /></Field>
                        <div className="sm:col-span-2"><Field label="Curso"><input type="text" placeholder="ex: Engenharia Informática" value={edu.curso} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, curso: e.target.value } : x))} className={inputCls()} /></Field></div>
                        <Field label="Ano de início"><input type="text" placeholder="ex: 2018" value={edu.anoInicio} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, anoInicio: e.target.value } : x))} className={inputCls()} /></Field>
                        <Field label="Ano de conclusão"><input type="text" placeholder="ex: 2022" value={edu.anoFim} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, anoFim: e.target.value } : x))} className={inputCls()} /></Field>
                        <div className="sm:col-span-2"><Field label="Nota final (opcional)"><input type="text" placeholder="ex: 16 valores, Muito Bom" value={edu.nota} onChange={(e) => setEducacao((l) => l.map((x) => x.id === edu.id ? { ...x, nota: e.target.value } : x))} className={inputCls()} /></Field></div>
                      </div>
                    </div>
                  ))}
                </div>
                {navButtons(1, 3)}
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
                  <button onClick={() => setExperiencia((l) => [...l, emptyExperiencia()])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-smooth"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
                </div>
                <div className="space-y-6">
                  {experiencia.map((exp, idx) => (
                    <div key={exp.id} className="rounded-xl border border-border p-5 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Experiência {idx + 1}</span>
                        {experiencia.length > 1 && <button onClick={() => setExperiencia((l) => l.filter((e) => e.id !== exp.id))} className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Empresa"><input type="text" placeholder="ex: Vodacom Moçambique" value={exp.empresa} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, empresa: e.target.value } : x))} className={inputCls()} /></Field>
                        <Field label="Cargo"><input type="text" placeholder="ex: Desenvolvedor Full-Stack" value={exp.cargo} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, cargo: e.target.value } : x))} className={inputCls()} /></Field>
                        <Field label="Data de início"><input type="text" placeholder="ex: Jan 2022" value={exp.inicio} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, inicio: e.target.value } : x))} className={inputCls()} /></Field>
                        <Field label="Data de fim"><input type="text" placeholder="ex: Dez 2023" value={exp.fim} disabled={exp.atual} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, fim: e.target.value } : x))} className={`${inputCls()} disabled:opacity-50`} /></Field>
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input type="checkbox" id={`atual-${exp.id}`} checked={exp.atual} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, atual: e.target.checked } : x))} className="h-4 w-4 rounded border-border accent-brand" />
                          <label htmlFor={`atual-${exp.id}`} className="text-sm text-foreground cursor-pointer select-none">Emprego atual</label>
                        </div>
                        <div className="sm:col-span-2"><Field label="Descrição de funções"><textarea rows={3} placeholder="Descreva as suas responsabilidades e conquistas principais..." value={exp.descricao} onChange={(e) => setExperiencia((l) => l.map((x) => x.id === exp.id ? { ...x, descricao: e.target.value } : x))} className={`${inputCls()} resize-y`} /></Field></div>
                      </div>
                    </div>
                  ))}
                </div>
                {navButtons(2, 4)}
              </div>
            )}

            {/* ── Step 4: Skills & Languages ── */}
            {step === 4 && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground"><Star className="h-5 w-5" /></div>
                  <div><h2 className="font-bold text-lg text-foreground">Skills & Idiomas</h2><p className="text-sm text-muted-foreground">Competências e línguas</p></div>
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
                          <input type="text" placeholder="ex: React, Python" value={sk.nome} onChange={(e) => setSkills((l) => l.map((s) => s.id === sk.id ? { ...s, nome: e.target.value } : s))} className={`${inputCls()} flex-1`} />
                          <select value={sk.nivel} onChange={(e) => setSkills((l) => l.map((s) => s.id === sk.id ? { ...s, nivel: e.target.value as SkillLevel } : s))} className="rounded-lg border border-border px-2 py-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-brand/30">
                            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          {skills.length > 1 && <button onClick={() => setSkills((l) => l.filter((s) => s.id !== sk.id))} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>}
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
                          <input type="text" placeholder="ex: Português" value={id.idioma} onChange={(e) => setIdiomas((l) => l.map((i) => i.id === id.id ? { ...i, idioma: e.target.value } : i))} className={`${inputCls()} flex-1`} />
                          <input type="text" placeholder="ex: Nativo" value={id.nivel} onChange={(e) => setIdiomas((l) => l.map((i) => i.id === id.id ? { ...i, nivel: e.target.value } : i))} className={`${inputCls()} flex-1`} />
                          {idiomas.length > 1 && <button onClick={() => setIdiomas((l) => l.filter((i) => i.id !== id.id))} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {navButtons(3, 5)}
              </div>
            )}

            {/* ── Step 5: Preview + Template + Export ── */}
            {step === 5 && (
              <div className="space-y-5">
                {/* Template picker */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-3">Escolha o template</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        className={`rounded-xl border-2 p-3 text-left transition-smooth focus:outline-none ${template === t.id ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"}`}
                      >
                        <div className={`h-10 rounded-md mb-2 ${t.preview}`} />
                        <div className="font-semibold text-xs text-foreground">{t.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</div>
                        {template === t.id && <div className="mt-1.5 text-[10px] font-bold text-brand">✓ Selecionado</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Eye className="h-4 w-4 text-brand" /> Pré-visualização
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handlePdfDownload} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth">
                      <Printer className="h-3.5 w-3.5" /> Descarregar PDF
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

                <div className="rounded-2xl border border-border shadow-elegant overflow-hidden">
                  <CvPreview
                    personal={personal}
                    educacao={educacao}
                    experiencia={experiencia}
                    skills={skills}
                    idiomas={idiomas}
                    template={template}
                  />
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

// ── CV Preview component (on-screen) ──────────────────────────────────────────

function CvPreview({
  personal, educacao, experiencia, skills, idiomas, template = "moderno",
}: {
  personal: PersonalData;
  educacao: EducacaoEntry[];
  experiencia: ExperienciaEntry[];
  skills: SkillEntry[];
  idiomas: IdiomaEntry[];
  template?: CvTemplate;
}) {
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledSk = skills.filter((s) => s.nome);
  const filledId = idiomas.filter((i) => i.idioma);
  const initials = personal.nome ? personal.nome.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() : "?";

  if (template === "minimalista") {
    return (
      <div className="bg-white dark:bg-card p-8 sm:p-12 min-h-[700px]">
        <div className="border-b-2 border-foreground pb-5 mb-7">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">{personal.nome || "O Seu Nome"}</h1>
          {personal.titulo && <p className="text-base text-muted-foreground mb-3">{personal.titulo}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {personal.email && <span>✉ {personal.email}</span>}
            {personal.telefone && <span>📞 {personal.telefone}</span>}
            {personal.localizacao && <span>📍 {personal.localizacao}</span>}
            {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          </div>
        </div>
        {personal.objetivo && <MiniSection title="Perfil"><p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{personal.objetivo}</p></MiniSection>}
        {filledExp.length > 0 && <MiniSection title="Experiência">{filledExp.map((e) => (
          <div key={e.id} className="mb-4 pl-3 border-l-2 border-border">
            <div className="flex justify-between items-baseline"><strong className="text-sm text-foreground">{e.cargo}</strong><span className="text-xs text-muted-foreground">{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span></div>
            <div className="text-xs text-muted-foreground mb-1">{e.empresa}</div>
            {e.descricao && <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{e.descricao}</p>}
          </div>
        ))}</MiniSection>}
        {filledEdu.length > 0 && <MiniSection title="Educação">{filledEdu.map((e) => (
          <div key={e.id} className="mb-3 pl-3 border-l-2 border-border">
            <strong className="text-sm text-foreground">{e.grau}{e.curso ? ` em ${e.curso}` : ""}</strong>
            <div className="text-xs text-muted-foreground">{e.instituicao} · {e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}{e.nota ? ` · Nota: ${e.nota}` : ""}</div>
          </div>
        ))}</MiniSection>}
        {filledSk.length > 0 && <MiniSection title="Competências"><div className="flex flex-wrap gap-2">{filledSk.map((s) => <span key={s.id} className="bg-muted rounded px-2 py-1 text-xs">{s.nome} <span className="text-muted-foreground">· {s.nivel}</span></span>)}</div></MiniSection>}
        {filledId.length > 0 && <MiniSection title="Idiomas"><div className="flex flex-wrap gap-2">{filledId.map((i) => <span key={i.id} className="bg-muted rounded px-2 py-1 text-xs">{i.idioma} <span className="text-muted-foreground">· {i.nivel}</span></span>)}</div></MiniSection>}
        {!personal.objetivo && filledExp.length === 0 && filledEdu.length === 0 && <EmptyState />}
      </div>
    );
  }

  if (template === "classico") {
    return (
      <div className="min-h-[700px]">
        <div className="bg-[#1a1a2e] text-white px-8 py-7">
          <h1 className="text-2xl font-extrabold mb-1">{personal.nome || "O Seu Nome"}</h1>
          {personal.titulo && <p className="text-sm text-[#c9a84c] font-semibold mb-3">{personal.titulo}</p>}
          <div className="flex flex-wrap gap-4 text-xs opacity-80">
            {personal.email && <span>✉ {personal.email}</span>}
            {personal.telefone && <span>📞 {personal.telefone}</span>}
            {personal.localizacao && <span>📍 {personal.localizacao}</span>}
            {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          </div>
        </div>
        <div className="bg-white dark:bg-card p-7 sm:p-10">
          {personal.objetivo && <MainSection title="Objetivo Profissional"><p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{personal.objetivo}</p></MainSection>}
          {filledExp.length > 0 && <MainSection title="Experiência Profissional">{filledExp.map((e) => (
            <div key={e.id} className="mb-4">
              <div className="flex justify-between items-start mb-0.5"><h3 className="font-bold text-sm text-foreground">{e.cargo}</h3><span className="text-xs text-muted-foreground">{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span></div>
              <p className="text-xs font-semibold text-[#b8860b] mb-1">{e.empresa}</p>
              {e.descricao && <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{e.descricao}</p>}
            </div>
          ))}</MainSection>}
          <div className="grid md:grid-cols-[1fr_220px] gap-8">
            <div>{filledEdu.length > 0 && <MainSection title="Educação">{filledEdu.map((e) => (
              <div key={e.id} className="mb-3">
                <div className="flex justify-between items-start"><h3 className="font-bold text-sm text-foreground">{e.grau}{e.curso ? ` em ${e.curso}` : ""}</h3><span className="text-xs text-muted-foreground">{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}</span></div>
                <p className="text-xs font-semibold text-[#b8860b]">{e.instituicao}</p>
                {e.nota && <p className="text-xs text-muted-foreground mt-0.5">Nota: {e.nota}</p>}
              </div>
            ))}</MainSection>}</div>
            <div>
              {filledSk.length > 0 && <MainSection title="Competências">{filledSk.map((s) => (
                <div key={s.id} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1"><span className="font-semibold">{s.nome}</span><span className="text-muted-foreground">{s.nivel}</span></div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden"><div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${SKILL_BAR[s.nivel]}%` }} /></div>
                </div>
              ))}</MainSection>}
              {filledId.length > 0 && <MainSection title="Idiomas">{filledId.map((i) => (
                <div key={i.id} className="flex justify-between text-xs mb-1.5"><span className="font-semibold">{i.idioma}</span><span className="text-muted-foreground">{i.nivel}</span></div>
              ))}</MainSection>}
            </div>
          </div>
          {!personal.objetivo && filledExp.length === 0 && filledEdu.length === 0 && <EmptyState />}
        </div>
      </div>
    );
  }

  // Default: Moderno
  return (
    <div className="grid md:grid-cols-[260px_1fr] min-h-[700px]">
      <div className="bg-brand text-brand-foreground p-7">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-24 w-24 rounded-full bg-brand-foreground/20 border-4 border-brand-foreground/30 flex items-center justify-center mb-4 text-4xl font-bold">{initials}</div>
          <h1 className="text-xl font-extrabold leading-tight mb-1">{personal.nome || "O Seu Nome"}</h1>
          {personal.titulo && <p className="text-sm text-brand-foreground/80 font-medium">{personal.titulo}</p>}
        </div>
        {(personal.email || personal.telefone || personal.localizacao || personal.linkedin) && (
          <SideSection title="Contacto">
            {personal.email && <div className="flex items-start gap-2 text-xs mb-2"><span>✉</span><span className="break-all">{personal.email}</span></div>}
            {personal.telefone && <div className="flex items-start gap-2 text-xs mb-2"><span>📞</span><span>{personal.telefone}</span></div>}
            {personal.localizacao && <div className="flex items-start gap-2 text-xs mb-2"><span>📍</span><span>{personal.localizacao}</span></div>}
            {personal.linkedin && <div className="flex items-start gap-2 text-xs mb-2"><span>🔗</span><span className="break-all">{personal.linkedin}</span></div>}
          </SideSection>
        )}
        {filledSk.length > 0 && <SideSection title="Competências">
          <div className="space-y-2.5">
            {filledSk.map((sk) => (
              <div key={sk.id}>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold">{sk.nome}</span><span className="opacity-70">{sk.nivel}</span></div>
                <div className="h-1.5 rounded-full bg-brand-foreground/20 overflow-hidden"><div className="h-full bg-gold rounded-full" style={{ width: `${SKILL_BAR[sk.nivel]}%` }} /></div>
              </div>
            ))}
          </div>
        </SideSection>}
        {filledId.length > 0 && <SideSection title="Idiomas">
          {filledId.map((id) => <div key={id.id} className="flex justify-between text-xs mb-2"><span className="font-semibold">{id.idioma}</span><span className="opacity-70">{id.nivel}</span></div>)}
        </SideSection>}
      </div>
      <div className="bg-white dark:bg-card p-7 sm:p-10">
        {personal.objetivo && <MainSection title="Objetivo Profissional"><p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{personal.objetivo}</p></MainSection>}
        {filledExp.length > 0 && <MainSection title="Experiência Profissional">
          <div className="space-y-5">
            {filledExp.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <h3 className="font-bold text-brand text-sm">{exp.cargo}</h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{exp.atual ? `${exp.inicio} – Presente` : `${exp.inicio}${exp.fim ? ` – ${exp.fim}` : ""}`}</span>
                </div>
                <p className="text-xs font-semibold text-gold mb-1">{exp.empresa}</p>
                {exp.descricao && <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{exp.descricao}</p>}
              </div>
            ))}
          </div>
        </MainSection>}
        {filledEdu.length > 0 && <MainSection title="Educação">
          <div className="space-y-4">
            {filledEdu.map((edu) => (
              <div key={edu.id}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <h3 className="font-bold text-brand text-sm">{edu.grau}{edu.curso ? ` em ${edu.curso}` : ""}</h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{edu.anoInicio}{edu.anoFim ? ` – ${edu.anoFim}` : ""}</span>
                </div>
                <p className="text-xs font-semibold text-gold">{edu.instituicao}</p>
                {edu.nota && <p className="text-xs text-muted-foreground mt-0.5">Nota: {edu.nota}</p>}
              </div>
            ))}
          </div>
        </MainSection>}
        {!personal.objetivo && filledExp.length === 0 && filledEdu.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[10px] font-extrabold tracking-widest uppercase opacity-60 mb-2 pb-1 border-b border-brand-foreground/20">{title}</div>
      {children}
    </div>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h2 className="text-xs font-extrabold tracking-widest uppercase text-brand mb-3 pb-2 border-b-2 border-gold">{title}</h2>
      {children}
    </div>
  );
}

function MiniSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2.5 pb-1.5 border-b border-border">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <FileText className="h-12 w-12 opacity-20 mb-3" />
      <p className="text-sm">Preencha os dados para visualizar o seu CV aqui.</p>
    </div>
  );
}

import { useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  Loader2,
} from "lucide-react";
import { callGemini } from "@/services/gemini";
import type {
  CvData,
  CvEducacao,
  CvExperiencia,
  CvIdioma,
  CvProjeto,
  CvCertificacao,
  CvSkill,
  CvSectionKey,
  SkillLevel,
} from "../types";

interface Props {
  data: CvData;
  onChange: (data: CvData) => void;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const SKILL_LEVELS: SkillLevel[] = ["Básico", "Intermédio", "Avançado", "Expert"];

export function Sidebar({ data, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    personal: true,
    objetivo: false,
    experiencia: false,
    educacao: false,
    skills: false,
    idiomas: false,
    projetos: false,
    certificacoes: false,
  });

  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const [aiLoading, setAiLoading] = useState<Set<string>>(new Set());
  const setAI = (key: string, on: boolean) =>
    setAiLoading(prev => { const s = new Set(prev); on ? s.add(key) : s.delete(key); return s; });

  const suggestObjetivo = useCallback(async () => {
    setAI("objetivo", true);
    try {
      const context = [
        data.personal.nome && `Nome: ${data.personal.nome}`,
        data.personal.titulo && `Cargo desejado: ${data.personal.titulo}`,
        data.experiencia.length > 0 && `Experiência mais recente: ${data.experiencia[0].cargo} na ${data.experiencia[0].empresa}`,
        data.educacao.length > 0 && `Formação: ${data.educacao[0].curso} em ${data.educacao[0].instituicao}`,
      ].filter(Boolean).join(". ");
      const text = await callGemini("cv_suggest", "Escreve um resumo/objectivo profissional conciso (3-4 frases) para o CV.", context || undefined);
      setObjetivo(text.trim());
    } catch { /* silently fail */ }
    setAI("objetivo", false);
  }, [data]);

  const suggestExpDescricao = useCallback(async (i: number, cargo: string, empresa: string, existing: string) => {
    const key = `exp-${i}`;
    setAI(key, true);
    try {
      const prompt = `Escreve 3-4 bullet points de realizações e responsabilidades profissionais para o cargo de "${cargo || "Profissional"}" na empresa "${empresa || "empresa"}"${existing ? `. Contexto adicional: ${existing}` : ""}. Formato: uma frase por linha, começando por verbo de acção.`;
      const text = await callGemini("cv_suggest", prompt);
      setExp(i, "descricao", text.trim());
    } catch { /* silently fail */ }
    setAI(key, false);
  }, [data]);

  const up = <T,>(arr: T[], i: number) => {
    if (i === 0) return arr;
    const n = [...arr];
    [n[i - 1], n[i]] = [n[i], n[i - 1]];
    return n;
  };
  const down = <T,>(arr: T[], i: number) => {
    if (i === arr.length - 1) return arr;
    const n = [...arr];
    [n[i], n[i + 1]] = [n[i + 1], n[i]];
    return n;
  };

  // Helpers
  const setPersonal = (k: keyof CvData["personal"], v: string) =>
    onChange({ ...data, personal: { ...data.personal, [k]: v } });

  const setObjetivo = (v: string) => onChange({ ...data, objetivo: v });

  const setExp = (i: number, k: keyof CvExperiencia, v: string | boolean) => {
    const arr = [...data.experiencia];
    arr[i] = { ...arr[i], [k]: v };
    onChange({ ...data, experiencia: arr });
  };
  const addExp = () =>
    onChange({
      ...data,
      experiencia: [
        ...data.experiencia,
        { id: uid(), empresa: "", cargo: "", inicio: "", fim: "", atual: false, descricao: "", localizacao: "" },
      ],
    });
  const delExp = (i: number) =>
    onChange({ ...data, experiencia: data.experiencia.filter((_, j) => j !== i) });

  const setEdu = (i: number, k: keyof CvEducacao, v: string) => {
    const arr = [...data.educacao];
    arr[i] = { ...arr[i], [k]: v };
    onChange({ ...data, educacao: arr });
  };
  const addEdu = () =>
    onChange({
      ...data,
      educacao: [
        ...data.educacao,
        { id: uid(), grau: "", instituicao: "", curso: "", anoInicio: "", anoFim: "", nota: "", descricao: "" },
      ],
    });
  const delEdu = (i: number) =>
    onChange({ ...data, educacao: data.educacao.filter((_, j) => j !== i) });

  const setSk = (i: number, k: keyof CvSkill, v: string) => {
    const arr = [...data.skills];
    arr[i] = { ...arr[i], [k]: v } as CvSkill;
    onChange({ ...data, skills: arr });
  };
  const addSk = () =>
    onChange({ ...data, skills: [...data.skills, { id: uid(), nome: "", nivel: "Intermédio" }] });
  const delSk = (i: number) =>
    onChange({ ...data, skills: data.skills.filter((_, j) => j !== i) });

  const setId = (i: number, k: keyof CvIdioma, v: string) => {
    const arr = [...data.idiomas];
    arr[i] = { ...arr[i], [k]: v };
    onChange({ ...data, idiomas: arr });
  };
  const addId = () =>
    onChange({ ...data, idiomas: [...data.idiomas, { id: uid(), idioma: "", nivel: "" }] });
  const delId = (i: number) =>
    onChange({ ...data, idiomas: data.idiomas.filter((_, j) => j !== i) });

  const setProj = (i: number, k: keyof CvProjeto, v: string) => {
    const arr = [...data.projetos];
    arr[i] = { ...arr[i], [k]: v };
    onChange({ ...data, projetos: arr });
  };
  const addProj = () =>
    onChange({ ...data, projetos: [...data.projetos, { id: uid(), nome: "", descricao: "", url: "", tecnologias: "" }] });
  const delProj = (i: number) =>
    onChange({ ...data, projetos: data.projetos.filter((_, j) => j !== i) });

  const setCert = (i: number, k: keyof CvCertificacao, v: string) => {
    const arr = [...data.certificacoes];
    arr[i] = { ...arr[i], [k]: v };
    onChange({ ...data, certificacoes: arr });
  };
  const addCert = () =>
    onChange({ ...data, certificacoes: [...data.certificacoes, { id: uid(), nome: "", emissor: "", data: "", url: "" }] });
  const delCert = (i: number) =>
    onChange({ ...data, certificacoes: data.certificacoes.filter((_, j) => j !== i) });

  const toggleSection = (key: CvSectionKey) =>
    onChange({ ...data, sections: { ...data.sections, [key]: { ...data.sections[key], visible: !data.sections[key].visible } } });

  return (
    <div className="w-[35%] min-w-[300px] max-w-[520px] shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
      {/* Personal */}
      <Panel label="Informação Pessoal" open={open.personal} onToggle={() => toggle("personal")}>
        <Field label="Nome completo" value={data.personal.nome} onChange={v => setPersonal("nome", v)} />
        <Field label="Título / Cargo" value={data.personal.titulo} onChange={v => setPersonal("titulo", v)} />
        <Field label="Email" value={data.personal.email} onChange={v => setPersonal("email", v)} type="email" />
        <Field label="Telefone" value={data.personal.telefone} onChange={v => setPersonal("telefone", v)} />
        <Field label="Localização" value={data.personal.localizacao} onChange={v => setPersonal("localizacao", v)} />
        <Field label="LinkedIn" value={data.personal.linkedin} onChange={v => setPersonal("linkedin", v)} />
        <Field label="Website" value={data.personal.website} onChange={v => setPersonal("website", v)} />
        <Field label="Foto (URL)" value={data.personal.foto} onChange={v => setPersonal("foto", v)} />
      </Panel>

      {/* Objetivo */}
      <Panel label="Resumo / Objetivo" open={open.objetivo} onToggle={() => toggle("objetivo")}>
        <TextareaField value={data.objetivo} onChange={setObjetivo} rows={4} />
        <button
          type="button"
          onClick={suggestObjetivo}
          disabled={aiLoading.has("objetivo")}
          className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[10px] font-semibold text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 w-full justify-center"
        >
          {aiLoading.has("objetivo") ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
          {aiLoading.has("objetivo") ? "A gerar…" : "✨ Sugerir com IA"}
        </button>
      </Panel>

      {/* Experiência */}
      <Panel
        label="Experiência"
        open={open.experiencia}
        onToggle={() => toggle("experiencia")}
        sectionKey="experiencia"
        visible={data.sections.experiencia.visible}
        onToggleVisible={() => toggleSection("experiencia")}
        onAdd={addExp}
      >
        {data.experiencia.map((exp, i) => (
          <ItemCard
            key={exp.id}
            title={exp.cargo || exp.empresa || "Nova experiência"}
            onDelete={() => delExp(i)}
            onMoveUp={() => onChange({ ...data, experiencia: up(data.experiencia, i) })}
            onMoveDown={() => onChange({ ...data, experiencia: down(data.experiencia, i) })}
            canUp={i > 0}
            canDown={i < data.experiencia.length - 1}
          >
            <Field label="Cargo" value={exp.cargo} onChange={v => setExp(i, "cargo", v)} />
            <Field label="Empresa" value={exp.empresa} onChange={v => setExp(i, "empresa", v)} />
            <Field label="Localização" value={exp.localizacao} onChange={v => setExp(i, "localizacao", v)} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Início" value={exp.inicio} onChange={v => setExp(i, "inicio", v)} placeholder="Jan 2020" />
              <Field label="Fim" value={exp.fim} onChange={v => setExp(i, "fim", v)} placeholder="Presente" disabled={exp.atual} />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={exp.atual} onChange={e => setExp(i, "atual", e.target.checked)} className="rounded" />
              Emprego atual
            </label>
            <TextareaField label="Descrição" value={exp.descricao} onChange={v => setExp(i, "descricao", v)} rows={3} />
            <button
              type="button"
              onClick={() => suggestExpDescricao(i, exp.cargo, exp.empresa, exp.descricao)}
              disabled={aiLoading.has(`exp-${i}`)}
              className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[10px] font-semibold text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 w-full justify-center"
            >
              {aiLoading.has(`exp-${i}`) ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {aiLoading.has(`exp-${i}`) ? "A gerar…" : "✨ Sugerir descrição com IA"}
            </button>
          </ItemCard>
        ))}
      </Panel>

      {/* Educação */}
      <Panel
        label="Educação"
        open={open.educacao}
        onToggle={() => toggle("educacao")}
        sectionKey="educacao"
        visible={data.sections.educacao.visible}
        onToggleVisible={() => toggleSection("educacao")}
        onAdd={addEdu}
      >
        {data.educacao.map((edu, i) => (
          <ItemCard
            key={edu.id}
            title={edu.grau || edu.instituicao || "Nova educação"}
            onDelete={() => delEdu(i)}
            onMoveUp={() => onChange({ ...data, educacao: up(data.educacao, i) })}
            onMoveDown={() => onChange({ ...data, educacao: down(data.educacao, i) })}
            canUp={i > 0}
            canDown={i < data.educacao.length - 1}
          >
            <Field label="Grau / Nível" value={edu.grau} onChange={v => setEdu(i, "grau", v)} placeholder="Licenciatura" />
            <Field label="Instituição" value={edu.instituicao} onChange={v => setEdu(i, "instituicao", v)} />
            <Field label="Curso" value={edu.curso} onChange={v => setEdu(i, "curso", v)} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Ano início" value={edu.anoInicio} onChange={v => setEdu(i, "anoInicio", v)} />
              <Field label="Ano fim" value={edu.anoFim} onChange={v => setEdu(i, "anoFim", v)} />
            </div>
            <Field label="Classificação" value={edu.nota} onChange={v => setEdu(i, "nota", v)} />
          </ItemCard>
        ))}
      </Panel>

      {/* Skills */}
      <Panel
        label="Competências"
        open={open.skills}
        onToggle={() => toggle("skills")}
        sectionKey="skills"
        visible={data.sections.skills.visible}
        onToggleVisible={() => toggleSection("skills")}
        onAdd={addSk}
      >
        {data.skills.map((sk, i) => (
          <ItemCard
            key={sk.id}
            title={sk.nome || "Nova competência"}
            onDelete={() => delSk(i)}
            onMoveUp={() => onChange({ ...data, skills: up(data.skills, i) })}
            onMoveDown={() => onChange({ ...data, skills: down(data.skills, i) })}
            canUp={i > 0}
            canDown={i < data.skills.length - 1}
          >
            <Field label="Competência" value={sk.nome} onChange={v => setSk(i, "nome", v)} />
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Nível</label>
              <select
                value={sk.nivel}
                onChange={e => setSk(i, "nivel", e.target.value)}
                className="w-full text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </ItemCard>
        ))}
      </Panel>

      {/* Idiomas */}
      <Panel
        label="Idiomas"
        open={open.idiomas}
        onToggle={() => toggle("idiomas")}
        sectionKey="idiomas"
        visible={data.sections.idiomas.visible}
        onToggleVisible={() => toggleSection("idiomas")}
        onAdd={addId}
      >
        {data.idiomas.map((id, i) => (
          <ItemCard
            key={id.id}
            title={id.idioma || "Novo idioma"}
            onDelete={() => delId(i)}
            onMoveUp={() => onChange({ ...data, idiomas: up(data.idiomas, i) })}
            onMoveDown={() => onChange({ ...data, idiomas: down(data.idiomas, i) })}
            canUp={i > 0}
            canDown={i < data.idiomas.length - 1}
          >
            <Field label="Idioma" value={id.idioma} onChange={v => setId(i, "idioma", v)} />
            <Field label="Nível" value={id.nivel} onChange={v => setId(i, "nivel", v)} placeholder="B2, C1, Nativo..." />
          </ItemCard>
        ))}
      </Panel>

      {/* Projetos */}
      <Panel
        label="Projetos"
        open={open.projetos}
        onToggle={() => toggle("projetos")}
        sectionKey="projetos"
        visible={data.sections.projetos.visible}
        onToggleVisible={() => toggleSection("projetos")}
        onAdd={addProj}
      >
        {data.projetos.map((proj, i) => (
          <ItemCard
            key={proj.id}
            title={proj.nome || "Novo projeto"}
            onDelete={() => delProj(i)}
            onMoveUp={() => onChange({ ...data, projetos: up(data.projetos, i) })}
            onMoveDown={() => onChange({ ...data, projetos: down(data.projetos, i) })}
            canUp={i > 0}
            canDown={i < data.projetos.length - 1}
          >
            <Field label="Nome" value={proj.nome} onChange={v => setProj(i, "nome", v)} />
            <Field label="URL" value={proj.url} onChange={v => setProj(i, "url", v)} />
            <Field label="Tecnologias" value={proj.tecnologias} onChange={v => setProj(i, "tecnologias", v)} placeholder="React, TypeScript..." />
            <TextareaField label="Descrição" value={proj.descricao} onChange={v => setProj(i, "descricao", v)} rows={3} />
          </ItemCard>
        ))}
      </Panel>

      {/* Certificações */}
      <Panel
        label="Certificações"
        open={open.certificacoes}
        onToggle={() => toggle("certificacoes")}
        sectionKey="certificacoes"
        visible={data.sections.certificacoes.visible}
        onToggleVisible={() => toggleSection("certificacoes")}
        onAdd={addCert}
      >
        {data.certificacoes.map((cert, i) => (
          <ItemCard
            key={cert.id}
            title={cert.nome || "Nova certificação"}
            onDelete={() => delCert(i)}
            onMoveUp={() => onChange({ ...data, certificacoes: up(data.certificacoes, i) })}
            onMoveDown={() => onChange({ ...data, certificacoes: down(data.certificacoes, i) })}
            canUp={i > 0}
            canDown={i < data.certificacoes.length - 1}
          >
            <Field label="Nome" value={cert.nome} onChange={v => setCert(i, "nome", v)} />
            <Field label="Emissor" value={cert.emissor} onChange={v => setCert(i, "emissor", v)} />
            <Field label="Data" value={cert.data} onChange={v => setCert(i, "data", v)} placeholder="Jan 2024" />
            <Field label="URL" value={cert.url} onChange={v => setCert(i, "url", v)} />
          </ItemCard>
        ))}
      </Panel>

      <div className="h-8" />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

interface PanelProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  sectionKey?: CvSectionKey;
  visible?: boolean;
  onToggleVisible?: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}

function Panel({ label, open, onToggle, visible, onToggleVisible, onAdd, children }: PanelProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggle}>
        {open ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
        <span className="text-xs font-semibold flex-1 select-none">{label}</span>
        {onToggleVisible !== undefined && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onToggleVisible(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title={visible ? "Ocultar secção no CV" : "Mostrar secção no CV"}
          >
            {visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAdd(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Adicionar"
          >
            <Plus size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  title: string;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canUp: boolean;
  canDown: boolean;
  children: React.ReactNode;
}

function ItemCard({ title, onDelete, onMoveUp, onMoveDown, canUp, canDown, children }: ItemCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border bg-background">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-lg"
        onClick={() => setExpanded(p => !p)}
      >
        <GripVertical size={12} className="text-muted-foreground/40 shrink-0" />
        <span className="text-[11px] font-medium flex-1 truncate">{title}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); if (canUp) onMoveUp(); }}
            disabled={!canUp}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25"
          >▲</button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); if (canDown) onMoveDown(); }}
            disabled={!canDown}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25"
          >▼</button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2.5 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

function Field({ label, value, onChange, type = "text", placeholder, disabled }: FieldProps) {
  return (
    <div>
      {label && <label className="block text-[10px] text-muted-foreground mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

interface TextareaFieldProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}

function TextareaField({ label, value, onChange, rows = 3 }: TextareaFieldProps) {
  return (
    <div>
      {label && <label className="block text-[10px] text-muted-foreground mb-1">{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

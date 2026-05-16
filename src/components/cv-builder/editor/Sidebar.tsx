import { useRef, useState, useCallback } from "react";
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
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { callGemini } from "@/services/gemini";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { SKILL_PCT } from "../types";
import { AtsPanel } from "../AtsPanel";

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

  const suggestExpDescricao = useCallback(async (i: number, cargo: string, empresa: string, existing: string[]) => {
    const key = `exp-${i}`;
    setAI(key, true);
    try {
      const contextHint = existing.filter(Boolean).length > 0
        ? `\nContexto actual: ${existing.filter(Boolean).join(" | ")}`
        : "";
      const prompt = `Escreve 4 bullet points concisos e impactantes para o cargo de "${cargo || "Profissional"}" na empresa "${empresa || "empresa"}".${contextHint}
Cada bullet começa por verbo de acção em português (Liderei, Implementei, Desenvolvi, Optimizei, Reduzi, etc.) e inclui métrica/impacto quando possível.
Devolve APENAS uma lista de bullets, uma por linha, SEM numeração nem prefixos. Não escrevas introdução nem despedida.`;
      const text = await callGemini("cv_suggest", prompt);
      const bullets = text
        .split(/\r?\n/)
        .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
        .filter((l) => l.length > 6)
        .slice(0, 6);
      if (bullets.length > 0) setExp(i, "bullets", bullets);
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
  const setPersonal = (k: keyof CvData["personal"], v: string | boolean) =>
    onChange({ ...data, personal: { ...data.personal, [k]: v } });

  const fotoInputRef = useRef<HTMLInputElement>(null);
  const handleFotoFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setPersonal("foto", result);
    };
    reader.readAsDataURL(file);
  };

  const setObjetivo = (v: string) => onChange({ ...data, objetivo: v });

  const setExp = (i: number, k: keyof CvExperiencia, v: string | boolean | string[]) => {
    const arr = [...data.experiencia];
    arr[i] = { ...arr[i], [k]: v } as CvExperiencia;
    onChange({ ...data, experiencia: arr });
  };
  const addExp = () =>
    onChange({
      ...data,
      experiencia: [
        ...data.experiencia,
        { id: uid(), empresa: "", cargo: "", inicio: "", fim: "", atual: false, descricao: "", bullets: [""], localizacao: "" },
      ],
    });
  const delExp = (i: number) =>
    onChange({ ...data, experiencia: data.experiencia.filter((_, j) => j !== i) });

  const setBullet = (i: number, b: number, v: string) => {
    const exp = data.experiencia[i];
    const bullets = [...(exp.bullets ?? [])];
    bullets[b] = v;
    setExp(i, "bullets", bullets);
  };
  const addBullet = (i: number) => {
    const exp = data.experiencia[i];
    const bullets = [...(exp.bullets ?? []), ""];
    setExp(i, "bullets", bullets);
  };
  const delBullet = (i: number, b: number) => {
    const exp = data.experiencia[i];
    const bullets = (exp.bullets ?? []).filter((_, j) => j !== b);
    setExp(i, "bullets", bullets);
  };
  const moveBullet = (i: number, b: number, direction: "up" | "down") => {
    const exp = data.experiencia[i];
    const bullets = [...(exp.bullets ?? [])];
    const swap = direction === "up" ? b - 1 : b + 1;
    if (swap < 0 || swap >= bullets.length) return;
    [bullets[b], bullets[swap]] = [bullets[swap], bullets[b]];
    setExp(i, "bullets", bullets);
  };

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

  // ── dnd-kit shared setup ───────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function reorderByDrag<T extends { id: string }>(
    key: "experiencia" | "educacao" | "skills" | "idiomas" | "projetos" | "certificacoes",
  ) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const arr = data[key] as T[];
      const oldIndex = arr.findIndex((it) => it.id === active.id);
      const newIndex = arr.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(arr, oldIndex, newIndex);
      onChange({ ...data, [key]: next });
    };
  }

  return (
    <div className="w-[35%] min-w-[300px] max-w-[520px] shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
      {/* ATS Score panel — top of sidebar so it's always visible */}
      <div className="border-b border-border bg-gradient-to-br from-brand/5 to-card px-4 py-3">
        <AtsPanel data={data} />
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          Análise IA · sugestões e palavras-chave em falta
        </p>
      </div>

      {/* Personal */}
      <Panel label="Informação Pessoal" open={open.personal} onToggle={() => toggle("personal")}>
        {/* Foto upload */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
          {data.personal.foto ? (
            <img src={data.personal.foto} alt="Foto" className="h-14 w-14 rounded-full object-cover ring-1 ring-border" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-muted grid place-items-center text-muted-foreground text-[10px] font-semibold">FOTO</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground">Foto de perfil</p>
            <p className="text-[10px] text-muted-foreground">JPG/PNG · 1:1 recomendado</p>
            <div className="mt-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold hover:bg-muted transition-colors"
              >
                <Upload size={10} /> Carregar
              </button>
              {data.personal.foto && (
                <button
                  type="button"
                  onClick={() => setPersonal("foto", "")}
                  className="rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                >
                  Remover
                </button>
              )}
            </div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFotoFile(f); }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Nome" value={data.personal.nome} onChange={v => setPersonal("nome", v)} placeholder="Maria Joana" />
          <Field label="Apelido" value={data.personal.apelido ?? ""} onChange={v => setPersonal("apelido", v)} placeholder="Santos" />
        </div>
        <Field label="Título profissional" value={data.personal.titulo} onChange={v => setPersonal("titulo", v)} placeholder="Engenheira de Software" />

        <Field label="Email" value={data.personal.email} onChange={v => setPersonal("email", v)} type="email" placeholder="nome@email.com" />
        <Field label="Telefone" value={data.personal.telefone} onChange={v => setPersonal("telefone", v)} placeholder="+258 84 000 0000" />

        <Field label="Endereço" value={data.personal.endereco ?? ""} onChange={v => setPersonal("endereco", v)} placeholder="Rua, número" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Código postal" value={data.personal.codigoPostal ?? ""} onChange={v => setPersonal("codigoPostal", v)} placeholder="1100" />
          <Field label="Cidade" value={data.personal.cidade ?? data.personal.localizacao} onChange={v => setPersonal("cidade", v)} placeholder="Maputo" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="País" value={data.personal.pais ?? ""} onChange={v => setPersonal("pais", v)} placeholder="Moçambique" />
          <Field label="Nacionalidade" value={data.personal.nacionalidade ?? ""} onChange={v => setPersonal("nacionalidade", v)} placeholder="Moçambicana" />
        </div>

        <Field label="LinkedIn" value={data.personal.linkedin} onChange={v => setPersonal("linkedin", v)} placeholder="linkedin.com/in/…" />
        <Field label="Website" value={data.personal.website} onChange={v => setPersonal("website", v)} placeholder="meusite.com" />
        <Field label="Portfolio" value={data.personal.portfolio ?? ""} onChange={v => setPersonal("portfolio", v)} placeholder="github.com/…" />

        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer rounded-md border border-border bg-background px-2.5 py-1.5">
          <input
            type="checkbox"
            checked={!!data.personal.cartaConducao}
            onChange={(e) => setPersonal("cartaConducao", e.target.checked)}
            className="rounded"
          />
          Tenho carta de condução
        </label>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderByDrag("experiencia")}>
        <SortableContext items={data.experiencia.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {data.experiencia.map((exp, i) => (
          <ItemCard
            key={exp.id}
            id={exp.id}
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

            {/* Bullet points list */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Realizações</label>
                <button
                  type="button"
                  onClick={() => suggestExpDescricao(i, exp.cargo, exp.empresa, exp.bullets ?? [])}
                  disabled={aiLoading.has(`exp-${i}`)}
                  className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                  title="Gerar 4 bullets com IA"
                >
                  {aiLoading.has(`exp-${i}`) ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  IA
                </button>
              </div>
              <BulletList
                bullets={exp.bullets ?? []}
                onChange={(b, v) => setBullet(i, b, v)}
                onAdd={() => addBullet(i)}
                onDelete={(b) => delBullet(i, b)}
                onMove={(b, d) => moveBullet(i, b, d)}
              />
            </div>

            {/* Optional free-text fallback */}
            {(!exp.bullets || exp.bullets.length === 0) && (
              <TextareaField label="Descrição livre (opcional)" value={exp.descricao} onChange={v => setExp(i, "descricao", v)} rows={3} />
            )}
          </ItemCard>
        ))}
        </SortableContext>
        </DndContext>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderByDrag("educacao")}>
        <SortableContext items={data.educacao.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {data.educacao.map((edu, i) => (
          <ItemCard
            key={edu.id}
            id={edu.id}
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
        </SortableContext>
        </DndContext>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderByDrag("skills")}>
        <SortableContext items={data.skills.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {data.skills.map((sk, i) => (
          <ItemCard
            key={sk.id}
            id={sk.id}
            title={sk.nome || "Nova competência"}
            onDelete={() => delSk(i)}
            onMoveUp={() => onChange({ ...data, skills: up(data.skills, i) })}
            onMoveDown={() => onChange({ ...data, skills: down(data.skills, i) })}
            canUp={i > 0}
            canDown={i < data.skills.length - 1}
          >
            <Field label="Competência" value={sk.nome} onChange={v => setSk(i, "nome", v)} placeholder="React, Python…" />
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Nível</label>
              <div className="grid grid-cols-4 gap-1">
                {SKILL_LEVELS.map((l) => {
                  const active = sk.nivel === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setSk(i, "nivel", l)}
                      className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition-colors ${
                        active
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: `${SKILL_PCT[sk.nivel]}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-brand to-gold"
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-8 text-right">{SKILL_PCT[sk.nivel]}%</span>
              </div>
            </div>
          </ItemCard>
        ))}
        </SortableContext>
        </DndContext>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderByDrag("idiomas")}>
        <SortableContext items={data.idiomas.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {data.idiomas.map((idi, i) => (
          <ItemCard
            key={idi.id}
            id={idi.id}
            title={idi.idioma || "Novo idioma"}
            onDelete={() => delId(i)}
            onMoveUp={() => onChange({ ...data, idiomas: up(data.idiomas, i) })}
            onMoveDown={() => onChange({ ...data, idiomas: down(data.idiomas, i) })}
            canUp={i > 0}
            canDown={i < data.idiomas.length - 1}
          >
            <Field label="Idioma" value={idi.idioma} onChange={v => setId(i, "idioma", v)} />
            <Field label="Nível" value={idi.nivel} onChange={v => setId(i, "nivel", v)} placeholder="B2, C1, Nativo..." />
          </ItemCard>
        ))}
        </SortableContext>
        </DndContext>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderByDrag("projetos")}>
        <SortableContext items={data.projetos.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {data.projetos.map((proj, i) => (
          <ItemCard
            key={proj.id}
            id={proj.id}
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
        </SortableContext>
        </DndContext>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderByDrag("certificacoes")}>
        <SortableContext items={data.certificacoes.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {data.certificacoes.map((cert, i) => (
          <ItemCard
            key={cert.id}
            id={cert.id}
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
        </SortableContext>
        </DndContext>
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
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground shrink-0"
        >
          <ChevronDown size={14} />
        </motion.span>
        <span className="text-xs font-semibold flex-1 select-none uppercase tracking-wider">{label}</span>
        {onToggleVisible !== undefined && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onToggleVisible(); }}
            onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onToggleVisible(); } }}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title={visible ? "Ocultar secção no CV" : "Mostrar secção no CV"}
          >
            {visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </span>
        )}
        {onAdd && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onAdd(); }}
            onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onAdd(); } }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Adicionar"
          >
            <Plus size={13} />
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ItemCardProps {
  id: string;
  title: string;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canUp: boolean;
  canDown: boolean;
  children: React.ReactNode;
}

function ItemCard({ id, title, onDelete, onMoveUp, onMoveDown, canUp, canDown, children }: ItemCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={dragStyle}
      layout
      whileHover={{ borderColor: "hsl(var(--brand) / 0.4)" }}
      transition={{ layout: { duration: 0.2 }, borderColor: { duration: 0.15 } }}
      className="rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors rounded-t-xl">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="grid h-6 w-4 place-items-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical size={12} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded(p => !p)}
          className="flex-1 text-left flex items-center gap-2 truncate"
        >
          <span className="text-[11px] font-semibold truncate">{title}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); if (canUp) onMoveUp(); }}
            onKeyDown={e => { if (e.key === "Enter" && canUp) onMoveUp(); }}
            className={`p-0.5 rounded text-muted-foreground hover:text-foreground ${canUp ? "" : "opacity-25 pointer-events-none"}`}
            aria-label="Mover para cima"
          >▲</span>
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); if (canDown) onMoveDown(); }}
            onKeyDown={e => { if (e.key === "Enter" && canDown) onMoveDown(); }}
            className={`p-0.5 rounded text-muted-foreground hover:text-foreground ${canDown ? "" : "opacity-25 pointer-events-none"}`}
            aria-label="Mover para baixo"
          >▼</span>
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            onKeyDown={e => { if (e.key === "Enter") onDelete(); }}
            className="p-1 rounded text-muted-foreground hover:text-destructive"
            aria-label="Eliminar"
          >
            <Trash2 size={11} />
          </span>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-3 pb-3 pt-2 flex flex-col gap-2.5 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

interface BulletListProps {
  bullets: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
}

function BulletList({ bullets, onChange, onAdd, onDelete, onMove }: BulletListProps) {
  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {bullets.map((b, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-start gap-1.5 group"
          >
            <span className="mt-2 text-muted-foreground/60 text-[12px] leading-none select-none">•</span>
            <input
              type="text"
              value={b}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={`Bullet ${i + 1} — começa com verbo (Liderei, Implementei…)`}
              className="flex-1 min-w-0 text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
            <div className="flex items-center gap-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onMove(i, "up")}
                disabled={i === 0}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-25 text-[10px]"
                aria-label="Subir"
              >▲</button>
              <button
                type="button"
                onClick={() => onMove(i, "down")}
                disabled={i === bullets.length - 1}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-25 text-[10px]"
                aria-label="Descer"
              >▼</button>
              <button
                type="button"
                onClick={() => onDelete(i)}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-destructive"
                aria-label="Remover"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={onAdd}
        className="w-full inline-flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[10px] font-semibold text-muted-foreground hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={10} /> Adicionar bullet
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { callGemini } from "@/services/gemini";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  defaultCvData,
  defaultSettings,
  fontOptions,
  templates,
  type CvDataV2,
  type CvEducation,
  type CvExperience,
  type CvLanguage,
  type CvProject,
  type CvSettings,
  type CvSkill,
  type CvTemplateId,
  type SectionKey,
  type UserCvRow,
} from "./types";
import { ClassicTemplate, CreativeTemplate, ModernTemplate, ProfessionalTemplate } from "./templates";

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneDefault(): CvDataV2 {
  return JSON.parse(JSON.stringify(defaultCvData)) as CvDataV2;
}

function localRows(): UserCvRow[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("giseveral:user_cvs") ?? "[]") as UserCvRow[];
  } catch {
    return [];
  }
}

function writeLocalRows(rows: UserCvRow[]) {
  localStorage.setItem("giseveral:user_cvs", JSON.stringify(rows));
}

export function CvBuilderHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserCvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      if (user) {
        const { data } = await supabase
          .from("user_cvs" as any)
          .select("id,name,cv_data,template,primary_color,font_family,is_public,public_slug,created_at,updated_at")
          .order("updated_at", { ascending: false });
        if (active) setRows((data as UserCvRow[]) ?? []);
      } else if (active) {
        setRows(localRows());
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  async function createCv() {
    const now = new Date().toISOString();
    if (user) {
      const { data, error } = await supabase
        .from("user_cvs" as any)
        .insert({
          user_id: user.id,
          name: "O meu curriculo",
          cv_data: cloneDefault(),
          template: "classic",
          primary_color: defaultSettings.primaryColor,
          font_family: defaultSettings.fontFamily,
        })
        .select("id")
        .single();
      if (error) {
        toast.error("Nao foi possivel criar o CV", { description: error.message });
        return;
      }
      navigate({ to: "/hub/cv-builder/$id", params: { id: (data as { id: string }).id } });
      return;
    }
    const id = uid("local");
    const row: UserCvRow = {
      id,
      name: "O meu curriculo",
      cv_data: cloneDefault(),
      template: "classic",
      primary_color: defaultSettings.primaryColor,
      font_family: defaultSettings.fontFamily,
      created_at: now,
      updated_at: now,
    };
    writeLocalRows([row, ...localRows()]);
    navigate({ to: "/hub/cv-builder/$id", params: { id } });
  }

  function duplicate(row: UserCvRow) {
    const copy = { ...row, id: uid("local"), name: `${row.name} copia`, updated_at: new Date().toISOString() };
    if (user) {
      supabase
        .from("user_cvs" as any)
        .insert({
          user_id: user.id,
          name: copy.name,
          cv_data: copy.cv_data,
          template: copy.template,
          primary_color: copy.primary_color,
          font_family: copy.font_family,
        })
        .select("id")
        .single()
        .then(({ data }) => {
          if (data) navigate({ to: "/hub/cv-builder/$id", params: { id: (data as { id: string }).id } });
        });
      return;
    }
    writeLocalRows([copy, ...localRows()]);
    setRows(localRows());
  }

  async function remove(row: UserCvRow) {
    if (user) await supabase.from("user_cvs" as any).delete().eq("id", row.id);
    else writeLocalRows(localRows().filter((x) => x.id !== row.id));
    setRows((prev) => prev.filter((x) => x.id !== row.id));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-[#111827]">Como queres começar o teu currículo?</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button onClick={createCv} className="rounded-lg border border-[#E5E7EB] bg-white p-8 text-left shadow-sm transition hover:border-[#1E3A8A] hover:shadow-md">
            <FileText className="h-9 w-9 text-[#1E3A8A]" />
            <h2 className="mt-5 text-xl font-bold text-[#111827]">Criar novo</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Começa do zero</p>
          </button>
          <button onClick={() => setUploadOpen(true)} className="rounded-lg border border-[#E5E7EB] bg-white p-8 text-left shadow-sm transition hover:border-[#1E3A8A] hover:shadow-md">
            <Upload className="h-9 w-9 text-[#1E3A8A]" />
            <h2 className="mt-5 text-xl font-bold text-[#111827]">Importar</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Carrega um CV existente</p>
          </button>
        </div>

        {(loading || rows.length > 0) && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-[#111827]">Os teus currículos</h2>
            {loading ? <p className="mt-3 text-sm text-[#6B7280]">A carregar...</p> : null}
            <div className="mt-4 grid gap-3">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
                  <div>
                    <h3 className="font-bold text-[#111827]">{row.name}</h3>
                    <p className="text-xs text-[#6B7280]">
                      {templates.find((t) => t.id === row.template)?.name ?? row.template} · ultima edicao{" "}
                      {row.updated_at ? new Date(row.updated_at).toLocaleString("pt-MZ") : "agora"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/hub/cv-builder/$id" params={{ id: row.id }} className="rounded-md bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white">Editar</Link>
                    <button onClick={() => duplicate(row)} className="rounded-md border border-[#D1D5DB] px-3 py-2 text-xs font-bold">Duplicar</button>
                    <button onClick={() => remove(row)} className="rounded-md border border-[#FCA5A5] px-3 py-2 text-xs font-bold text-[#B91C1C]">Apagar</button>
                    <button onClick={() => navigator.clipboard?.writeText(`https://giseveral.com/hub/cv-builder/${row.id}`)} className="rounded-md border border-[#D1D5DB] px-3 py-2 text-xs font-bold">Partilhar</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar CV</DialogTitle>
            <DialogDescription>Carrega um ficheiro PDF, DOC ou DOCX. A extracao automatica pode ser ligada depois; por agora guardamos o ficheiro como ponto de partida.</DialogDescription>
          </DialogHeader>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf" className="rounded-md border border-[#D1D5DB] p-3 text-sm" />
          <button onClick={createCv} className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-bold text-white">Continuar para o editor</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CvBuilderEditor({ id }: { id: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("O meu curriculo");
  const [data, setData] = useState<CvDataV2>(() => cloneDefault());
  const [settings, setSettings] = useState<CvSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.75);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      if (user && !id.startsWith("local")) {
        const { data: row } = await supabase
          .from("user_cvs" as any)
          .select("id,name,cv_data,template,primary_color,font_family,updated_at")
          .eq("id", id)
          .single();
        if (active && row) {
          const cv = row as UserCvRow;
          setName(cv.name);
          setData({ ...cloneDefault(), ...cv.cv_data });
          setSettings({
            template: cv.template ?? "classic",
            primaryColor: cv.primary_color ?? "#1E3A8A",
            fontFamily: cv.font_family ?? "Inter",
            fontSize: 14,
            spacing: 1,
          });
          setSavedAt(cv.updated_at ?? null);
        }
      } else if (active) {
        const row = localRows().find((x) => x.id === id);
        if (row) {
          setName(row.name);
          setData({ ...cloneDefault(), ...row.cv_data });
          setSettings({
            template: row.template,
            primaryColor: row.primary_color,
            fontFamily: row.font_family,
            fontSize: 14,
            spacing: 1,
          });
          setSavedAt(row.updated_at ?? null);
        }
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [id, user]);

  useEffect(() => {
    if (loading) return;
    dirtyRef.current = true;
    const timer = window.setTimeout(() => save(), 3000);
    return () => window.clearTimeout(timer);
  }, [data, settings, name, loading]);

  async function save() {
    if (!dirtyRef.current) return;
    setSaving(true);
    const now = new Date().toISOString();
    if (user && !id.startsWith("local")) {
      const { error } = await supabase
        .from("user_cvs" as any)
        .update({
          name,
          cv_data: data,
          template: settings.template,
          primary_color: settings.primaryColor,
          font_family: settings.fontFamily,
          updated_at: now,
        })
        .eq("id", id);
      if (error) toast.error("Erro ao guardar", { description: error.message });
    } else {
      const rows = localRows();
      const idx = rows.findIndex((x) => x.id === id);
      const row: UserCvRow = {
        id,
        name,
        cv_data: data,
        template: settings.template,
        primary_color: settings.primaryColor,
        font_family: settings.fontFamily,
        updated_at: now,
        created_at: rows[idx]?.created_at ?? now,
      };
      if (idx >= 0) rows[idx] = row;
      else rows.unshift(row);
      writeLocalRows(rows);
    }
    dirtyRef.current = false;
    setSavedAt(now);
    setSaving(false);
  }

  async function downloadPdf() {
    const html2pdf = (await import("html2pdf.js")).default as any;
    const element = document.getElementById("cv-preview-a4");
    if (!element) return;
    html2pdf()
      .set({
        margin: 0,
        filename: `CV-${data.firstName || "Giseveral"}-${Date.now()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  }

  if (loading) return <div className="grid h-screen place-items-center bg-[#F3F4F6] text-sm text-[#6B7280]">A carregar editor...</div>;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-[#111827]">
      <style>{`::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation-duration:.25s;animation-timing-function:cubic-bezier(.19,1,.22,1)}`}</style>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/hub/cv-builder" })} className="inline-flex items-center gap-1 text-sm font-semibold"><ArrowLeft size={16} /> Voltar</button>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-8 rounded-md border border-transparent px-2 text-sm font-bold hover:border-[#D1D5DB] focus:border-[#1E3A8A] focus:outline-none" />
          <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-[#059669]" />}{saving ? "A guardar..." : savedAt ? `Guardado às ${new Date(savedAt).toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })}` : "Por guardar"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigator.clipboard?.writeText(`https://giseveral.com/hub/cv-builder/${id}`)} className="inline-flex items-center gap-1 rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-bold"><Share2 size={14} /> Partilhar</button>
          <button onClick={downloadPdf} className="inline-flex items-center gap-1 rounded-md bg-[#1E3A8A] px-3 py-1.5 text-xs font-bold text-white"><Download size={14} /> Descarregar PDF</button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <EditorPanel data={data} setData={setData} save={save} />
        <section className="flex min-w-0 flex-1 bg-[#F0F0F0]">
          {templatesOpen && <TemplateSidebar settings={settings} setSettings={setSettings} />}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#D1D5DB] bg-white px-3">
              <button onClick={() => setTemplatesOpen((v) => !v)} className="rounded-md border border-[#D1D5DB] px-2 py-1 text-xs font-bold">Modelos</button>
              <div className="relative">
                <button onClick={() => setColorOpen((v) => !v)} className="flex items-center gap-2 rounded-md border border-[#D1D5DB] px-2 py-1 text-xs font-bold"><span className="h-4 w-4 rounded" style={{ background: settings.primaryColor }} /> Cor</button>
                {colorOpen && <div className="absolute left-0 top-9 z-20 rounded-lg border border-[#D1D5DB] bg-white p-3 shadow-xl"><HexColorPicker color={settings.primaryColor} onChange={(primaryColor) => setSettings((s) => ({ ...s, primaryColor }))} /></div>}
              </div>
              <select value={settings.fontFamily} onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))} className="rounded-md border border-[#D1D5DB] px-2 py-1 text-xs">{fontOptions.map((f) => <option key={f}>{f}</option>)}</select>
              <label className="text-xs">Tamanho <input type="number" min={10} max={20} value={settings.fontSize} onChange={(e) => setSettings((s) => ({ ...s, fontSize: Number(e.target.value) }))} className="w-14 rounded-md border border-[#D1D5DB] px-1 py-1" /></label>
              <label className="text-xs">Espaçamento <input type="range" min={0} max={4} value={settings.spacing} onChange={(e) => setSettings((s) => ({ ...s, spacing: Number(e.target.value) }))} /></label>
              <button onClick={() => setZoom((z) => Math.max(0.45, z - 0.05))} className="rounded-md border border-[#D1D5DB] px-2 py-1 text-xs font-bold">-</button>
              <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1, z + 0.05))} className="rounded-md border border-[#D1D5DB] px-2 py-1 text-xs font-bold">+</button>
            </div>
            <div className="flex-1 overflow-auto">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "794px" }} className="mx-auto my-5">
                <div id="cv-preview-a4" className="shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  <Preview data={data} settings={settings} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Preview({ data, settings }: { data: CvDataV2; settings: CvSettings }) {
  if (settings.template === "modern") return <ModernTemplate data={data} settings={settings} />;
  if (settings.template === "professional") return <ProfessionalTemplate data={data} settings={settings} />;
  if (settings.template === "creative") return <CreativeTemplate data={data} settings={settings} />;
  return <ClassicTemplate data={data} settings={settings} />;
}

function TemplateSidebar({ settings, setSettings }: { settings: CvSettings; setSettings: (fn: (s: CvSettings) => CvSettings) => void }) {
  return (
    <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-[#D1D5DB] bg-white p-3">
      {templates.map((tpl) => (
        <button key={tpl.id} onClick={() => setSettings((s) => ({ ...s, template: tpl.id }))} className={`mb-3 w-full rounded-md border p-2 text-left ${settings.template === tpl.id ? "border-[#2563EB]" : "border-[#E5E7EB]"}`}>
          <div className="aspect-[210/297] bg-[#F3F4F6] p-2">
            <div className="h-full bg-white shadow-sm">
              <div className="h-6" style={{ background: tpl.id === "professional" ? "#ffffff" : settings.primaryColor }} />
              <div className="space-y-1 p-2"><div className="h-2 w-2/3 bg-[#D1D5DB]" /><div className="h-2 w-full bg-[#E5E7EB]" /><div className="h-2 w-4/5 bg-[#E5E7EB]" /></div>
            </div>
          </div>
          <div className="mt-2 text-xs font-bold">{tpl.name}</div>
        </button>
      ))}
    </aside>
  );
}

function EditorPanel({ data, setData, save }: { data: CvDataV2; setData: (data: CvDataV2) => void; save: () => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  function onSectionDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.sections.findIndex((x) => x.key === active.id);
    const newIndex = data.sections.findIndex((x) => x.key === over.id);
    setData({ ...data, sections: arrayMove(data.sections, oldIndex, newIndex) });
  }
  const update = (patch: Partial<CvDataV2>) => setData({ ...data, ...patch });
  const toggle = (key: SectionKey, field: "visible" | "enabled") =>
    update({ sections: data.sections.map((s) => (s.key === key ? { ...s, [field]: !s[field] } : s)) });

  return (
    <aside className="w-[40%] min-w-[390px] overflow-y-auto border-r border-[#D1D5DB] bg-white">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDrag}>
        <SortableContext items={data.sections.map((s) => s.key)} strategy={verticalListSortingStrategy}>
          {data.sections.map((section) => (
            <SectionAccordion key={section.key} sectionKey={section.key} title={section.title} count={countFor(data, section.key)} visible={section.visible} onToggleVisible={() => toggle(section.key, "visible")}>
              {section.key === "contact" && <ContactForm data={data} update={update} />}
              {section.key === "profile" && <ProfileForm data={data} update={update} />}
              {section.key === "experience" && <ExperienceForm data={data} update={update} />}
              {section.key === "education" && <EducationForm data={data} update={update} />}
              {section.key === "skills" && <SkillsForm data={data} update={update} />}
              {section.key === "languages" && <LanguagesForm data={data} update={update} />}
              {section.key === "projects" && <ProjectsForm label="Projectos" enabled={section.enabled} onEnable={() => toggle(section.key, "enabled")} items={data.projects} setItems={(projects) => update({ projects })} />}
              {section.key === "certifications" && <ProjectsForm label="Certificacoes" enabled={section.enabled} onEnable={() => toggle(section.key, "enabled")} items={data.certifications} setItems={(certifications) => update({ certifications })} />}
            </SectionAccordion>
          ))}
        </SortableContext>
      </DndContext>
      <div className="sticky bottom-0 border-t border-[#E5E7EB] bg-white p-4">
        <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-bold text-white"><Save size={16} /> Salvar</button>
      </div>
    </aside>
  );
}

function countFor(data: CvDataV2, key: SectionKey) {
  if (key === "experience") return data.experiences.length;
  if (key === "education") return data.education.length;
  if (key === "skills") return data.skills.length;
  if (key === "languages") return data.languages.length;
  if (key === "projects") return data.projects.length;
  if (key === "certifications") return data.certifications.length;
  return 1;
}

function SectionAccordion({ sectionKey, title, count, visible, onToggleVisible, children }: { sectionKey: SectionKey; title: string; count: number; visible: boolean; onToggleVisible: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(sectionKey === "contact");
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sectionKey });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="border-b border-[#E5E7EB]">
      <div className="flex items-center gap-2 px-4 py-3">
        <button {...attributes} {...listeners} className="cursor-grab text-[#9CA3AF]"><GripVertical size={16} /></button>
        <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-2 text-left text-sm font-bold"><ChevronDown size={15} className={open ? "" : "-rotate-90"} />{title}<span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] text-[#1D4ED8]">{count}</span></button>
        <button onClick={onToggleVisible} className="text-[#6B7280]">{visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
      </div>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <label className="block text-xs font-semibold text-[#374151]">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-md border border-[#D1D5DB] px-3 py-2 text-sm font-normal focus:border-[#1E3A8A] focus:outline-none" /></label>;
}

function Area({ label, value, onChange, rows = 4, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <label className="block text-xs font-semibold text-[#374151]">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="mt-1 w-full resize-none rounded-md border border-[#D1D5DB] px-3 py-2 text-sm font-normal focus:border-[#1E3A8A] focus:outline-none" /></label>;
}

function ContactForm({ data, update }: { data: CvDataV2; update: (patch: Partial<CvDataV2>) => void }) {
  const [more, setMore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  function photo(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ photo: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  }
  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={() => fileRef.current?.click()} className="h-20 w-20 overflow-hidden rounded-full border border-[#D1D5DB] bg-[#F3F4F6] text-xs font-bold text-[#6B7280]">{data.photo ? <img src={data.photo} className="h-full w-full object-cover" /> : "Foto"}</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => photo(e.target.files?.[0])} />
        <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={data.roundPhoto} onChange={(e) => update({ roundPhoto: e.target.checked })} /> Foto redonda</label>
      </div>
      <div className="grid grid-cols-2 gap-3"><Field label="Nome" value={data.firstName} onChange={(firstName) => update({ firstName })} /><Field label="Apelido" value={data.lastName} onChange={(lastName) => update({ lastName })} /></div>
      <Field label="Emprego pretendido / Cargo" value={data.targetRole} onChange={(targetRole) => update({ targetRole })} />
      <div className="grid grid-cols-2 gap-3"><Field label="Email" value={data.email} onChange={(email) => update({ email })} /><Field label="Telefone" value={data.phone} onChange={(phone) => update({ phone })} /></div>
      <Field label="Endereco" value={data.address} onChange={(address) => update({ address })} />
      <div className="grid grid-cols-2 gap-3"><Field label="Codigo postal" value={data.postalCode} onChange={(postalCode) => update({ postalCode })} /><Field label="Cidade" value={data.city} onChange={(city) => update({ city })} /></div>
      <div className="grid grid-cols-2 gap-3"><Field label="Nacionalidade" value={data.nationality} onChange={(nationality) => update({ nationality })} /><Field label="Carta de conducao" value={data.drivingLicense} onChange={(drivingLicense) => update({ drivingLicense })} /></div>
      <button onClick={() => setMore((v) => !v)} className="text-xs font-bold text-[#1E3A8A]">Exibir campos adicionais</button>
      {more && <div className="grid grid-cols-2 gap-3"><Field label="LinkedIn" value={data.linkedin} onChange={(linkedin) => update({ linkedin })} /><Field label="Website" value={data.website} onChange={(website) => update({ website })} /><Field label="Data nascimento" value={data.birthDate} onChange={(birthDate) => update({ birthDate })} /><Field label="GitHub" value={data.github} onChange={(github) => update({ github })} /></div>}
    </>
  );
}

function ProfileForm({ data, update }: { data: CvDataV2; update: (patch: Partial<CvDataV2>) => void }) {
  const [loading, setLoading] = useState(false);
  async function improve() {
    setLoading(true);
    try {
      const text = await callGemini("cv_suggest", `Melhora este perfil profissional em portugues de Mocambique, tornando-o mais impactante e profissional: ${data.profile}`);
      update({ profile: text.trim() });
    } finally {
      setLoading(false);
    }
  }
  return <>
    <Area label="Perfil profissional" value={data.profile} onChange={(profile) => update({ profile: profile.slice(0, 500) })} rows={5} placeholder="Descreve a tua experiência..." />
    <div className="flex items-center justify-between"><button onClick={improve} disabled={loading} className="rounded-md border border-[#D1D5DB] px-3 py-2 text-xs font-bold">{loading ? "A melhorar..." : "✨ Melhorar com IA"}</button><span className="text-xs text-[#6B7280]">{data.profile.length}/500 caracteres</span></div>
  </>;
}

function ExperienceForm({ data, update }: { data: CvDataV2; update: (patch: Partial<CvDataV2>) => void }) {
  const set = (items: CvExperience[]) => update({ experiences: items });
  return <List items={data.experiences} setItems={set} add={() => set([...data.experiences, { id: uid("exp"), role: "", company: "", location: "", start: "", end: "", current: false, description: "" }])} render={(exp, i) => <ExperienceItem exp={exp} update={(patch) => set(data.experiences.map((x, n) => n === i ? { ...x, ...patch } : x))} remove={() => set(data.experiences.filter((_, n) => n !== i))} />} label="+ Adicionar experiência" />;
}

function ExperienceItem({ exp, update, remove }: { exp: CvExperience; update: (p: Partial<CvExperience>) => void; remove: () => void }) {
  const [loading, setLoading] = useState(false);
  async function improve() {
    setLoading(true);
    try {
      const text = await callGemini("cv_suggest", `Melhora esta descricao de experiencia usando verbos de accao e resultados concretos: ${exp.description}`);
      update({ description: text.trim() });
    } finally { setLoading(false); }
  }
  return <Card title={exp.role || exp.company || "Experiencia"} remove={remove}><div className="grid grid-cols-2 gap-2"><Field label="Cargo" value={exp.role} onChange={(role) => update({ role })} /><Field label="Empresa" value={exp.company} onChange={(company) => update({ company })} /></div><Field label="Localizacao" value={exp.location} onChange={(location) => update({ location })} /><div className="grid grid-cols-2 gap-2"><Field label="Data inicio" value={exp.start} onChange={(start) => update({ start })} /><Field label="Data fim" value={exp.end} onChange={(end) => update({ end })} /></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={exp.current} onChange={(e) => update({ current: e.target.checked })} /> Emprego actual</label><Area label="Descricao" value={exp.description} onChange={(description) => update({ description })} /><button onClick={improve} className="rounded-md border border-[#D1D5DB] px-3 py-2 text-xs font-bold">{loading ? "A melhorar..." : "✨ Melhorar"}</button></Card>;
}

function EducationForm({ data, update }: { data: CvDataV2; update: (patch: Partial<CvDataV2>) => void }) {
  const set = (items: CvEducation[]) => update({ education: items });
  return <List items={data.education} setItems={set} add={() => set([...data.education, { id: uid("edu"), course: "", institution: "", location: "", start: "", end: "", description: "" }])} render={(edu, i) => <Card title={edu.course || "Educacao"} remove={() => set(data.education.filter((_, n) => n !== i))}><Field label="Curso" value={edu.course} onChange={(course) => set(data.education.map((x, n) => n === i ? { ...x, course } : x))} /><Field label="Instituicao" value={edu.institution} onChange={(institution) => set(data.education.map((x, n) => n === i ? { ...x, institution } : x))} /><Field label="Localizacao" value={edu.location} onChange={(location) => set(data.education.map((x, n) => n === i ? { ...x, location } : x))} /><div className="grid grid-cols-2 gap-2"><Field label="Inicio" value={edu.start} onChange={(start) => set(data.education.map((x, n) => n === i ? { ...x, start } : x))} /><Field label="Fim" value={edu.end} onChange={(end) => set(data.education.map((x, n) => n === i ? { ...x, end } : x))} /></div><Area label="Descricao" value={edu.description} onChange={(description) => set(data.education.map((x, n) => n === i ? { ...x, description } : x))} /></Card>} label="+ Adicionar educação" />;
}

function SkillsForm({ data, update }: { data: CvDataV2; update: (patch: Partial<CvDataV2>) => void }) {
  const [loading, setLoading] = useState(false);
  async function suggest() {
    setLoading(true);
    try {
      const text = await callGemini("cv_suggest", `Lista 8 competencias mais valorizadas para ${data.targetRole} em Mocambique. Retorna apenas JSON: {skills: ['...', '...']}`);
      const parsed = JSON.parse(text.replace(/```json|```/g, ""));
      update({ skills: parsed.skills.slice(0, 8).map((name: string) => ({ id: uid("skill"), name, level: 4 })) });
    } catch {
      toast.error("Nao foi possivel ler as competencias sugeridas");
    } finally { setLoading(false); }
  }
  const set = (skills: CvSkill[]) => update({ skills });
  return <><button onClick={suggest} className="rounded-md border border-[#D1D5DB] px-3 py-2 text-xs font-bold">{loading ? "A sugerir..." : `✨ Sugerir para ${data.targetRole || "cargo"}`}</button>{data.skills.map((skill, i) => <Card key={skill.id} title={skill.name || "Competencia"} remove={() => set(data.skills.filter((_, n) => n !== i))}><Field label="Nome" value={skill.name} onChange={(name) => set(data.skills.map((x, n) => n === i ? { ...x, name } : x))} /><label className="text-xs font-semibold">Nivel {skill.level}<input type="range" min={1} max={5} value={skill.level} onChange={(e) => set(data.skills.map((x, n) => n === i ? { ...x, level: Number(e.target.value) as CvSkill["level"] } : x))} className="w-full" /></label></Card>)}<button onClick={() => set([...data.skills, { id: uid("skill"), name: "", level: 3 }])} className="rounded-md border border-dashed border-[#9CA3AF] py-2 text-xs font-bold">+ Adicionar</button></>;
}

function LanguagesForm({ data, update }: { data: CvDataV2; update: (patch: Partial<CvDataV2>) => void }) {
  const set = (languages: CvLanguage[]) => update({ languages });
  const levels = ["Nativo", "Fluente", "Avançado", "Intermédio", "Básico"];
  return <>{data.languages.map((lang, i) => <Card key={lang.id} title={lang.name || "Idioma"} remove={() => set(data.languages.filter((_, n) => n !== i))}><Field label="Nome" value={lang.name} onChange={(name) => set(data.languages.map((x, n) => n === i ? { ...x, name } : x))} /><select value={lang.level} onChange={(e) => set(data.languages.map((x, n) => n === i ? { ...x, level: e.target.value } : x))} className="rounded-md border border-[#D1D5DB] px-3 py-2 text-sm">{levels.map((l) => <option key={l}>{l}</option>)}</select></Card>)}<button onClick={() => set([...data.languages, { id: uid("lang"), name: "", level: "Intermédio" }])} className="rounded-md border border-dashed border-[#9CA3AF] py-2 text-xs font-bold">+ Adicionar</button></>;
}

function ProjectsForm({ label, enabled, onEnable, items, setItems }: { label: string; enabled: boolean; onEnable: () => void; items: CvProject[]; setItems: (items: CvProject[]) => void }) {
  if (!enabled) return <button onClick={onEnable} className="rounded-md bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white">Activar {label}</button>;
  return <>{items.map((item, i) => <Card key={item.id} title={item.title || label} remove={() => setItems(items.filter((_, n) => n !== i))}><Field label="Titulo" value={item.title} onChange={(title) => setItems(items.map((x, n) => n === i ? { ...x, title } : x))} /><Field label="Entidade" value={item.issuer} onChange={(issuer) => setItems(items.map((x, n) => n === i ? { ...x, issuer } : x))} /><Field label="Data" value={item.date} onChange={(date) => setItems(items.map((x, n) => n === i ? { ...x, date } : x))} /><Area label="Descricao" value={item.description} onChange={(description) => setItems(items.map((x, n) => n === i ? { ...x, description } : x))} /></Card>)}<button onClick={() => setItems([...items, { id: uid("project"), title: "", issuer: "", date: "", description: "" }])} className="rounded-md border border-dashed border-[#9CA3AF] py-2 text-xs font-bold">+ Adicionar</button></>;
}

function List<T extends { id: string }>({ items, setItems, add, render, label }: { items: T[]; setItems: (items: T[]) => void; add: () => void; render: (item: T, index: number) => React.ReactNode; label: string }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => { if (!over || active.id === over.id) return; const oldIndex = items.findIndex((x) => x.id === active.id); const newIndex = items.findIndex((x) => x.id === over.id); setItems(arrayMove(items, oldIndex, newIndex)); }}><SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>{items.map((item, index) => <SortableListItem key={item.id} id={item.id}>{render(item, index)}</SortableListItem>)}</SortableContext><button onClick={add} className="w-full rounded-md border border-dashed border-[#9CA3AF] py-2 text-xs font-bold">{label}</button></DndContext>;
}

function SortableListItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="relative">
      <button {...attributes} {...listeners} className="absolute right-9 top-3 z-10 cursor-grab text-[#9CA3AF]" aria-label="Arrastar">
        <GripVertical size={14} />
      </button>
      {children}
    </div>
  );
}

function Card({ title, remove, children }: { title: string; remove: () => void; children: React.ReactNode }) {
  return <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3"><div className="mb-3 flex items-center justify-between"><strong className="text-xs">{title}</strong><button onClick={remove} className="text-[#B91C1C]"><Trash2 size={14} /></button></div><div className="space-y-3">{children}</div></div>;
}

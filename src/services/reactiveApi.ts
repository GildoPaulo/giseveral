import type { CvData } from "@/components/cv-builder";

const API_BASE = "https://rxresu.me/api/v1";
const API_KEY = import.meta.env.VITE_REACTIVE_API_KEY as string | undefined;

export interface APITemplate {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  isPremium?: boolean;
}

function headers() {
  return {
    Authorization: `Bearer ${API_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function fetchAPITemplates(): Promise<APITemplate[]> {
  if (!API_KEY) throw new Error("VITE_REACTIVE_API_KEY não configurada.");
  const res = await fetch(`${API_BASE}/templates`, { headers: headers() });
  if (!res.ok) throw new Error(`API retornou ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

export async function generateAPIPreview(data: CvData, templateId: string): Promise<string> {
  if (!API_KEY) throw new Error("VITE_REACTIVE_API_KEY não configurada.");
  const res = await fetch(`${API_BASE}/resume/preview`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: convertToAPIFormat(data),
      template: templateId,
      settings: {
        primaryColor: data.design.primaryColor,
        backgroundColor: data.design.backgroundColor,
        fontFamily: data.design.fontFamily,
      },
    }),
  });
  if (!res.ok) throw new Error(`API retornou ${res.status}`);
  return res.text();
}

export async function generateAPIPdf(data: CvData, templateId: string): Promise<Blob> {
  if (!API_KEY) throw new Error("VITE_REACTIVE_API_KEY não configurada.");
  const res = await fetch(`${API_BASE}/resume/pdf`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: convertToAPIFormat(data),
      template: templateId,
      settings: {
        primaryColor: data.design.primaryColor,
      },
    }),
  });
  if (!res.ok) throw new Error(`API retornou ${res.status}`);
  return res.blob();
}

function convertToAPIFormat(data: CvData) {
  return {
    basics: {
      name: data.personal.nome,
      headline: data.personal.titulo,
      email: data.personal.email,
      phone: data.personal.telefone,
      location: data.personal.localizacao,
      url: { href: data.personal.website || data.personal.linkedin },
      summary: data.objetivo,
      picture: { url: data.personal.foto },
    },
    sections: {
      work: {
        name: data.sections.experiencia?.title ?? "Experience",
        visible: data.sections.experiencia?.visible ?? true,
        items: data.experiencia.map(e => ({
          company: e.empresa,
          position: e.cargo,
          location: e.localizacao,
          date: `${e.inicio} – ${e.atual ? "Present" : e.fim}`,
          summary: e.descricao,
        })),
      },
      education: {
        name: data.sections.educacao?.title ?? "Education",
        visible: data.sections.educacao?.visible ?? true,
        items: data.educacao.map(e => ({
          institution: e.instituicao,
          studyType: e.grau,
          area: e.curso,
          date: `${e.anoInicio} – ${e.anoFim || "Present"}`,
          score: e.nota,
          summary: e.descricao,
        })),
      },
      skills: {
        name: data.sections.skills?.title ?? "Skills",
        visible: data.sections.skills?.visible ?? true,
        items: data.skills.map(s => ({
          name: s.nome,
          level: s.nivel,
        })),
      },
      languages: {
        name: data.sections.idiomas?.title ?? "Languages",
        visible: data.sections.idiomas?.visible ?? true,
        items: data.idiomas.map(i => ({
          name: i.idioma,
          description: i.nivel,
        })),
      },
      projects: {
        name: data.sections.projetos?.title ?? "Projects",
        visible: data.sections.projetos?.visible ?? true,
        items: data.projetos.map(p => ({
          name: p.nome,
          description: p.descricao,
          url: { href: p.url },
          keywords: p.tecnologias.split(",").map(t => t.trim()).filter(Boolean),
        })),
      },
      certifications: {
        name: data.sections.certificacoes?.title ?? "Certifications",
        visible: data.sections.certificacoes?.visible ?? true,
        items: data.certificacoes.map(c => ({
          name: c.nome,
          issuer: c.emissor,
          date: c.data,
          url: { href: c.url },
        })),
      },
    },
    metadata: {
      template: "azurill",
      typography: { font: { family: data.design.fontFamily } },
      theme: { primary: data.design.primaryColor, background: data.design.backgroundColor, text: data.design.textColor },
    },
  };
}

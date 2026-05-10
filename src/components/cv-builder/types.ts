export type SkillLevel = "Básico" | "Intermédio" | "Avançado" | "Expert";
export type CvTemplate = "modern" | "creative" | "ats";

export interface CvPersonal {
  nome: string;
  titulo: string;
  email: string;
  telefone: string;
  localizacao: string;
  linkedin: string;
  objetivo: string;
}

export interface CvEducacao {
  id: string;
  grau: string;
  instituicao: string;
  curso: string;
  anoInicio: string;
  anoFim: string;
  nota: string;
}

export interface CvExperiencia {
  id: string;
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  atual: boolean;
  descricao: string;
}

export interface CvSkill {
  id: string;
  nome: string;
  nivel: SkillLevel;
}

export interface CvIdioma {
  id: string;
  idioma: string;
  nivel: string;
}

export interface CvData {
  personal: CvPersonal;
  educacao: CvEducacao[];
  experiencia: CvExperiencia[];
  skills: CvSkill[];
  idiomas: CvIdioma[];
}

export const SKILL_PCT: Record<SkillLevel, number> = {
  Básico: 25,
  Intermédio: 50,
  Avançado: 75,
  Expert: 100,
};

export const TEMPLATE_META = [
  {
    id: "modern" as CvTemplate,
    label: "Moderno",
    desc: "Sidebar escura, barras de competências",
    accent: "#1e2a4a",
  },
  {
    id: "creative" as CvTemplate,
    label: "Criativo",
    desc: "Cabeçalho bold, duas colunas elegantes",
    accent: "#0f4c81",
  },
  {
    id: "ats" as CvTemplate,
    label: "ATS Clean",
    desc: "Coluna única, legível por recrutadores",
    accent: "#374151",
  },
] as const;

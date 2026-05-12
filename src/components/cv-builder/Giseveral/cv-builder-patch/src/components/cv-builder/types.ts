export type SkillLevel = "Básico" | "Intermédio" | "Avançado" | "Expert";
export type CvTemplate = "azurill" | "bronzor" | "onyx" | "ditto" | "pikachu" | "modern";
export type CvSectionKey = "experiencia" | "educacao" | "skills" | "idiomas" | "projetos" | "certificacoes";

export interface CvDesign {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  /** Base body font size in px. Templates scale all sizes proportionally from 14. */
  fontSize: number;
}

/** Discrete font-size options exposed in the TopBar selector. */
export const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32] as const;
export type CvFontSize = typeof FONT_SIZE_OPTIONS[number];

export interface CvPersonal {
  nome: string;
  titulo: string;
  email: string;
  telefone: string;
  localizacao: string;
  linkedin: string;
  website: string;
  foto: string;
  /** @deprecated use CvData.objetivo instead — kept for PDF template compat */
  objetivo?: string;
}

export interface CvEducacao {
  id: string;
  grau: string;
  instituicao: string;
  curso: string;
  anoInicio: string;
  anoFim: string;
  nota: string;
  descricao: string;
}

export interface CvExperiencia {
  id: string;
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  atual: boolean;
  descricao: string;
  localizacao: string;
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

export interface CvProjeto {
  id: string;
  nome: string;
  descricao: string;
  url: string;
  tecnologias: string;
}

export interface CvCertificacao {
  id: string;
  nome: string;
  emissor: string;
  data: string;
  url: string;
}

export interface CvSection {
  visible: boolean;
  title: string;
  order: number;
}

export interface CvData {
  personal: CvPersonal;
  objetivo: string;
  experiencia: CvExperiencia[];
  educacao: CvEducacao[];
  skills: CvSkill[];
  idiomas: CvIdioma[];
  projetos: CvProjeto[];
  certificacoes: CvCertificacao[];
  design: CvDesign;
  sections: Record<CvSectionKey, CvSection>;
}

export const SKILL_PCT: Record<SkillLevel, number> = {
  Básico: 25,
  Intermédio: 50,
  Avançado: 75,
  Expert: 100,
};

export const TEMPLATE_META: {
  id: CvTemplate;
  label: string;
  desc: string;
  accent: string;
  preview: string;
  tag?: string;
}[] = [
  { id: "azurill", label: "Azurill", desc: "Header centrado, duas colunas elegantes", accent: "#1d4ed8", preview: "/templates/azurill.jpg" },
  { id: "bronzor", label: "Bronzor", desc: "Layout limpo, secções fluidas", accent: "#7c3aed", preview: "/templates/bronzor.jpg" },
  { id: "onyx", label: "Onyx", desc: "Sidebar escura, estilo executivo", accent: "#0f172a", preview: "/templates/onyx.jpg" },
  { id: "pikachu", label: "Pikachu", desc: "Header colorido, impacto visual", accent: "#b45309", preview: "/templates/pikachu.jpg" },
  { id: "ditto", label: "Ditto ATS", desc: "Coluna única, ATS-friendly", accent: "#374151", preview: "/templates/ditto.jpg", tag: "ATS" },
  { id: "modern", label: "Modern", desc: "Contemporâneo, barras de skills", accent: "#1e2a4a", preview: "/templates/kakuna.jpg" },
];

export const DEFAULT_DESIGN: CvDesign = {
  primaryColor: "#1d4ed8",
  textColor: "#111827",
  backgroundColor: "#ffffff",
  fontFamily: "Inter",
  fontSize: 14,
};

export const DEFAULT_CV_DATA: CvData = {
  personal: {
    nome: "Seu Nome Completo",
    titulo: "Título Profissional",
    email: "email@exemplo.com",
    telefone: "+351 900 000 000",
    localizacao: "Lisboa, Portugal",
    linkedin: "linkedin.com/in/seunome",
    website: "",
    foto: "",
  },
  objetivo:
    "Profissional dedicado com sólida experiência na área. Orientado para resultados e comprometido com a excelência em cada projeto.",
  experiencia: [
    {
      id: "exp1",
      empresa: "Empresa Exemplo",
      cargo: "Cargo Principal",
      inicio: "Jan 2022",
      fim: "Presente",
      atual: true,
      localizacao: "Lisboa",
      descricao:
        "Responsável pelo desenvolvimento e manutenção de soluções. Liderou equipa de 5 pessoas e aumentou a produtividade em 30%.",
    },
  ],
  educacao: [
    {
      id: "edu1",
      grau: "Licenciatura",
      instituicao: "Universidade de Lisboa",
      curso: "Engenharia Informática",
      anoInicio: "2015",
      anoFim: "2019",
      nota: "16/20",
      descricao: "",
    },
  ],
  skills: [
    { id: "sk1", nome: "JavaScript", nivel: "Expert" },
    { id: "sk2", nome: "TypeScript", nivel: "Avançado" },
    { id: "sk3", nome: "React", nivel: "Avançado" },
    { id: "sk4", nome: "Node.js", nivel: "Intermédio" },
  ],
  idiomas: [
    { id: "id1", idioma: "Português", nivel: "Nativo" },
    { id: "id2", idioma: "Inglês", nivel: "C1 – Avançado" },
  ],
  projetos: [],
  certificacoes: [],
  design: DEFAULT_DESIGN,
  sections: {
    experiencia: { visible: true, title: "Experiência Profissional", order: 0 },
    educacao: { visible: true, title: "Educação", order: 1 },
    skills: { visible: true, title: "Competências", order: 2 },
    idiomas: { visible: true, title: "Idiomas", order: 3 },
    projetos: { visible: true, title: "Projetos", order: 4 },
    certificacoes: { visible: true, title: "Certificações", order: 5 },
  },
};

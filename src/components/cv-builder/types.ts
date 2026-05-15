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
  /** First name vs. surname. Kept legacy `nome` as the full display name. */
  apelido?: string;
  titulo: string;
  email: string;
  telefone: string;
  localizacao: string;
  endereco?: string;
  codigoPostal?: string;
  cidade?: string;
  pais?: string;
  nacionalidade?: string;
  linkedin: string;
  website: string;
  portfolio?: string;
  cartaConducao?: boolean;
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
    nome: "Maria Joana",
    apelido: "Santos",
    titulo: "Engenheira de Software Senior",
    email: "maria.santos@email.com",
    telefone: "+258 84 123 4567",
    localizacao: "Maputo, Moçambique",
    endereco: "Av. 25 de Setembro, 123",
    codigoPostal: "1100",
    cidade: "Maputo",
    pais: "Moçambique",
    nacionalidade: "Moçambicana",
    linkedin: "linkedin.com/in/mariasantos",
    website: "mariasantos.dev",
    portfolio: "github.com/mariasantos",
    cartaConducao: true,
    foto: "",
  },
  objetivo:
    "Engenheira de Software com 6+ anos de experiência em desenvolvimento full-stack. Especialista em React, Node.js e cloud computing, com foco em liderar equipas técnicas e criar soluções escaláveis para a comunidade moçambicana.",
  experiencia: [
    {
      id: "exp1",
      empresa: "TechCorp Moçambique",
      cargo: "Engenheira de Software Senior",
      inicio: "Jan 2022",
      fim: "Presente",
      atual: true,
      localizacao: "Maputo",
      descricao:
        "Responsável pelo desenvolvimento e manutenção de soluções full-stack usando React, Node.js e PostgreSQL. Liderou equipa de 5 pessoas, aumentou a produtividade em 30%, implementou pipeline CI/CD que reduziu o tempo de deploy em 40% e migrou uma aplicação legacy para microserviços em Kubernetes.",
    },
    {
      id: "exp2",
      empresa: "StartUp Innovations",
      cargo: "Desenvolvedora Full-Stack",
      inicio: "Mar 2019",
      fim: "Dez 2021",
      atual: false,
      localizacao: "Maputo",
      descricao:
        "Desenvolveu e manteve 3 aplicações web para clientes internacionais. Colaborou com designers UX para melhorar a experiência do utilizador, resultando num aumento de 25% na retenção e maior rapidez na entrega de novas funcionalidades.",
    },
  ],
  educacao: [
    {
      id: "edu1",
      grau: "Mestrado em Engenharia Informática",
      instituicao: "Universidade Eduardo Mondlane",
      curso: "Sistemas Distribuídos",
      anoInicio: "2018",
      anoFim: "2020",
      nota: "18/20",
      descricao: "Investigação aplicada em arquitetura de microserviços e sistemas escaláveis.",
    },
    {
      id: "edu2",
      grau: "Licenciatura em Ciência da Computação",
      instituicao: "Universidade Pedagógica",
      curso: "Desenvolvimento de Software",
      anoInicio: "2014",
      anoFim: "2018",
      nota: "16/20",
      descricao: "Base sólida em algoritmos, bases de dados e engenharia de software.",
    },
  ],
  skills: [
    { id: "sk1", nome: "JavaScript/TypeScript", nivel: "Expert" },
    { id: "sk2", nome: "React/Next.js", nivel: "Expert" },
    { id: "sk3", nome: "Node.js", nivel: "Avançado" },
    { id: "sk4", nome: "Python", nivel: "Avançado" },
    { id: "sk5", nome: "Docker/Kubernetes", nivel: "Intermédio" },
    { id: "sk6", nome: "AWS/Azure", nivel: "Intermédio" },
  ],
  idiomas: [
    { id: "id1", idioma: "Português", nivel: "Nativo" },
    { id: "id2", idioma: "Inglês", nivel: "Fluente (C2)" },
    { id: "id3", idioma: "Espanhol", nivel: "Intermédio (B1)" },
  ],
  projetos: [
    {
      id: "proj1",
      nome: "Plataforma de E-learning",
      descricao: "Sistema modular para aulas online, pagamentos e acompanhamento de progresso de estudantes.",
      url: "mariasantos.dev/e-learning",
      tecnologias: "React, Node.js, PostgreSQL, Docker",
    },
  ],
  certificacoes: [
    {
      id: "cert1",
      nome: "AWS Certified Cloud Practitioner",
      emissor: "Amazon Web Services",
      data: "2023",
      url: "",
    },
  ],
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

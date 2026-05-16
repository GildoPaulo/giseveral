export type CvTemplateId = "classic" | "modern" | "professional" | "creative";

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type SectionKey =
  | "contact"
  | "profile"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "projects"
  | "certifications";

export type SectionMeta = {
  key: SectionKey;
  title: string;
  visible: boolean;
  enabled: boolean;
};

export type CvExperience = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  description: string;
};

export type CvEducation = {
  id: string;
  course: string;
  institution: string;
  location: string;
  start: string;
  end: string;
  description: string;
};

export type CvSkill = {
  id: string;
  name: string;
  level: SkillLevel;
};

export type CvLanguage = {
  id: string;
  name: string;
  level: string;
};

export type CvProject = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
};

export type CvDataV2 = {
  photo: string;
  roundPhoto: boolean;
  firstName: string;
  lastName: string;
  targetRole: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  nationality: string;
  drivingLicense: string;
  linkedin: string;
  website: string;
  birthDate: string;
  github: string;
  profile: string;
  experiences: CvExperience[];
  education: CvEducation[];
  skills: CvSkill[];
  languages: CvLanguage[];
  projects: CvProject[];
  certifications: CvProject[];
  sections: SectionMeta[];
};

export type CvSettings = {
  template: CvTemplateId;
  primaryColor: string;
  fontFamily: string;
  fontSize: number;
  spacing: number;
};

export type UserCvRow = {
  id: string;
  user_id?: string;
  name: string;
  cv_data: CvDataV2;
  template: CvTemplateId;
  primary_color: string;
  font_family: string;
  is_public?: boolean;
  public_slug?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const templates: { id: CvTemplateId; name: string; description: string }[] = [
  { id: "classic", name: "Classico", description: "Sidebar azul, estilo Eduardo Gomane" },
  { id: "modern", name: "Moderno", description: "Uma coluna limpa com acento lateral" },
  { id: "professional", name: "Profissional", description: "Formal, centralizado e discreto" },
  { id: "creative", name: "Criativo", description: "Cabecalho colorido e corpo em duas colunas" },
];

export const fontOptions = ["Inter", "Arial", "Calibri", "Georgia", "Times New Roman"];

export const defaultCvData: CvDataV2 = {
  photo: "",
  roundPhoto: true,
  firstName: "Eduardo",
  lastName: "Gomane",
  targetRole: "Gestor Administrativo",
  email: "eduardo@giseveral.com",
  phone: "+258 84 000 0000",
  address: "Av. Julius Nyerere",
  postalCode: "1100",
  city: "Maputo",
  nationality: "Mocambicana",
  drivingLicense: "Categoria B",
  linkedin: "linkedin.com/in/eduardogomane",
  website: "giseveral.com",
  birthDate: "",
  github: "",
  profile:
    "Profissional organizado, com experiencia em atendimento, gestao documental e coordenacao de processos administrativos. Focado em resultados, comunicacao clara e melhoria continua.",
  experiences: [
    {
      id: "exp-1",
      role: "Assistente Administrativo",
      company: "Giseveral",
      location: "Maputo",
      start: "Jan 2022",
      end: "Presente",
      current: true,
      description:
        "Coordenei processos de atendimento ao cliente, organizei arquivos fisicos e digitais e acompanhei pedidos internos com foco em prazos e qualidade.",
    },
  ],
  education: [
    {
      id: "edu-1",
      course: "Licenciatura em Gestao",
      institution: "Universidade Eduardo Mondlane",
      location: "Maputo",
      start: "2018",
      end: "2022",
      description: "Formacao em gestao, contabilidade, comunicacao empresarial e analise organizacional.",
    },
  ],
  skills: [
    { id: "skill-1", name: "Atendimento ao cliente", level: 5 },
    { id: "skill-2", name: "Microsoft Office", level: 4 },
    { id: "skill-3", name: "Organizacao documental", level: 4 },
  ],
  languages: [
    { id: "lang-1", name: "Portugues", level: "Nativo" },
    { id: "lang-2", name: "Ingles", level: "Intermedio" },
  ],
  projects: [],
  certifications: [],
  sections: [
    { key: "contact", title: "Informacao de contacto", visible: true, enabled: true },
    { key: "profile", title: "Perfil profissional", visible: true, enabled: true },
    { key: "experience", title: "Experiencia profissional", visible: true, enabled: true },
    { key: "education", title: "Educacao", visible: true, enabled: true },
    { key: "skills", title: "Competencias", visible: true, enabled: true },
    { key: "languages", title: "Idiomas", visible: true, enabled: true },
    { key: "projects", title: "Projectos", visible: true, enabled: false },
    { key: "certifications", title: "Certificacoes", visible: true, enabled: false },
  ],
};

export const defaultSettings: CvSettings = {
  template: "classic",
  primaryColor: "#1E3A8A",
  fontFamily: "Inter",
  fontSize: 14,
  spacing: 1,
};

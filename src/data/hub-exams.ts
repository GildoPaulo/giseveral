export type ExamDifficulty = "Fácil" | "Médio" | "Difícil";

export interface Exam {
  id: string;
  title: string;
  institution: string;
  course: string;
  year: number;
  subjects: string[];
  difficulty: ExamDifficulty;
  description: string;
  featured?: boolean;
  fileUrl?: string;
  solutionUrl?: string;
  processSteps?: string[];
  tips?: string[];
  allowRegistrations?: boolean;
  registrationUrl?: string;
  registrationDeadline?: string;
  registrationFee?: string;
}

export const getExam = (id: string) => EXAMS.find((e) => e.id === id);

export const EXAMS: Exam[] = [
  {
    id: "uem-engenharia-2025",
    title: "Exame de Admissão UEM — Engenharia 2025",
    institution: "Universidade Eduardo Mondlane",
    course: "Engenharia Civil, Informática e Electrotécnica",
    year: 2025,
    subjects: ["Matemática", "Física", "Química"],
    difficulty: "Difícil",
    featured: true,
    description: "Exame de admissão para as carreiras de engenharia da UEM. Cobre matemática avançada (cálculo, álgebra linear), física (mecânica, termodinâmica, electricidade) e química (estequiometria, equilíbrio). O exame tem 60 questões objectivas distribuídas pelas três matérias, com duração de 3 horas. A nota mínima varia entre 14 e 16 dependendo do curso.",
    processSteps: [
      "Inscreva-se no portal da UEM no período indicado (geralmente Maio–Julho)",
      "Pague a taxa de inscrição no Millennium BIM ou Emola",
      "Estude com exames anteriores — foque-se nos últimos 5 anos",
      "Faça pelo menos 3 simulados completos antes do exame",
      "Compare as suas respostas com o gabarito e identifique as fraquezas",
      "Revise as fórmulas essenciais de Matemática e Física na semana anterior",
    ],
    tips: [
      "Matemática vale 40% da nota — priorize álgebra e trigonometria",
      "Os últimos 3 exames repetem padrões de questões — analise-os com cuidado",
      "Leve calculadora científica aprovada pela UEM no dia do exame",
      "Gestão de tempo: 3 minutos por questão, volte às difíceis no final",
    ],
    allowRegistrations: true,
    registrationUrl: "https://www.uem.ac.mz/",
    registrationDeadline: "2026-07-15",
    registrationFee: "1.500 MZN",
  },
  {
    id: "uem-medicina-2025",
    title: "Exame de Admissão UEM — Medicina 2025",
    institution: "Universidade Eduardo Mondlane",
    course: "Medicina e Farmácia",
    year: 2025,
    subjects: ["Biologia", "Química", "Português"],
    difficulty: "Difícil",
    featured: true,
    description: "O exame de admissão ao curso de Medicina da UEM é um dos mais competitivos do país. Avalia biologia celular e molecular, anatomia básica, química orgânica e inorgânica, além de compreensão textual em português. A concorrência é alta — só 5% dos candidatos são aprovados.",
    processSteps: [
      "Confirme os requisitos de admissão no site da Faculdade de Medicina da UEM",
      "Estude Biologia com foco em células, genética e fisiologia",
      "Revise Química Orgânica (reacções, grupos funcionais) e inorgânica",
      "Treine leitura e interpretação de textos científicos em Português",
      "Realize simulados mensais a partir de 3 meses antes do exame",
    ],
    tips: [
      "Biologia molecular e genética são a maior parte do exame",
      "A parte de Português costuma incluir textos da área da saúde",
      "Pesquise os grupos de estudo da UEM — muitos partilham materiais úteis",
    ],
    allowRegistrations: true,
    registrationUrl: "https://www.uem.ac.mz/",
    registrationDeadline: "2026-07-15",
    registrationFee: "1.500 MZN",
  },
  {
    id: "up-educacao-2025",
    title: "Exame de Admissão UP — Educação Básica 2025",
    institution: "Universidade Pedagógica",
    course: "Licenciatura em Ensino Primário",
    year: 2025,
    subjects: ["Português", "Matemática", "Cultura Geral"],
    difficulty: "Médio",
    featured: true,
    description: "Exame de admissão da UP para o curso de Educação Básica. Avalia comunicação em Português, raciocínio matemático e conhecimentos gerais sobre Moçambique e o mundo. Indicado para quem quer seguir a carreira docente no ensino primário.",
    processSteps: [
      "Verifique os requisitos e datas no site da Universidade Pedagógica",
      "Revise gramática portuguesa, produção textual e interpretação",
      "Estude matemática do ensino secundário (aritmética, álgebra básica, geometria)",
      "Actualize os seus conhecimentos sobre actualidade de Moçambique e do mundo",
    ],
    tips: [
      "O Português inclui redacção — pratique a estrutura de texto dissertativo",
      "Cultura Geral cobre história, geografia e factos recentes de Moçambique",
      "O exame é menos técnico que UEM — foque na clareza e organização das respostas",
    ],
    allowRegistrations: false,
    registrationUrl: "https://www.up.ac.mz/",
  },
  {
    id: "isctem-informatica-2025",
    title: "Exame de Admissão ISCTEM — Informática 2025",
    institution: "ISCTEM — Instituto Superior de Ciências e Tecnologia de Moçambique",
    course: "Licenciatura em Informática e Gestão",
    year: 2025,
    subjects: ["Matemática", "Inglês", "Raciocínio Lógico"],
    difficulty: "Médio",
    description: "Exame de admissão do ISCTEM para o curso de Informática. Cobre matemática discreta, raciocínio lógico e inglês técnico. O ISCTEM é conhecido pela qualidade da formação em TI — o exame selecciona candidatos com aptidão analítica e comunicação em inglês.",
    processSteps: [
      "Inscrição no balcão do ISCTEM ou online no portal",
      "Revise álgebra booleana, lógica proposicional e conjuntos",
      "Pratique inglês técnico (vocabulário de informática básico)",
      "Treine séries lógicas, padrões e sequências numéricas",
    ],
    tips: [
      "O raciocínio lógico inclui analogias, séries e problemas de padrão",
      "O inglês é de nível B1 — compreensão de textos e vocabulário básico de TI",
      "Calculadora não é permitida — exercite o cálculo mental",
    ],
    allowRegistrations: false,
    registrationUrl: "https://www.isctem.ac.mz/",
  },
  {
    id: "ucm-direito-2025",
    title: "Exame de Admissão UCM — Direito 2025",
    institution: "Universidade Católica de Moçambique",
    course: "Licenciatura em Direito",
    year: 2025,
    subjects: ["Português", "História", "Filosofia"],
    difficulty: "Médio",
    description: "Exame de admissão ao curso de Direito da UCM. Avalia domínio do Português jurídico, conhecimentos históricos (focando Moçambique e direito colonial/pós-colonial) e raciocínio filosófico e ético. Curso reconhecido internacionalmente com forte componente de direito internacional.",
    processSteps: [
      "Submeta candidatura online pelo portal da UCM (Beira ou Nampula)",
      "Revise história de Moçambique — período colonial, independência e constituição",
      "Estude filosofia do direito: conceitos de justiça, lei natural, estado",
      "Pratique redacção em português formal com argumentação estruturada",
    ],
    tips: [
      "A componente de Português inclui análise de textos legais — pratique a leitura crítica",
      "A UCM valoriza candidatos com postura ética — reflicta sobre os seus valores na entrevista",
    ],
    allowRegistrations: false,
    registrationUrl: "https://www.ucm.ac.mz/",
  },
];

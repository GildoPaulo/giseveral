export type ScholarshipLevel = "Licenciatura" | "Mestrado" | "Doutoramento" | "Intercâmbio";
export type CoverageType = "Total" | "Parcial";

export interface Scholarship {
  id: string;
  title: string;
  country: string;
  flag: string;
  level: ScholarshipLevel;
  area: string;
  coverage: CoverageType;
  language: string;
  deadline: string;
  benefits: string[];
  requirements: string[];
  applyUrl: string;
  featured?: boolean;
  institution: string;
  description?: string;
  process?: string[];
  documents?: string[];
  tips?: string[];
}

export const getScholarship = (id: string) => SCHOLARSHIPS.find((s) => s.id === id);

export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: "chevening-2026",
    title: "Bolsa Chevening 2026 — Reino Unido",
    country: "Reino Unido",
    flag: "🇬🇧",
    level: "Mestrado",
    area: "Várias áreas",
    coverage: "Total",
    language: "Inglês",
    deadline: "2026-11-05",
    benefits: ["Propinas pagas", "Subsídio mensal", "Voos ida e volta", "Seguro médico"],
    requirements: ["Licenciatura concluída", "2 anos de experiência", "IELTS / TOEFL"],
    applyUrl: "https://www.chevening.org/",
    featured: true,
    institution: "Governo do Reino Unido",
    description: "A Chevening é a bolsa internacional emblemática do Reino Unido, financiada pelo Foreign, Commonwealth & Development Office. Cobre um mestrado completo (1 ano) em qualquer universidade britânica, incluindo propinas, voos, alojamento, seguro e subsídio mensal. É altamente competitiva e procura líderes emergentes com forte impacto comunitário.",
    process: [
      "Crie conta no portal oficial Chevening em Agosto",
      "Escolha 3 cursos de mestrado em universidades do Reino Unido",
      "Complete os 4 ensaios (liderança, networking, estudos, carreira)",
      "Submeta candidatura até início de Novembro",
      "Entrevista (Fev–Abr) na Embaixada Britânica em Maputo",
      "Receba carta de aceitação até Junho e parta em Setembro",
    ],
    documents: ["Passaporte válido", "Transcripts da licenciatura", "2 cartas de recomendação", "Carta de aceitação condicional", "Certificado IELTS/TOEFL"],
    tips: ["Comece os ensaios 2 meses antes do prazo", "Mostre liderança concreta com números e impacto", "Escolha universidades realistas e diversificadas"],
  },
  {
    id: "daad-2026",
    title: "DAAD — Bolsas para Estudantes Africanos",
    country: "Alemanha",
    flag: "🇩🇪",
    level: "Mestrado",
    area: "Engenharia, Ciências, Economia",
    coverage: "Total",
    language: "Inglês / Alemão",
    deadline: "2026-09-30",
    benefits: ["850€/mês", "Propinas", "Seguro saúde", "Subsídio de viagem"],
    requirements: ["Licenciatura", "Experiência profissional de 2 anos"],
    applyUrl: "https://www.daad.de/",
    featured: true,
    institution: "DAAD — Alemanha",
    description: "O DAAD oferece bolsas integrais para estudantes de países em desenvolvimento, com foco em programas de mestrado relacionados ao desenvolvimento. Estuda numa universidade alemã de topo com subsídio mensal, propinas pagas e seguro completo.",
    process: ["Escolha um curso na lista DAAD de programas elegíveis", "Candidate-se directamente ao programa escolhido", "Submeta documentos via portal do DAAD", "Entrevista em Setembro/Outubro", "Resultado em Janeiro/Fevereiro"],
    documents: ["CV em formato europeu", "Carta de motivação", "2 referências académicas", "Comprovativo de inglês/alemão", "Certificado de licenciatura"],
    tips: ["Realce a relevância do curso para o desenvolvimento de Moçambique", "Procure programas com foco africano"],
  },
  {
    id: "erasmus-mundus-2026",
    title: "Erasmus Mundus Joint Masters",
    country: "União Europeia",
    flag: "🇪🇺",
    level: "Mestrado",
    area: "Várias áreas",
    coverage: "Total",
    language: "Inglês",
    deadline: "2026-02-15",
    benefits: ["1400€/mês", "Propinas pagas", "Estudo em 2-3 países", "Seguro completo"],
    requirements: ["Licenciatura", "Inglês fluente"],
    applyUrl: "https://www.eacea.ec.europa.eu/",
    featured: true,
    institution: "Comissão Europeia",
    description: "Os Erasmus Mundus Joint Masters decorrem em pelo menos duas universidades europeias. A bolsa cobre propinas, viagens, instalação e subsídio mensal generoso. Receberá um diploma conjunto reconhecido em toda a Europa.",
    process: ["Pesquise programas EMJM no catálogo oficial", "Candidate-se directamente ao consórcio do programa", "Cada programa tem prazo próprio (Nov–Fev)", "Resultados entre Abril e Maio"],
    documents: ["Transcripts oficiais", "Carta de motivação por programa", "2 cartas de recomendação", "Certificado de inglês"],
    tips: ["Pode candidatar-se a até 3 programas EMJM", "Personalize a carta de motivação para cada consórcio"],
  },
  {
    id: "fulbright-2026",
    title: "Fulbright — Estudo nos EUA",
    country: "Estados Unidos",
    flag: "🇺🇸",
    level: "Mestrado",
    area: "Várias áreas",
    coverage: "Total",
    language: "Inglês",
    deadline: "2026-05-15",
    benefits: ["Propinas", "Subsídio mensal", "Seguro de saúde", "Voos pagos"],
    requirements: ["Licenciatura", "TOEFL/IELTS", "Forte plano académico"],
    applyUrl: "https://foreign.fulbrightonline.org/",
    institution: "Governo dos EUA",
    featured: true,
    description: "O Programa Fulbright cobre mestrado ou doutoramento em qualquer universidade norte-americana, com forte componente de intercâmbio cultural.",
    process: ["Candidate-se via Embaixada dos EUA em Maputo", "Submeta projecto académico detalhado", "Entrevista entre Junho e Agosto", "Resultado e atribuição de universidade até Março seguinte"],
    documents: ["TOEFL ou IELTS", "GRE (alguns cursos)", "3 cartas de recomendação", "Plano de estudo de 2 páginas", "Currículo académico"],
    tips: ["Demonstre intenção clara de regressar a Moçambique", "Foque-se em projectos com impacto bilateral"],
  },
  {
    id: "mext-japao",
    title: "MEXT — Bolsa do Governo Japonês",
    country: "Japão",
    flag: "🇯🇵",
    level: "Licenciatura",
    area: "Várias áreas",
    coverage: "Total",
    language: "Japonês / Inglês",
    deadline: "2026-06-30",
    benefits: ["117 000 ¥/mês", "Propinas pagas", "Voo de ida e volta", "Curso de japonês"],
    requirements: ["Ensino secundário concluído", "Idade até 24"],
    applyUrl: "https://www.studyinjapan.go.jp/",
    institution: "MEXT — Japão",
    description: "A bolsa MEXT cobre licenciatura completa numa universidade japonesa, incluindo um ano preparatório de japonês, alojamento subsidiado e subsídio mensal.",
    process: ["Candidate-se via Embaixada do Japão em Maputo", "Exame escrito (Inglês, Matemática, Ciências)", "Entrevista em Julho/Agosto", "Partida em Abril do ano seguinte"],
    documents: ["Certificado do 12.º ano", "Notas detalhadas", "Atestado médico", "Carta de motivação"],
    tips: ["Estude japonês básico antes — dá vantagem na entrevista", "Boas notas em ciências fazem diferença"],
  },
  {
    id: "csc-china",
    title: "Chinese Government Scholarship (CSC)",
    country: "China",
    flag: "🇨🇳",
    level: "Mestrado",
    area: "Engenharia, Medicina, TI",
    coverage: "Total",
    language: "Chinês / Inglês",
    deadline: "2026-04-30",
    benefits: ["Propinas", "Alojamento", "Subsídio mensal", "Seguro médico"],
    requirements: ["Licenciatura", "Carta de recomendação"],
    applyUrl: "https://www.campuschina.org/",
    institution: "Governo da China",
    description: "A CSC cobre mestrado ou doutoramento em mais de 280 universidades chinesas, com programas em inglês ou chinês.",
    process: ["Escolha universidade e programa no portal CSC", "Candidate-se via Embaixada da China ou universidade", "Submeta antes do final de Abril", "Resultado em Julho"],
    documents: ["Plano de estudo", "Carta de aceitação da universidade", "2 referências", "Atestado médico"],
    tips: ["Contacte a universidade primeiro — facilita a aprovação", "Programas em inglês são muito procurados"],
  },
  {
    id: "calmette-portugal",
    title: "Bolsas Camões — Estudar em Portugal",
    country: "Portugal",
    flag: "🇵🇹",
    level: "Licenciatura",
    area: "Várias áreas",
    coverage: "Parcial",
    language: "Português",
    deadline: "2026-07-31",
    benefits: ["Propinas reduzidas", "Subsídio mensal", "Apoio à integração"],
    requirements: ["Ensino secundário", "Nacionalidade PALOP"],
    applyUrl: "https://www.instituto-camoes.pt/",
    institution: "Instituto Camões",
    description: "As Bolsas Camões apoiam estudantes dos PALOP a estudar em universidades portuguesas com propinas reduzidas e apoio à integração.",
    process: ["Candidate-se à universidade portuguesa pretendida", "Submeta candidatura à bolsa Camões em paralelo", "Entrega de documentação até Julho", "Resultado em Agosto/Setembro"],
    documents: ["Certificado do 12.º ano", "Carta de aceitação da universidade", "Comprovativo de rendimentos da família"],
    tips: ["Combine com bolsas das próprias universidades portuguesas", "Trate cedo do visto de estudante"],
  },
  {
    id: "mandela-rhodes",
    title: "Mandela Rhodes Scholarship",
    country: "África do Sul",
    flag: "🇿🇦",
    level: "Mestrado",
    area: "Liderança e várias áreas",
    coverage: "Total",
    language: "Inglês",
    deadline: "2026-04-30",
    benefits: ["Propinas", "Alojamento", "Subsídio", "Programa de liderança"],
    requirements: ["Idade até 30", "Liderança comprovada"],
    applyUrl: "https://www.mandelarhodes.org/",
    institution: "Mandela Rhodes Foundation",
    description: "Inspirada no legado de Nelson Mandela, esta bolsa cobre mestrado em qualquer universidade sul-africana, com componente forte de liderança e empreendedorismo.",
    process: ["Submeta candidatura online até final de Abril", "Avaliação por painel africano", "Entrevistas regionais (Maputo possível)", "Resultado em Setembro"],
    documents: ["CV", "Ensaios sobre liderança", "3 referências", "Plano académico"],
    tips: ["Conte uma história autêntica de liderança", "Evite clichés — seja específico"],
  },
];

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: "Bolsas" | "Universidades" | "Prazos" | "Oportunidades";
  date: string;
  author?: string;
  content?: string[];
  relatedScholarship?: string;
  tags?: string[];
}

export const HUB_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "Candidaturas Chevening 2026 abrem em Agosto",
    excerpt: "Estudantes moçambicanos podem candidatar-se à bolsa britânica que cobre mestrado completo no Reino Unido.",
    category: "Bolsas",
    date: "2026-04-28",
    author: "Equipa Giseveral",
    relatedScholarship: "chevening-2026",
    tags: ["Chevening", "Reino Unido", "Mestrado", "2026"],
  },
  {
    id: "n2",
    title: "DAAD aumenta valor da bolsa para 992€/mês",
    excerpt: "O programa alemão atualizou os subsídios mensais para acompanhar o custo de vida na Europa.",
    category: "Bolsas",
    date: "2026-04-22",
    author: "Equipa Giseveral",
    relatedScholarship: "daad-2026",
  },
  {
    id: "n3",
    title: "Universidade de Coimbra abre vagas para PALOP",
    excerpt: "100 vagas com propinas reduzidas para estudantes de países africanos de língua portuguesa.",
    category: "Universidades",
    date: "2026-04-15",
    author: "Equipa Giseveral",
    tags: ["Portugal", "Coimbra", "PALOP"],
  },
  {
    id: "n4",
    title: "Prazo Erasmus Mundus termina a 15 de Fevereiro",
    excerpt: "Faltam poucas semanas para a candidatura ao programa de mestrados conjuntos europeus.",
    category: "Prazos",
    date: "2026-04-10",
    author: "Equipa Giseveral",
    relatedScholarship: "erasmus-mundus-2026",
  },
  {
    id: "n5",
    title: "Fulbright lança nova categoria para investigadores africanos",
    excerpt: "Programa norte-americano expande oportunidades para doutoramento e pós-doutoramento.",
    category: "Oportunidades",
    date: "2026-04-05",
    author: "Equipa Giseveral",
    relatedScholarship: "fulbright-2026",
  },
  {
    id: "n6",
    title: "Banco Mundial financia 50 bolsas para Moçambique",
    excerpt: "Iniciativa apoia mestrados em desenvolvimento sustentável e economia.",
    category: "Bolsas",
    date: "2026-03-28",
    author: "Equipa Giseveral",
    tags: ["Banco Mundial", "Moçambique", "Mestrado"],
  },
];

export interface Guide {
  id: string;
  title: string;
  description: string;
  icon: string;
  readTime: string;
}

export const HUB_GUIDES: Guide[] = [
  { id: "g1", title: "Como escrever uma carta de motivação vencedora", description: "Estrutura, exemplos e erros a evitar para conquistar a comissão de avaliação.", icon: "✍️", readTime: "8 min" },
  { id: "g2", title: "Conseguir bolsa sem IELTS — é possível?", description: "Lista de bolsas e universidades que aceitam alternativas ao IELTS.", icon: "🌍", readTime: "6 min" },
  { id: "g3", title: "Documentos necessários para estudar fora", description: "Checklist completo: passaporte, transcripts, cartas, traduções juramentadas.", icon: "📄", readTime: "5 min" },
  { id: "g4", title: "Como obter visto de estudante (passo a passo)", description: "Guia para vistos da Europa, EUA, Reino Unido e Brasil.", icon: "🛂", readTime: "10 min" },
  { id: "g5", title: "10 dicas para a entrevista da bolsa", description: "Perguntas comuns, postura e como destacar o seu perfil.", icon: "🎤", readTime: "7 min" },
  { id: "g6", title: "Vida de estudante internacional: o que esperar", description: "Custos, alojamento, trabalho part-time e adaptação cultural.", icon: "🏠", readTime: "9 min" },
];

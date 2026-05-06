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
    content: [
      "As candidaturas à Bolsa Chevening 2026 abrem oficialmente em Agosto de 2026. Este programa é financiado pelo Governo do Reino Unido e oferece mestrado completo a estudantes de todo o mundo, incluindo Moçambique.",
      "A Bolsa Chevening cobre a totalidade das propinas universitárias, uma bolsa mensal para despesas de vida no Reino Unido, bilhetes de avião de ida e volta, e um subsídio para despesas adicionais de chegada.",
      "Para se candidatar, os estudantes moçambicanos devem ter pelo menos dois anos de experiência profissional, uma licenciatura reconhecida, e domínio do inglês. As candidaturas são feitas exclusivamente online através do portal oficial Chevening.",
      "A Giseveral e Services pode ajudar-te a preparar toda a documentação necessária: revisão do currículo, carta de motivação, tradução e autenticação de documentos. Contacta-nos pelo WhatsApp para mais informações.",
    ],
  },
  {
    id: "n2",
    title: "DAAD aumenta valor da bolsa para 992€/mês",
    excerpt: "O programa alemão atualizou os subsídios mensais para acompanhar o custo de vida na Europa.",
    category: "Bolsas",
    date: "2026-04-22",
    author: "Equipa Giseveral",
    relatedScholarship: "daad-2026",
    tags: ["DAAD", "Alemanha", "Europa"],
    content: [
      "O Serviço Alemão de Intercâmbio Académico (DAAD) actualizou o valor das bolsas para estudantes internacionais em 2026. O subsídio mensal passou de 934€ para 992€, reflectindo o aumento do custo de vida na Alemanha e restantes países europeus.",
      "Esta actualização aplica-se a todos os programas de bolsas DAAD, incluindo mestrado, doutoramento e estágios de investigação. Os candidatos beneficiam também de seguro de saúde, apoio à habitação e um subsídio de viagem.",
      "Para estudantes moçambicanos, a bolsa DAAD representa uma oportunidade única de formação em universidades de referência mundial. O processo de candidatura exige certificados académicos reconhecidos e competência em alemão ou inglês, dependendo do programa.",
      "Se precisas de apoio na preparação da candidatura, a Giseveral está disponível para revisão de documentos, impressão e autenticação.",
    ],
  },
  {
    id: "n3",
    title: "Universidade de Coimbra abre vagas para PALOP",
    excerpt: "100 vagas com propinas reduzidas para estudantes de países africanos de língua portuguesa.",
    category: "Universidades",
    date: "2026-04-15",
    author: "Equipa Giseveral",
    tags: ["Portugal", "Coimbra", "PALOP"],
    content: [
      "A Universidade de Coimbra, uma das mais antigas da Europa, anunciou a abertura de 100 vagas com propinas reduzidas para estudantes provenientes dos Países Africanos de Língua Portuguesa (PALOP), incluindo Moçambique.",
      "As vagas abrangem cursos de licenciatura, mestrado e doutoramento em áreas como Direito, Engenharia, Medicina, Ciências Sociais e Humanidades. As propinas reduzidas representam uma poupança de até 60% face aos valores normais.",
      "Os candidatos moçambicanos devem apresentar certificados de habilitações reconhecidos pelo Ministério da Educação, carta de motivação em português, e comprovativos de situação financeira. As candidaturas decorrem entre Abril e Junho de 2026.",
      "A Giseveral e Services apoia estudantes na digitalização, impressão e envio de documentos para candidaturas a universidades estrangeiras.",
    ],
  },
  {
    id: "n4",
    title: "Prazo Erasmus Mundus termina a 15 de Fevereiro",
    excerpt: "Faltam poucas semanas para a candidatura ao programa de mestrados conjuntos europeus.",
    category: "Prazos",
    date: "2026-04-10",
    author: "Equipa Giseveral",
    relatedScholarship: "erasmus-mundus-2026",
    tags: ["Erasmus", "Europa", "Mestrado"],
    content: [
      "O prazo para candidaturas ao programa Erasmus Mundus 2026 encerra a 15 de Fevereiro. Este programa europeu oferece bolsas integrais para mestrados conjuntos realizados em dois ou mais países da União Europeia.",
      "As bolsas Erasmus Mundus cobrem propinas, subsídio mensal de 1.000€ para estudantes de países fora da Europa, seguro de saúde e despesas de viagem. A duração é de 1 a 2 anos, dependendo do programa escolhido.",
      "Os candidatos moçambicanos concorrem em igualdade com outros estudantes internacionais. A selecção é feita com base no mérito académico, carta de motivação, referências e entrevista em alguns programas.",
      "Atenção: com o prazo a terminar em breve, é fundamental organizar toda a documentação com urgência. A Giseveral pode ajudar com impressão, digitalização e envio de documentos com brevidade.",
    ],
  },
  {
    id: "n5",
    title: "Fulbright lança nova categoria para investigadores africanos",
    excerpt: "Programa norte-americano expande oportunidades para doutoramento e pós-doutoramento.",
    category: "Oportunidades",
    date: "2026-04-05",
    author: "Equipa Giseveral",
    relatedScholarship: "fulbright-2026",
    tags: ["Fulbright", "EUA", "Investigação"],
    content: [
      "O programa Fulbright anunciou uma nova categoria de bolsas especificamente destinada a investigadores africanos. Esta iniciativa visa reforçar a investigação científica em África e criar pontes académicas entre o continente africano e os Estados Unidos da América.",
      "A nova categoria abrange bolsas de doutoramento e pós-doutoramento nas áreas de Ciências, Tecnologia, Engenharia, Matemática (STEM), Saúde Pública, Ciências Sociais e Humanidades com foco em África.",
      "Para investigadores moçambicanos, esta é uma oportunidade histórica de aceder às melhores universidades americanas com bolsa integral. Os candidatos devem ter mestrado concluído ou estar em fase final de doutoramento, com publicações académicas relevantes.",
      "O processo de candidatura inclui um projecto de investigação detalhado, duas cartas de recomendação académica e entrevista. A Giseveral apoia na preparação e impressão de todos os documentos necessários.",
    ],
  },
  {
    id: "n6",
    title: "Banco Mundial financia 50 bolsas para Moçambique",
    excerpt: "Iniciativa apoia mestrados em desenvolvimento sustentável e economia.",
    category: "Bolsas",
    date: "2026-03-28",
    author: "Equipa Giseveral",
    tags: ["Banco Mundial", "Moçambique", "Mestrado"],
    content: [
      "O Banco Mundial anunciou o financiamento de 50 bolsas integrais para estudantes moçambicanos realizarem mestrados em universidades internacionais de referência. O programa enquadra-se na iniciativa de desenvolvimento do capital humano em Moçambique.",
      "As bolsas destinam-se a áreas estratégicas para o desenvolvimento nacional: Economia e Finanças, Engenharia Civil e Infraestruturas, Saúde Pública, Agricultura Sustentável e Gestão Ambiental. A preferência é dada a candidatos com experiência em organizações públicas ou de desenvolvimento.",
      "Cada bolsa inclui propinas integrais, subsídio mensal para despesas de vida, seguro de saúde, bilhetes de avião e um subsídio de instalação. A duração é de 1 a 2 anos, com compromisso de regressar a Moçambique após a conclusão do mestrado.",
      "As candidaturas são apresentadas através do Ministério da Educação e Desenvolvimento Humano. Para apoio na preparação do dossier de candidatura, a Giseveral e Services está disponível na Beira.",
    ],
  },
];

export interface Guide {
  id: string;
  title: string;
  description: string;
  icon: string;
  readTime: string;
  link: string;
}

export const HUB_GUIDES: Guide[] = [
  { id: "g1", title: "Como escrever uma carta de motivação vencedora", description: "Estrutura, exemplos e erros a evitar para conquistar a comissão de avaliação.", icon: "✍️", readTime: "8 min", link: "/hub/cartas" },
  { id: "g2", title: "Conseguir bolsa sem IELTS — é possível?", description: "Lista de bolsas e universidades que aceitam alternativas ao IELTS.", icon: "🌍", readTime: "6 min", link: "/hub/bolsas" },
  { id: "g3", title: "Documentos necessários para estudar fora", description: "Checklist completo: passaporte, transcripts, cartas, traduções juramentadas.", icon: "📄", readTime: "5 min", link: "/hub/explorar" },
  { id: "g4", title: "Como obter visto de estudante (passo a passo)", description: "Guia para vistos da Europa, EUA, Reino Unido e Brasil.", icon: "🛂", readTime: "10 min", link: "/hub/explorar" },
  { id: "g5", title: "10 dicas para a entrevista da bolsa", description: "Perguntas comuns, postura e como destacar o seu perfil.", icon: "🎤", readTime: "7 min", link: "/hub/bolsas" },
  { id: "g6", title: "Vida de estudante internacional: o que esperar", description: "Custos, alojamento, trabalho part-time e adaptação cultural.", icon: "🏠", readTime: "9 min", link: "/hub/explorar" },
];

export type DocCategory = "exames" | "trabalhos" | "cvs" | "livros";

export interface DocItem {
  id: string;
  title: string;
  author: string;
  category: DocCategory;
  pages: number;
  downloads: number;
  views: number;
  uploadedAt: string;
  description: string;
  tags: string[];
  premium?: boolean;
  cover: number; // hue 0-360 for procedural gradient
  coverImageUrl?: string; // optional real cover image (overrides gradient)
  fileUrl?: string;
}

export const DOC_CATEGORIES: { id: DocCategory; label: string; icon: string; description: string }[] = [
  { id: "exames",    label: "Exames",      icon: "📝", description: "Exames de admissão, finais e testes resolvidos" },
  { id: "trabalhos", label: "Trabalhos",   icon: "📚", description: "Trabalhos académicos, monografias e relatórios" },
  { id: "cvs",       label: "CVs e Cartas",icon: "💼", description: "Modelos de CV, cartas de apresentação e candidaturas" },
  { id: "livros",    label: "Livros",      icon: "📖", description: "Manuais, sebentas e referências académicas" },
];

export const HUB_DOCUMENTS: DocItem[] = [
  {
    id: "exame-admissao-uem-engenharia-2024",
    title: "Exame de Admissão UEM - Engenharia 2024",
    author: "Carlos Mucavele",
    category: "exames",
    pages: 12,
    downloads: 1547,
    views: 8932,
    uploadedAt: "2024-09-12",
    description: "Exame completo de admissão à Universidade Eduardo Mondlane para o curso de Engenharia, edição 2024, com gabarito.",
    tags: ["UEM", "Engenharia", "Admissão", "2024"],
    cover: 222,
  },
  {
    id: "modelo-cv-profissional-mocambique",
    title: "Modelo de CV Profissional - Moçambique",
    author: "Ana Sitoe",
    category: "cvs",
    pages: 2,
    downloads: 2103,
    views: 11240,
    uploadedAt: "2024-10-02",
    description: "Modelo limpo e moderno de CV adaptado ao mercado moçambicano. Editável em Word e PDF.",
    tags: ["CV", "Emprego", "Modelo", "Profissional"],
    cover: 45,
  },
  {
    id: "monografia-energias-renovaveis-mocambique",
    title: "Monografia: Energias Renováveis em Moçambique",
    author: "Hélder Macuácua",
    category: "trabalhos",
    pages: 86,
    downloads: 432,
    views: 2104,
    uploadedAt: "2024-08-21",
    description: "Estudo completo sobre o potencial das energias renováveis em Moçambique, com foco em solar e hídrica.",
    tags: ["Monografia", "Energia", "Sustentabilidade"],
    premium: true,
    cover: 142,
  },
  {
    id: "calculo-i-sebenta-uem",
    title: "Cálculo I - Sebenta UEM",
    author: "Prof. Tembe",
    category: "livros",
    pages: 210,
    downloads: 3892,
    views: 15670,
    uploadedAt: "2024-07-04",
    description: "Sebenta completa de Cálculo I usada no primeiro ano de Engenharia. Inclui exercícios resolvidos.",
    tags: ["Cálculo", "Matemática", "UEM", "Sebenta"],
    cover: 200,
  },
  {
    id: "exame-matematica-12-classe-2023",
    title: "Exame de Matemática 12ª Classe - 2023",
    author: "Ministério da Educação",
    category: "exames",
    pages: 8,
    downloads: 5621,
    views: 22103,
    uploadedAt: "2023-12-15",
    description: "Exame nacional de Matemática da 12ª classe, época normal de 2023, com resolução detalhada.",
    tags: ["12ª Classe", "Matemática", "Nacional"],
    cover: 12,
  },
  {
    id: "carta-motivacao-bolsa-estudos",
    title: "Carta de Motivação para Bolsa de Estudos",
    author: "Inês Chissano",
    category: "cvs",
    pages: 1,
    downloads: 980,
    views: 4521,
    uploadedAt: "2024-09-30",
    description: "Modelo testado de carta de motivação para candidaturas a bolsas de estudo no estrangeiro.",
    tags: ["Bolsa", "Carta", "Estudos"],
    cover: 280,
  },
  {
    id: "relatorio-estagio-banco-bim",
    title: "Relatório de Estágio - Banco BIM",
    author: "João Nhaca",
    category: "trabalhos",
    pages: 54,
    downloads: 287,
    views: 1342,
    uploadedAt: "2024-06-18",
    description: "Relatório completo de estágio curricular no sector bancário, área de gestão de risco.",
    tags: ["Estágio", "Bancário", "Gestão"],
    cover: 340,
  },
  {
    id: "manual-direito-constitucional-mocambicano",
    title: "Manual de Direito Constitucional Moçambicano",
    author: "Dr. Mbeve",
    category: "livros",
    pages: 320,
    downloads: 1290,
    views: 6543,
    uploadedAt: "2024-05-10",
    description: "Manual de referência sobre a Constituição da República de Moçambique, atualizado.",
    tags: ["Direito", "Constituição", "Manual"],
    premium: true,
    cover: 260,
  },
];

export const CATEGORIES_MAP: Record<DocCategory, { label: string; icon: string }> = {
  exames:    { label: "Exames",       icon: "📝" },
  trabalhos: { label: "Trabalhos",    icon: "📚" },
  cvs:       { label: "CVs e Cartas", icon: "💼" },
  livros:    { label: "Livros",       icon: "📖" },
};

export const getDocById = (id: string) => HUB_DOCUMENTS.find((d) => d.id === id);
export const getDocsByCategory = (cat: DocCategory) => HUB_DOCUMENTS.filter((d) => d.category === cat);
export const getPopularDocs = (n = 6) => [...HUB_DOCUMENTS].sort((a, b) => b.downloads - a.downloads).slice(0, n);
export const getRecentDocs = (n = 6) => [...HUB_DOCUMENTS].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, n);

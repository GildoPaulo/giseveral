export const GALLERY_CATEGORIES = [
  { id: "todos", label: "Todos", icon: "🎨" },
  { id: "design", label: "Design", icon: "✏️" },
  { id: "impressao", label: "Impressão", icon: "🖨️" },
  { id: "informatica", label: "Informática", icon: "💻" },
  { id: "cv", label: "Currículos", icon: "📄" },
  { id: "papelaria", label: "Papelaria", icon: "📚" },
] as const;

export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]["id"];

export function categoryLabel(id: string): string {
  return GALLERY_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Map serviço público → categorias de portfólio usadas na secção "Trabalhos recentes" */
export const SERVICE_TO_GALLERY_CATEGORIES: Record<string, string[]> = {
  reprografia: ["impressao", "papelaria"],
  papelaria: ["papelaria"],
  "design-grafico": ["design"],
  informatica: ["informatica"],
  redes: ["informatica"],
};

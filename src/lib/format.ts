/**
 * GISEVERAL FORMAT UTILITIES
 * ===========================
 * Funções de formatação padronizadas para uso em todo o projeto
 * Garante consistência visual e melhor UX
 */

/**
 * Formata valor monetário em MZN (Metical Moçambicano)
 * @example formatMZN(1500.50) → "1.500,50 MZN"
 * @example formatMZN(1500.50, false) → "1.500,50"
 */
export function formatMZN(value: number, showCurrency = true): string {
  const formatted = value.toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return showCurrency ? `${formatted} MZN` : formatted;
}

/**
 * Formata data em português de Moçambique
 * @example formatDate(new Date()) → "14 mai. 2026"
 * @example formatDate(new Date(), "full") → "14 de maio de 2026"
 * @example formatDate(new Date(), "long") → "14 de mai. de 2026, 15:30"
 */
export function formatDate(
  date: Date | string,
  style: "short" | "medium" | "long" | "full" = "medium"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (style) {
    case "short":
      return d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
      });

    case "medium":
      return d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    case "long":
      return d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    case "full":
      return d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

    default:
      return d.toLocaleDateString("pt-PT");
  }
}

/**
 * Formata data relativa (tempo decorrido)
 * @example formatRelativeDate(new Date(Date.now() - 1000 * 60 * 5)) → "há 5 minutos"
 * @example formatRelativeDate(new Date(Date.now() - 1000 * 60 * 60 * 24)) → "há 1 dia"
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  if (diffHour < 24) return `há ${diffHour} ${diffHour === 1 ? "hora" : "horas"}`;
  if (diffDay < 7) return `há ${diffDay} ${diffDay === 1 ? "dia" : "dias"}`;
  if (diffWeek < 4) return `há ${diffWeek} ${diffWeek === 1 ? "semana" : "semanas"}`;
  if (diffMonth < 12) return `há ${diffMonth} ${diffMonth === 1 ? "mês" : "meses"}`;
  return `há ${diffYear} ${diffYear === 1 ? "ano" : "anos"}`;
}

/**
 * Formata peso em kg com unidade
 * @example formatWeight(1.5) → "1,5 kg"
 * @example formatWeight(0.25) → "250 g"
 */
export function formatWeight(kg: number): string {
  if (kg < 1) {
    const grams = Math.round(kg * 1000);
    return `${grams} g`;
  }
  return `${kg.toLocaleString("pt-MZ", { maximumFractionDigits: 2 })} kg`;
}

/**
 * Formata dimensões em cm
 * @example formatDimensions(30, 20, 5) → "30 × 20 × 5 cm"
 * @example formatDimensions(30, 20) → "30 × 20 cm"
 */
export function formatDimensions(
  length: number,
  width?: number,
  height?: number
): string {
  if (width === undefined) return `${length} cm`;
  if (height === undefined) return `${length} × ${width} cm`;
  return `${length} × ${width} × ${height} cm`;
}

/**
 * Formata número de telefone moçambicano
 * @example formatPhone("840000000") → "84 000 0000"
 * @example formatPhone("+258840000000") → "+258 84 000 0000"
 */
export function formatPhone(phone: string): string {
  // Remove todos os caracteres que não são dígitos ou +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Se começar com +258
  if (cleaned.startsWith("+258")) {
    const local = cleaned.substring(4);
    return `+258 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5)}`;
  }

  // Número local (8X ou 2X)
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  }

  // Retorna como está se não couber nos padrões
  return phone;
}

/**
 * Formata percentagem
 * @example formatPercent(0.15) → "15%"
 * @example formatPercent(0.1567, 1) → "15,7%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals).replace(".", ",")}%`;
}

/**
 * Formata número grande com abreviação
 * @example formatNumber(1500) → "1.500"
 * @example formatNumber(1500000) → "1,5M"
 * @example formatNumber(1500000, true) → "1,5 milhões"
 */
export function formatNumber(num: number, longForm = false): string {
  if (num < 1000) return num.toLocaleString("pt-MZ");

  if (num < 1000000) {
    const thousands = (num / 1000).toFixed(1);
    return longForm ? `${thousands} mil` : `${thousands}k`;
  }

  if (num < 1000000000) {
    const millions = (num / 1000000).toFixed(1);
    return longForm ? `${millions} milhões` : `${millions}M`;
  }

  const billions = (num / 1000000000).toFixed(1);
  return longForm ? `${billions} mil milhões` : `${billions}B`;
}

/**
 * Trunca texto com reticências
 * @example truncate("Lorem ipsum dolor sit amet", 10) → "Lorem ipsu..."
 */
export function truncate(text: string, maxLength: number, suffix = "..."): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formata nome próprio (primeira letra maiúscula em cada palavra)
 * @example formatName("gildo paulo correia") → "Gildo Paulo Correia"
 */
export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formata slug/URL amigável
 * @example formatSlug("Gildo Paulo Correia — CEO") → "gildo-paulo-correia-ceo"
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s-]/g, "") // remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-") // substitui espaços por hífens
    .replace(/-+/g, "-"); // remove hífens duplicados
}

/**
 * Formata número de arquivo/documento
 * @example formatFileSize(1024) → "1 KB"
 * @example formatFileSize(1536000) → "1,5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Formata prazo de entrega
 * @example formatDeliveryTime(1, 3) → "1 a 3 dias úteis"
 * @example formatDeliveryTime(0, 0) → "Hoje"
 */
export function formatDeliveryTime(minDays: number, maxDays: number): string {
  if (minDays === 0 && maxDays === 0) return "Hoje";
  if (minDays === maxDays) {
    if (minDays === 1) return "Amanhã";
    return `${minDays} dias úteis`;
  }
  return `${minDays} a ${maxDays} dias úteis`;
}

/**
 * Formata distância
 * @example formatDistance(500) → "500 m"
 * @example formatDistance(1500) → "1,5 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Valida e formata email
 */
export function formatEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Formata NUIT (Número Único de Identificação Tributária de Moçambique)
 * @example formatNUIT("123456789") → "123 456 789"
 */
export function formatNUIT(nuit: string): string {
  const cleaned = nuit.replace(/\D/g, "");
  if (cleaned.length !== 9) return nuit;
  return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
}

/**
 * Helper para debugging (apenas em dev)
 */
export function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.log("[Giseveral]", ...args);
  }
}

/**
 * Helper para erros (sempre mostra)
 */
export function devError(...args: unknown[]) {
  console.error("[Giseveral Error]", ...args);
}

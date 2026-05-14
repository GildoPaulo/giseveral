/**
 * GISEVERAL SHIPPING INTELLIGENCE
 * ================================
 * Serviço modular de cálculo de frete para marketplace com suporte a:
 * - Local (Beira e arredores)
 * - Nacional (Moçambique)
 * - Internacional (África do Sul, Portugal, resto do mundo)
 * - Digital (produtos sem frete)
 *
 * O cálculo considera:
 * - Peso real e volumétrico (peso cubado)
 * - Tipo de produto (físico vs digital)
 * - Destino geográfico
 * - Modalidade (standard vs express)
 * - Políticas especiais (frete grátis, valores fixos)
 */

import type { CartItem } from "@/contexts/CartContext";

export type ShippingType = "local" | "national" | "international" | "digital";
export type ShippingMethod = "standard" | "express" | "download" | "pickup";

export type ShippingQuote = {
  itemId: string;
  itemName: string;
  type: ShippingType;
  method: ShippingMethod;
  carrier: string;
  origin: string;
  destination: string;
  cost: number;
  eta: string;
  trackingAvailable: boolean;
};

export type ShippingSummary = {
  quotes: ShippingQuote[];
  total: number;
  hasDigital: boolean;
  hasPhysical: boolean;
};

type Region = "beira" | "maputo" | "mozambique" | "south_africa" | "portugal" | "global";

/**
 * TABELA DE PREÇOS BASE POR TIPO E REGIÃO (valores em MZN)
 * Preços atualizados para 2026 baseados no mercado moçambicano
 */
const SHIPPING_RULES: Record<ShippingType, Record<string, { standard: number; express: number; eta: string; carrier: string }>> = {
  local: {
    beira: { standard: 80, express: 150, eta: "Hoje ou ate 24h", carrier: "Giseveral Express" },
  },
  national: {
    maputo: { standard: 350, express: 650, eta: "1 a 3 dias uteis", carrier: "Transportadora nacional" },
    mozambique: { standard: 450, express: 800, eta: "2 a 5 dias uteis", carrier: "Transportadora nacional" },
  },
  international: {
    south_africa: { standard: 1200, express: 2500, eta: "5 a 10 dias uteis", carrier: "DHL/FedEx" },
    portugal: { standard: 2500, express: 4500, eta: "7 a 14 dias uteis", carrier: "DHL/FedEx/CTT" },
    global: { standard: 3000, express: 5500, eta: "10 a 21 dias uteis", carrier: "DHL/FedEx/UPS" },
  },
  digital: {
    global: { standard: 0, express: 0, eta: "Disponivel imediatamente", carrier: "Download digital" },
  },
};

/**
 * Normaliza strings para comparação (remove acentos e converte para minúsculas)
 */
function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Detecta região geográfica a partir do endereço de destino
 * Suporta variações de escrita e nomes de bairros conhecidos
 */
function detectRegion(destination: string): Region {
  const d = normalize(destination);
  if (d.includes("beira") || d.includes("esturro") || d.includes("munhava") || d.includes("macuti")) return "beira";
  if (d.includes("maputo")) return "maputo";
  if (d.includes("africa do sul") || d.includes("south africa")) return "south_africa";
  if (d.includes("portugal")) return "portugal";
  if (d.includes("mocambique") || d.includes("mozambique") || d.includes("nampula") || d.includes("tete") || d.includes("quelimane")) return "mozambique";
  return "beira"; // default para local
}

/**
 * Resolve o tipo de frete baseado nas propriedades do produto e destino
 * Prioridade: configuração manual > tipo de produto > região
 */
function resolveShippingType(item: CartItem, region: Region): ShippingType {
  if (item.shippingType === "digital") return "digital";
  if (item.shippingType) return item.shippingType;
  if (item.type === "servico") return "local";
  if (region === "beira") return "local";
  if (region === "maputo" || region === "mozambique") return "national";
  return "international";
}

/**
 * Calcula peso volumétrico em kg usando fator de cubagem de 5000 cm³/kg
 * Padrão da indústria logística internacional
 */
function volumeFactor(item: CartItem) {
  const volume = (item.lengthCm ?? 0) * (item.widthCm ?? 0) * (item.heightCm ?? 0);
  if (!volume) return 0;
  return Math.ceil(volume / 5000);
}

/**
 * Calcula o fator de peso cobrável (maior entre peso real e volumétrico)
 * Retorna kg adicionais além do primeiro kg (que já está no preço base)
 */
function weightFactor(item: CartItem) {
  const chargeableWeight = Math.max(item.weightKg ?? 0, volumeFactor(item));
  if (chargeableWeight <= 1) return 0;
  return Math.ceil(chargeableWeight - 1);
}

/**
 * Calcula frete para um único item do carrinho
 * Retorna cotação completa com preço, transportadora, prazo estimado
 *
 * Regras aplicadas em ordem:
 * 1. Levantamento na loja → frete zero
 * 2. Produto digital → frete zero
 * 3. Frete grátis configurado → frete zero
 * 4. Cálculo dinâmico: preço base + adicional por peso/volume
 */
export function calculateItemShipping(item: CartItem, destination: string, deliveryType: "pickup" | "delivery"): ShippingQuote {
  const region = detectRegion(destination);
  const type = resolveShippingType(item, region);
  const origin = item.shippingOrigin || "Beira, Mocambique";

  // 1. Levantamento na loja (exceto produtos digitais)
  if (deliveryType === "pickup" && type !== "digital") {
    return {
      itemId: item.id,
      itemName: item.name,
      type,
      method: "pickup",
      carrier: "Levantamento na loja",
      origin,
      destination,
      cost: 0,
      eta: "Disponivel apos confirmacao",
      trackingAvailable: false,
    };
  }

  // 2. Produtos digitais sempre grátis
  if (type === "digital") {
    return {
      itemId: item.id,
      itemName: item.name,
      type,
      method: "download",
      carrier: "Download digital",
      origin,
      destination,
      cost: 0,
      eta: "Disponivel imediatamente",
      trackingAvailable: false,
    };
  }

  // 3. Frete grátis configurado no produto
  if (item.freeShipping) {
    return {
      itemId: item.id,
      itemName: item.name,
      type,
      method: "standard",
      carrier: "Frete gratis",
      origin,
      destination,
      cost: 0,
      eta: "Prazo confirmado no pedido",
      trackingAvailable: true,
    };
  }

  // 4. Cálculo dinâmico baseado em peso e região
  const regionKey = type === "local" ? "beira" : type === "national" ? (region === "maputo" ? "maputo" : "mozambique") : region;
  const rule = SHIPPING_RULES[type][regionKey] ?? SHIPPING_RULES[type].global ?? SHIPPING_RULES.local.beira;
  const method: ShippingMethod = item.expressAvailable ? "express" : "standard";

  // Preço fixo configurado tem prioridade, senão usa tabela
  const base = item.shippingFee ?? (type === "international" ? item.internationalShippingFee : undefined) ?? rule[method];

  // Multiplicador por kg adicional varia por tipo de entrega
  const multiplier = type === "local" ? 35 : type === "national" ? 120 : 450;
  const cost = base + weightFactor(item) * multiplier;

  return {
    itemId: item.id,
    itemName: item.name,
    type,
    method,
    carrier: rule.carrier,
    origin,
    destination,
    cost: cost * item.quantity,
    eta: rule.eta,
    trackingAvailable: true,
  };
}

/**
 * Calcula frete total do carrinho e retorna resumo com todas as cotações
 * Útil para mostrar breakdown detalhado no checkout
 */
export function calculateCartShipping(items: CartItem[], destination: string, deliveryType: "pickup" | "delivery"): ShippingSummary {
  const quotes = items.map((item) => calculateItemShipping(item, destination, deliveryType));
  return {
    quotes,
    total: quotes.reduce((sum, quote) => sum + quote.cost, 0),
    hasDigital: quotes.some((quote) => quote.type === "digital"),
    hasPhysical: quotes.some((quote) => quote.type !== "digital"),
  };
}

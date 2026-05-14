/**
 * GISEVERAL SHIPPING HOOK
 * ========================
 * Hook customizado para cálculos de frete com cache e loading states
 */

import { useState, useEffect, useMemo } from "react";
import type { CartItem } from "@/contexts/CartContext";
import { calculateItemShipping, type ShippingQuote } from "@/services/shipping";

export type UseShippingResult = {
  quote: ShippingQuote | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Hook para calcular frete de um único item
 * Retorna cotação com loading state
 *
 * @example
 * const { quote, isLoading } = useShipping(item, "Beira", "delivery");
 */
export function useShipping(
  item: CartItem | null,
  destination: string,
  deliveryType: "pickup" | "delivery" = "delivery"
): UseShippingResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);

  // Cache key baseado nos parâmetros
  const cacheKey = useMemo(
    () => JSON.stringify({ itemId: item?.id, destination, deliveryType }),
    [item?.id, destination, deliveryType]
  );

  const fetchShipping = () => {
    if (!item) {
      setQuote(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulando delay para mostrar loading (remover em produção se não for async)
      const result = calculateItemShipping(item, destination, deliveryType);
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao calcular frete"));
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return {
    quote,
    isLoading,
    error,
    refetch: fetchShipping,
  };
}

/**
 * Hook para calcular frete de múltiplos itens (carrinho completo)
 *
 * @example
 * const { quotes, total, isLoading } = useCartShipping(items, destination, "delivery");
 */
export function useCartShipping(
  items: CartItem[],
  destination: string,
  deliveryType: "pickup" | "delivery" = "delivery"
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);

  const cacheKey = useMemo(
    () => JSON.stringify({
      itemIds: items.map((i) => i.id).sort(),
      destination,
      deliveryType,
    }),
    [items, destination, deliveryType]
  );

  const fetchShipping = () => {
    if (items.length === 0) {
      setQuotes([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = items.map((item) =>
        calculateItemShipping(item, destination, deliveryType)
      );
      setQuotes(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao calcular frete"));
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const total = useMemo(
    () => quotes.reduce((sum, quote) => sum + quote.cost, 0),
    [quotes]
  );

  const hasDigital = useMemo(
    () => quotes.some((q) => q.type === "digital"),
    [quotes]
  );

  const hasPhysical = useMemo(
    () => quotes.some((q) => q.type !== "digital"),
    [quotes]
  );

  const hasExpress = useMemo(
    () => quotes.some((q) => q.method === "express"),
    [quotes]
  );

  const hasFreeShipping = useMemo(
    () => quotes.some((q) => q.cost === 0 && q.type !== "digital"),
    [quotes]
  );

  return {
    quotes,
    total,
    hasDigital,
    hasPhysical,
    hasExpress,
    hasFreeShipping,
    isLoading,
    error,
    refetch: fetchShipping,
  };
}

/**
 * Hook simplificado para mostrar badge de frete
 * Retorna string formatada para exibir badge
 *
 * @example
 * const badge = useShippingBadge(item);
 * // → "Frete grátis" | "⚡ Express" | "📥 Digital" | null
 */
export function useShippingBadge(item: CartItem | null): string | null {
  if (!item) return null;

  if (item.shippingType === "digital") return "📥 Digital";
  if (item.freeShipping) return "🎁 Frete grátis";
  if (item.expressAvailable) return "⚡ Express disponível";

  return null;
}

/**
 * Hook para validar se endereço tem cobertura de entrega
 * Útil para mostrar mensagem antes do checkout
 *
 * @example
 * const { hasCoverage, message } = useShippingCoverage("Maputo");
 */
export function useShippingCoverage(destination: string) {
  const [hasCoverage, setHasCoverage] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const dest = destination.toLowerCase().trim();

    // Verifica cobertura (expandir conforme necessário)
    if (dest.includes("beira") || dest.includes("sofala")) {
      setHasCoverage(true);
      setMessage("✓ Entrega disponível em Beira");
    } else if (dest.includes("maputo")) {
      setHasCoverage(true);
      setMessage("✓ Entrega nacional disponível (1-3 dias úteis)");
    } else if (dest.includes("moçambique") || dest.includes("mozambique") || dest.includes("nampula") || dest.includes("tete")) {
      setHasCoverage(true);
      setMessage("✓ Entrega nacional disponível (2-5 dias úteis)");
    } else if (dest.length < 3) {
      setHasCoverage(true);
      setMessage("");
    } else {
      setHasCoverage(true); // Por agora sempre true, expandir depois
      setMessage("✓ Entrega disponível");
    }
  }, [destination]);

  return { hasCoverage, message };
}

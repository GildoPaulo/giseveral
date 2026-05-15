import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ShoppingBag, Star, Truck, ShoppingCart, Zap, Package,
  Heart, Store, Plane, MapPin, ShieldCheck, Facebook, Instagram, MessageCircle,
  Check, Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { SkeletonCard } from "@/components/Skeleton";
import { formatMZN } from "@/lib/format";
import { useHeroImages, type HeroImage } from "@/hooks/useHeroImages";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/loja/")({
  head: () => ({
    meta: [
      { title: "Loja Giseveral — Marketplace premium em Moçambique" },
      {
        name: "description",
        content:
          "Marketplace Giseveral: impressão, design, estampagem, informática, redes, papelaria, web e serviços. Vendedores verificados, entregas na Beira e em todo Moçambique.",
      },
    ],
  }),
  component: LojaIndex,
});

// ── Motion variants ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardIn: any = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Product = Tables<"products"> & {
  product_categories: { name: string; slug: string } | null;
};

// ── Top category bar (Section 1) ──────────────────────────────────────────────

const TOP_CATS = [
  { id: "all",            label: "Tudo",        slugMatch: null },
  { id: "impressao",      label: "Impressão",   slugMatch: ["impressao"] },
  { id: "design",         label: "Design",      slugMatch: ["design-grafico"] },
  { id: "estampagem",     label: "Estampagem",  slugMatch: ["estampagem"] },
  { id: "informatica",    label: "Informática", slugMatch: ["formatacao-pc"] },
  { id: "redes",          label: "Redes",       slugMatch: ["redes-wifi"] },
  { id: "papelaria",      label: "Papelaria",   slugMatch: ["cadernos", "canetas-lapis", "pastas-arquivos", "material-escolar", "papel-blocos"] },
  { id: "web",            label: "Web",         slugMatch: ["web"] },
  { id: "digitais",       label: "Digitais",    slugMatch: ["digitais"] },
  { id: "servicos",       label: "Serviços",    slugMatch: ["impressao", "formatacao-pc", "redes-wifi", "design-grafico"] },
] as const;

type TopCatId = (typeof TOP_CATS)[number]["id"];

// ── Hero slide style variants (cycled by position) ───────────────────────────

const SLIDE_VARIANTS = [
  {
    eyebrow: "⚡ Flash Sale — Termina em:",
    bg: "bg-gradient-to-br from-[#0F2557] via-[#163469] to-[#1E3A8A]",
    accent: "bg-amber-400 hover:bg-amber-300 text-slate-900",
    showCountdown: true,
  },
  {
    eyebrow: "🛍️ Marketplace aberto",
    bg: "bg-gradient-to-br from-[#064E3B] via-[#066047] to-[#065F46]",
    accent: "bg-white hover:bg-slate-100 text-emerald-900",
    showCountdown: false,
  },
  {
    eyebrow: "📍 Serviços locais na Beira",
    bg: "bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#6D28D9]",
    accent: "bg-white hover:bg-slate-100 text-purple-900",
    showCountdown: false,
  },
] as const;

// Static fallback when the admin hasn't seeded `hero_images` for loja yet.
const FALLBACK_SLIDES: HeroImage[] = [
  {
    id: "fallback-1",
    title: "Até 40% de desconto",
    subtitle: "Em impressão e design — só hoje.",
    cta_label: "Ver ofertas",
    cta_url: "#flash-sales",
    image_url: "/images/hero-1.jpg",
    position: 1,
    active: true,
    page: "loja",
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-2",
    title: "Qualquer pessoa pode vender",
    subtitle: "Regista a tua loja e chega a milhares de clientes em Moçambique.",
    cta_label: "Começar a vender",
    cta_url: "/vendedor/registar",
    image_url: "/images/hero-2.jpg",
    position: 2,
    active: true,
    page: "loja",
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-3",
    title: "Entrega no mesmo dia",
    subtitle: "Impressão expressa, design rápido, TI ao domicílio.",
    cta_label: "Pedir agora",
    cta_url: "/orcamento",
    image_url: "/images/hero-3.jpg",
    position: 3,
    active: true,
    page: "loja",
    created_at: "",
    updated_at: "",
  },
];

// ── Category cards (Section 3) ────────────────────────────────────────────────

const CATEGORY_CARDS = [
  { id: "impressao",   label: "Impressão",       image: "/images/hero-1.jpg", emoji: "🖨️", tint: "" },
  { id: "design",      label: "Design Gráfico",  image: "/images/hero-2.jpg", emoji: "🎨", tint: "" },
  { id: "estampagem",  label: "Estampagem",      image: "/images/hero-3.jpg", emoji: "👕", tint: "" },
  { id: "informatica", label: "Informática",     image: "/images/hero-0.jpg", emoji: "💻", tint: "" },
  { id: "papelaria",   label: "Papelaria",       image: null,                 emoji: "📚", tint: "bg-[#EFF6FF] text-blue-900" },
  { id: "redes",       label: "Redes & TI",      image: null,                 emoji: "📶", tint: "bg-[#F0FDF4] text-emerald-900" },
  { id: "web",         label: "Web & Digital",   image: null,                 emoji: "🌐", tint: "bg-[#FAF5FF] text-purple-900" },
  { id: "servicos",    label: "Serviços",        image: null,                 emoji: "🛠️", tint: "bg-[#FFF7ED] text-orange-900" },
] as const;

// ── Countdown ─────────────────────────────────────────────────────────────────

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { hours, minutes, seconds };
}

function CountdownDigits({ targetMs, compact = false }: { targetMs: number; compact?: boolean }) {
  const { hours, minutes, seconds } = useCountdown(targetMs);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const size = compact ? "px-2 py-1 text-sm md:text-base" : "px-3 py-2 text-xl md:text-2xl";
  return (
    <div className="inline-flex items-center gap-1.5 font-mono">
      {[
        { v: pad(hours),   l: "h" },
        { v: pad(minutes), l: "m" },
        { v: pad(seconds), l: "s" },
      ].map((b, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className={`rounded-md bg-black/40 backdrop-blur-sm font-extrabold tabular-nums ${size}`}>
            {b.v}
          </span>
          {i < 2 && <span className="text-base font-bold opacity-70">:</span>}
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

function LojaIndex() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [activeCat, setActiveCat] = useState<TopCatId>("all");
  const [slide, setSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingFlash, setLoadingFlash] = useState(true);

  const { images: lojaHeroes, isLoading: heroesLoading } = useHeroImages("loja");
  const slides = useMemo<HeroImage[]>(() => {
    if (heroesLoading) return [];
    return lojaHeroes.length > 0 ? lojaHeroes : FALLBACK_SLIDES;
  }, [lojaHeroes, heroesLoading]);

  // Countdown target: 24 hours from first mount (stable per session).
  const countdownTarget = useMemo(() => Date.now() + 24 * 60 * 60 * 1000, []);

  // Auto-rotate hero slides every 4 seconds.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  // Reset slide index when slides change so we never point past the end.
  useEffect(() => {
    if (slide >= slides.length) setSlide(0);
  }, [slide, slides.length]);

  // Load all active products.
  useEffect(() => {
    setLoadingProducts(true);
    supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setProducts((data as Product[] | null) ?? []);
        setLoadingProducts(false);
      });
  }, []);

  // Load flash sales (any product with discount).
  useEffect(() => {
    setLoadingFlash(true);
    supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("active", true)
      .gt("discount_percent", 0)
      .order("discount_percent", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setFlashSales((data as Product[] | null) ?? []);
        setLoadingFlash(false);
      });
  }, []);

  const visibleProducts = useMemo(() => {
    if (activeCat === "all") return products;
    const def = TOP_CATS.find((c) => c.id === activeCat);
    const slugs = def?.slugMatch ?? null;
    if (!slugs) return products;
    return products.filter((p) => {
      const slug = p.product_categories?.slug;
      return slug ? slugs.includes(slug) : false;
    });
  }, [products, activeCat]);

  const handleAdd = useCallback(
    (p: Product) => {
      addItem({
        id: p.id,
        type: "produto",
        productId: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        brand: p.brand ?? undefined,
        image: p.image_url ?? undefined,
        weightKg: p.weight_kg,
        lengthCm: p.length_cm,
        widthCm: p.width_cm,
        heightCm: p.height_cm,
        shippingType: p.shipping_type as "local" | "national" | "international" | "digital",
        shippingOrigin: p.shipping_origin,
        freeShipping: p.free_shipping,
        expressAvailable: true,
        shippingFee: p.shipping_fee,
        internationalShippingFee: p.international_shipping_fee,
      });
      toast.success(`"${p.name}" no carrinho`);
    },
    [addItem],
  );

  const goCategoryCard = (id: string) => {
    if (id === "papelaria") {
      navigate({ to: "/loja/papelaria" });
      return;
    }
    if (["impressao", "design", "estampagem", "informatica", "redes", "web", "servicos"].includes(id)) {
      const slug =
        id === "design" ? "design-grafico" :
        id === "informatica" ? "formatacao-pc" :
        id === "redes" ? "redes-wifi" :
        id;
      navigate({ to: "/loja/papelaria", search: { tipo: "servico", categoria: slug } });
      return;
    }
    setActiveCat(id as TopCatId);
  };

  const safeIndex = slides.length > 0 ? slide % slides.length : 0;
  const currentSlide = slides[safeIndex] ?? null;
  const currentVariant = SLIDE_VARIANTS[safeIndex % SLIDE_VARIANTS.length];
  const ctaHref = currentSlide?.cta_url ?? "";
  const ctaIsAnchor = ctaHref.startsWith("#");

  return (
    <Layout>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 1 — MINIMAL CATEGORY PILLS
          ═════════════════════════════════════════════════════════════ */}
      <section className="sticky top-0 z-30 border-b border-border bg-white/95 dark:bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto max-w-6xl px-3 md:px-4">
          <div
            className="flex gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {TOP_CATS.map((c) => {
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  aria-pressed={active}
                  className={`shrink-0 rounded-full px-4 py-1.5 font-medium transition-colors duration-150 ${
                    active
                      ? "bg-[#1E3A8A] text-white border border-[#1E3A8A]"
                      : "bg-transparent text-muted-foreground border border-border hover:bg-secondary hover:text-foreground"
                  }`}
                  style={{ fontSize: "13px", borderWidth: active ? "1px" : "0.5px" }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 2 — HERO SLIDER + COUNTDOWN
          ═════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="relative h-[420px] md:h-[460px] w-full">
          {heroesLoading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F2557] to-[#1E3A8A] animate-pulse" />
          ) : currentSlide ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`absolute inset-0 ${currentVariant.bg} text-white`}
              >
                <div className="container mx-auto h-full max-w-6xl px-4">
                  <div className="grid h-full md:grid-cols-2 gap-6 md:gap-10 items-center">

                    {/* Left content */}
                    <div className="py-8 md:py-0">
                      <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-sm md:text-base font-semibold text-white/85 mb-3 flex flex-wrap items-center gap-2"
                      >
                        {currentVariant.eyebrow}
                        {currentVariant.showCountdown && (
                          <CountdownDigits targetMs={countdownTarget} />
                        )}
                      </motion.p>

                      {currentSlide.title && (
                        <motion.h1
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.55 }}
                          className="text-3xl md:text-5xl font-extrabold leading-[1.05] mb-4"
                        >
                          {currentSlide.title}
                        </motion.h1>
                      )}

                      {currentSlide.subtitle && (
                        <motion.p
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.55 }}
                          className="text-base md:text-lg text-white/85 mb-6 max-w-lg"
                        >
                          {currentSlide.subtitle}
                        </motion.p>
                      )}

                      {currentSlide.cta_label && ctaHref && (
                        <motion.div
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.55 }}
                        >
                          {ctaIsAnchor ? (
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(ctaHref.slice(1));
                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold shadow-card hover:shadow-elegant transition-smooth ${currentVariant.accent}`}
                            >
                              {currentSlide.cta_label} <ArrowRight className="h-4 w-4" />
                            </button>
                          ) : (
                            <a
                              href={ctaHref}
                              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold shadow-card hover:shadow-elegant transition-smooth ${currentVariant.accent}`}
                            >
                              {currentSlide.cta_label} <ArrowRight className="h-4 w-4" />
                            </a>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Right image */}
                    <motion.div
                      initial={{ opacity: 0, x: 40, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="relative hidden md:block"
                    >
                      <div className="relative aspect-[4/3] w-full max-w-md ml-auto">
                        <img
                          src={currentSlide.image_url}
                          alt={currentSlide.title ?? "Hero"}
                          className="absolute inset-0 h-full w-full rounded-2xl object-cover shadow-2xl border-4 border-white/15"
                        />
                        <div className="absolute -top-3 -right-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-slate-900 shadow-lg">
                          NEW
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F2557] to-[#1E3A8A] text-white grid place-items-center p-8 text-center">
              <div>
                <p className="text-xl font-bold">Sem banners configurados</p>
                <p className="mt-2 text-sm text-white/75">
                  Adiciona imagens em <span className="font-mono">/balcao/hero</span> para esta página.
                </p>
              </div>
            </div>
          )}

          {/* Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    safeIndex === i ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 3 — CATEGORY CARDS (AliExpress-style)
          ═════════════════════════════════════════════════════════════ */}
      <section className="bg-muted/40 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Explorar categorias</h2>
                <p className="text-sm text-muted-foreground mt-1">Encontra o que procuras em segundos.</p>
              </div>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {CATEGORY_CARDS.map((c) => (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => goCategoryCard(c.id)}
                  variants={cardIn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative h-[140px] overflow-hidden rounded-2xl shadow-card hover:shadow-elegant transition-smooth text-left"
                >
                  {c.image ? (
                    <>
                      <img
                        src={c.image}
                        alt={c.label}
                        className="absolute inset-0 h-full w-full object-cover transition-smooth duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent transition-smooth group-hover:from-black/60" />
                      <div className="relative h-full flex flex-col justify-end p-4">
                        <span className="text-3xl mb-1">{c.emoji}</span>
                        <p className="text-white font-bold text-base drop-shadow">{c.label}</p>
                      </div>
                    </>
                  ) : (
                    <div className={`relative h-full p-4 flex flex-col justify-between ${c.tint}`}>
                      <span className="text-4xl">{c.emoji}</span>
                      <div>
                        <p className="font-extrabold text-base leading-tight">{c.label}</p>
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold opacity-80">
                          Ver tudo <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 4 — FLASH SALES
          ═════════════════════════════════════════════════════════════ */}
      <section id="flash-sales" className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-12 border-y border-amber-200/60">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={fadeUp}>
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-lg">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">Ofertas do dia</h2>
                  <p className="text-sm text-muted-foreground">Preços reduzidos só por hoje.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Acaba em</span>
                <div className="text-rose-700">
                  <CountdownDigits targetMs={countdownTarget} compact />
                </div>
              </div>
            </div>

            {loadingFlash ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[180px] md:w-[200px] shrink-0">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : flashSales.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-white/60 p-8 text-center">
                <Flame className="mx-auto mb-3 h-8 w-8 text-amber-500" />
                <p className="text-sm font-semibold text-foreground">Ofertas a caminho.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estamos a preparar descontos exclusivos — volte em breve.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
                {flashSales.map((p) => (
                  <FlashSaleCard key={p.id} product={p} onAdd={handleAdd} onOpen={() => navigate({ to: "/loja/produto/$id", params: { id: p.id } })} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 5 — MULTI-VENDOR BANNER
          ═════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto max-w-6xl px-4 py-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="grid md:grid-cols-2 gap-4">

          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2557] to-[#1E3A8A] text-white p-7 md:p-9">
            <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                <ShieldCheck className="h-3.5 w-3.5" /> Comprador
              </span>
              <h3 className="mt-3 text-2xl font-extrabold leading-tight">
                Compra de vendedores<br />locais verificados
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/90">
                {["Entrega rápida na Beira", "Pagamento seguro M-Pesa / e-Mola / cartão", "Suporte humano 24 h"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-300" /> {t}
                  </li>
                ))}
              </ul>
              <Link
                to="/loja/papelaria"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1E3A8A] hover:bg-slate-100 transition-smooth"
              >
                Comprar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] to-[#065F46] text-white p-7 md:p-9">
            <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Store className="h-3.5 w-3.5" /> Vendedor
              </span>
              <h3 className="mt-3 text-2xl font-extrabold leading-tight">
                Vende os teus produtos<br />aqui na Giseveral
              </h3>
              <p className="mt-3 text-sm text-white/85 max-w-md">
                Regista a tua loja grátis e começa a vender hoje. Sem custos fixos — pagas apenas comissão sobre vendas.
              </p>
              <a
                href="/vendedor/registar"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-amber-300 transition-smooth"
              >
                Criar loja <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 6 — POPULAR PRODUCTS
          ═════════════════════════════════════════════════════════════ */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-7 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Produtos populares</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeCat === "all"
                    ? "Os preferidos da comunidade Giseveral."
                    : `A filtrar por: ${TOP_CATS.find((c) => c.id === activeCat)?.label ?? ""}`}
                </p>
              </div>
              <Link
                to="/loja/papelaria"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-gold transition-smooth"
              >
                Ver tudo <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Sem produtos nesta categoria.</p>
                <p className="text-xs text-muted-foreground mt-1">Tente outra ou volte ao topo.</p>
                <button
                  type="button"
                  onClick={() => setActiveCat("all")}
                  className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground hover:opacity-90 transition-smooth"
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {visibleProducts.slice(0, 15).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={() => handleAdd(p)}
                    onOpen={() => navigate({ to: "/loja/produto/$id", params: { id: p.id } })}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 7 — LOCAL / NATIONAL / INTERNATIONAL SHIPPING
          ═════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto max-w-6xl px-4 py-14">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Entregamos onde estiveres</h2>
            <p className="text-sm text-muted-foreground mt-2">Da Beira ao resto do mundo, com opções para cada bolso.</p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Package, badge: "📦", title: "Entrega local · Beira", desc: "Motoboy no mesmo dia", price: "a partir de 80 MZN", color: "from-blue-500/15 to-card border-blue-200" },
              { icon: Truck,   badge: "🚚", title: "Entrega nacional",       desc: "Todo Moçambique",       price: "3–5 dias úteis",     color: "from-emerald-500/15 to-card border-emerald-200" },
              { icon: Plane,   badge: "✈️", title: "Envio internacional",   desc: "DHL / FedEx",           price: "cotação por pedido", color: "from-purple-500/15 to-card border-purple-200" },
            ].map(({ icon: Icon, badge, title, desc, price, color }) => (
              <motion.div key={title} variants={cardIn} whileHover={{ y: -4 }} className={`group rounded-2xl border bg-gradient-to-br ${color} p-6 shadow-card hover:shadow-elegant transition-smooth`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-card text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl">{badge}</span>
                </div>
                <h3 className="text-base font-extrabold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand">
                  <MapPin className="h-3.5 w-3.5" /> {price}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 8 — SOCIAL + STORE FOOTER
          ═════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-brand to-brand/80 text-brand-foreground py-14">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-3">Comunidade Giseveral</p>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Segue-nos para novidades e promoções diárias</h2>
            <p className="text-sm text-brand-foreground/80 max-w-xl mx-auto mb-7">
              Ofertas relâmpago, novos vendedores e bastidores dos nossos serviços — tudo em primeira mão.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://facebook.com/GiseveralServices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-5 py-3 text-sm font-bold hover:bg-[#166FE5] transition-smooth shadow-card"
              >
                <Facebook className="h-4 w-4" /> Facebook
              </a>
              <a
                href="https://instagram.com/giseveral"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F56040] px-5 py-3 text-sm font-bold hover:opacity-90 transition-smooth shadow-card"
              >
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a
                href="https://wa.me/258874383621"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold hover:bg-[#20BD5A] transition-smooth shadow-card"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-6 text-xs text-brand-foreground/70">
              <Link to="/loja/papelaria" className="hover:text-amber-300 transition-smooth">Catálogo</Link>
              <Link to="/loja/carrinho" className="hover:text-amber-300 transition-smooth">Carrinho</Link>
              <Link to="/orcamento" className="hover:text-amber-300 transition-smooth">Orçamento</Link>
              <Link to="/contactos" className="hover:text-amber-300 transition-smooth">Contactos</Link>
            </div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}

// ── Product cards ─────────────────────────────────────────────────────────────

function FlashSaleCard({
  product,
  onAdd,
  onOpen,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  onOpen: () => void;
}) {
  const discount = product.discount_percent ?? 0;
  const original = product.compare_price ?? (discount > 0 ? product.price / (1 - discount / 100) : null);
  const soldPct = Math.min(95, 25 + (product.sales_count ?? 0) * 2);
  return (
    <motion.div
      variants={cardIn}
      whileHover={{ y: -3 }}
      className="w-[180px] md:w-[210px] shrink-0 snap-start rounded-2xl bg-white shadow-card overflow-hidden border border-amber-200/60"
    >
      <button type="button" onClick={onOpen} className="relative block aspect-square w-full bg-muted overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-smooth hover:scale-105" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10 opacity-40" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
            −{discount}%
          </span>
        )}
      </button>
      <div className="p-3">
        <button
          type="button"
          onClick={onOpen}
          className="text-xs font-semibold text-foreground truncate w-full text-left hover:text-brand transition-colors"
          title={product.name}
        >
          {product.name}
        </button>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-extrabold text-rose-600">{formatMZN(product.price)}</span>
          {original && original > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">{formatMZN(original)}</span>
          )}
        </div>
        <div className="mt-2.5">
          <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all" style={{ width: `${soldPct}%` }} />
          </div>
          <p className="mt-1 text-[10px] font-bold text-rose-600">{soldPct}% vendido</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={product.stock === 0}
          className="mt-2.5 w-full rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 py-2 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
        >
          {product.stock === 0 ? "Esgotado" : "Comprar"}
        </button>
      </div>
    </motion.div>
  );
}

function ProductCard({
  product,
  onAdd,
  onOpen,
}: {
  product: Product;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const rating = product.rating ?? 0;
  const reviewCount = product.review_count ?? 0;
  const seller = product.seller_name ?? "Giseveral";
  return (
    <motion.div variants={cardIn} whileHover={{ y: -4 }} className="group rounded-2xl bg-card shadow-card overflow-hidden border border-border hover:border-brand/30 hover:shadow-elegant transition-smooth flex flex-col">
      <button type="button" onClick={onOpen} className="relative block aspect-square w-full bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-smooth duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-30" />
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 grid place-items-center">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase">Esgotado</span>
          </div>
        )}
        {(product.discount_percent ?? 0) > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
            −{product.discount_percent}%
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); /* future wishlist */ }}
          className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-foreground shadow opacity-0 group-hover:opacity-100 hover:bg-white transition-smooth"
          aria-label="Adicionar à wishlist"
          title="Wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </button>

      <div className="flex flex-col flex-1 p-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand/80 truncate" title={seller}>
          {seller}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="mt-1 text-sm font-semibold text-foreground line-clamp-2 leading-snug text-left hover:text-brand transition-colors min-h-[2.5rem]"
          title={product.name}
        >
          {product.name}
        </button>

        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-foreground">{rating > 0 ? rating.toFixed(1) : "Novo"}</span>
          {reviewCount > 0 && <span>({reviewCount})</span>}
        </div>

        <div className="mt-auto pt-3">
          <p className="text-base font-extrabold text-brand">{formatMZN(product.price)}</p>
          <button
            type="button"
            onClick={onAdd}
            disabled={product.stock === 0}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-[11px] font-bold text-brand-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

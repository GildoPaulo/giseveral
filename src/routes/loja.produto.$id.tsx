import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShoppingCart, Zap, MessageCircle, Phone, Star, StarHalf,
  Truck, Shield, Package, HeadphonesIcon, ArrowLeft,
  Plus, Minus, ChevronRight, Check, Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/loja/produto/$id")({
  loader: async ({ params }) => {
    const { data: product, error } = await supabase
      .from("products")
      .select("*, product_categories(id, name, slug, type)")
      .eq("id", params.id)
      .eq("active", true)
      .single();

    if (error || !product) throw notFound();

    const { data: related } = await supabase
      .from("products")
      .select("id, name, price, compare_price, image_url, stock, unit")
      .eq("category_id", product.category_id)
      .eq("active", true)
      .neq("id", params.id)
      .limit(4);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id")
      .eq("product_id", params.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return { product, related: related ?? [], reviews: reviews ?? [] };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Produto — Giseveral" }] };
    return {
      meta: [
        { title: `${p.name} | Giseveral e Services — Beira` },
        { name: "description", content: p.description ?? `Compre ${p.name} na Giseveral e Services, Beira. Qualidade garantida.` },
        { property: "og:title", content: p.name },
        { property: "og:description", content: p.description ?? "" },
        { property: "og:image", content: p.image_url ?? "" },
        { property: "og:type", content: "product" },
      ],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <div className="container mx-auto px-4 py-24 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-brand">Produto não encontrado</h1>
        <Link to="/loja/papelaria" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar à loja
        </Link>
      </div>
    </Layout>
  ),
  component: ProdutoPage,
});

function stockInfo(stock: number) {
  if (stock === 0) return { label: "Esgotado", cls: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" };
  if (stock <= 5) return { label: `Últimas ${stock} unidades`, cls: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" };
  return { label: "Em stock", cls: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" };
}

function avgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return filled ? (
          <Star key={i} className={`${cls} text-gold fill-gold`} />
        ) : half ? (
          <StarHalf key={i} className={`${cls} text-gold fill-gold`} />
        ) : (
          <Star key={i} className={`${cls} text-muted-foreground/30`} />
        );
      })}
    </span>
  );
}

function ProdutoPage() {
  const { product, related, reviews } = Route.useLoaderData();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"descricao" | "avaliacoes">("descricao");
  const [activeImg, setActiveImg] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  async function handleSubmitReview() {
    if (!user || reviewRating === 0) return;
    setReviewSubmitting(true);
    const { error } = await supabase
      .from("reviews")
      .insert({ product_id: product.id, user_id: user.id, rating: reviewRating, comment: reviewComment.trim() || null });
    if (error) {
      if (error.code === "23505") toast.error("Já avaliaste este produto.");
      else toast.error("Só podes avaliar após receber uma encomenda entregue.");
    } else {
      toast.success("Avaliação submetida! Obrigado.");
      setLocalReviews((prev) => [...prev, {
        id: crypto.randomUUID(), product_id: product.id, user_id: user.id,
        order_id: null, rating: reviewRating, comment: reviewComment.trim() || null,
        created_at: new Date().toISOString(),
      }]);
      setReviewRating(0);
      setReviewComment("");
    }
    setReviewSubmitting(false);
  }

  const specs = product.specs as Record<string, string | number>;
  const avg = avgRating(localReviews);
  const { label: stockLabel, cls: stockCls, dot: stockDot } = stockInfo(product.stock);
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  // Multiple images: use image_url as main, then cycle placeholders
  const images = product.image_url
    ? [product.image_url]
    : [];

  const whatsappMsg = encodeURIComponent(
    `Olá! Quero comprar:\n📦 *${product.name}*${product.brand ? ` (${product.brand})` : ""}\n🔢 Quantidade: ${qty}\n💰 Preço: ${(product.price * qty).toLocaleString("pt-MZ")} MZN\n\nPor favor confirme disponibilidade. Obrigado!`
  );

  function handleAddToCart() {
    addItem({
      id: product.id,
      type: "produto",
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      unit: product.unit,
      brand: product.brand ?? undefined,
      image: product.image_url ?? undefined,
      weightKg: product.weight_kg,
      lengthCm: product.length_cm,
      widthCm: product.width_cm,
      heightCm: product.height_cm,
      shippingType: product.shipping_type as "local" | "national" | "international" | "digital",
      shippingOrigin: product.shipping_origin,
      freeShipping: product.free_shipping,
      expressAvailable: product.express_available,
      shippingFee: product.shipping_fee,
      internationalShippingFee: product.international_shipping_fee,
    });
    toast.success(`"${product.name}" adicionado ao carrinho`);
  }

  function handleBuyNow() {
    handleAddToCart();
    navigate({ to: "/loja/checkout" });
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <nav className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-brand transition-colors">Início</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link to="/loja" className="hover:text-brand transition-colors">Loja</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link to="/loja/papelaria" className="hover:text-brand transition-colors">
            {product.product_categories?.name ?? "Produtos"}
          </Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="text-foreground font-medium truncate max-w-40">{product.name}</span>
        </nav>
      </div>

      {/* Main product section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-10">

          {/* ── LEFT: Image gallery ─────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl bg-muted aspect-square flex items-center justify-center border border-border">
              {images.length > 0 && !imgError ? (
                <img
                  src={images[activeImg] ?? images[0]}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 hover:scale-105 transition-smooth"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Package className="h-16 w-16 opacity-30" />
                  <span className="text-sm">Sem imagem disponível</span>
                </div>
              )}
              {discount && (
                <div className="absolute top-3 left-3 rounded-md bg-red-500 text-white text-sm font-bold px-2.5 py-1">
                  -{discount}%
                </div>
              )}
              {product.featured && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-gold text-gold-foreground text-xs font-bold px-2 py-1">
                  <Star className="h-3 w-3 fill-current" /> Destaque
                </div>
              )}
            </div>

            {/* Thumbnails — if more images in future */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 h-16 w-16 rounded-lg border-2 overflow-hidden transition-smooth ${activeImg === i ? "border-brand" : "border-border hover:border-brand/50"}`}
                  >
                    <img src={src} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {[
                { icon: Shield, label: "Qualidade garantida" },
                { icon: Truck, label: "Entrega disponível" },
                { icon: HeadphonesIcon, label: "Suporte rápido" },
                { icon: Package, label: "Embalagem segura" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-2.5 text-center">
                  <Icon className="h-4 w-4 text-brand" />
                  <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Product info ─────────────────────────── */}
          <div className="space-y-5">
            {/* Category */}
            {product.product_categories && (
              <Link
                to="/loja/papelaria"
                search={{ categoria: product.product_categories.slug }}
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
              >
                {product.product_categories.name}
              </Link>
            )}

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-sm text-muted-foreground -mt-3">Marca: <span className="font-medium text-foreground">{product.brand}</span></p>
            )}

            {/* Rating */}
            {localReviews.length > 0 ? (
              <div className="flex items-center gap-2">
                <StarDisplay rating={avg} />
                <span className="text-sm font-semibold text-foreground">{avg.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({localReviews.length} avaliações)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <StarDisplay rating={0} />
                <span className="text-xs text-muted-foreground">Sem avaliações ainda — sê o primeiro</span>
              </div>
            )}

            {/* Price */}
            <div className="rounded-xl bg-muted/40 border border-border p-4">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-bold text-brand">
                  {product.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                </span>
                <span className="text-sm text-muted-foreground">/{product.unit}</span>
              </div>
              {product.compare_price && product.compare_price > product.price && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground line-through">
                    {product.compare_price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                  </span>
                  <span className="rounded-md bg-red-500 text-white text-xs font-bold px-1.5 py-0.5">
                    -{discount}% OFF
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    Poupa {(product.compare_price - product.price).toLocaleString("pt-MZ")} MZN
                  </span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${stockCls}`}>
              <span className={`h-2 w-2 rounded-full ${stockDot}`} />
              {stockLabel}
            </div>

            {/* Quantity selector */}
            {product.stock > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Quantidade</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-4 py-2.5 hover:bg-muted transition-colors border-r border-border"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-5 py-2.5 font-bold text-lg min-w-[3rem] text-center">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="px-4 py-2.5 hover:bg-muted transition-colors border-l border-border"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Total: <strong className="text-brand">{(product.price * qty).toLocaleString("pt-MZ")} MZN</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4" />
                  Comprar Já
                </button>
              </div>

              {/* WhatsApp buy */}
              <a
                href={`https://wa.me/258874383621?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-card hover:shadow-elegant transition-smooth"
              >
                <MessageCircle className="h-4 w-4" />
                Comprar via WhatsApp
              </a>

              {/* Share */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copiado!");
                  }
                }}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
              >
                <Share2 className="h-3.5 w-3.5" />
                Partilhar produto
              </button>
            </div>

            {/* Quick specs */}
            {Object.keys(specs).length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Especificações rápidas
                </div>
                <div className="divide-y divide-border">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="flex px-4 py-2 text-sm">
                      <span className="w-32 flex-shrink-0 text-muted-foreground capitalize">{k}</span>
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TABS: Description + Reviews ─────────────────── */}
        <div className="mt-12">
          <div className="flex border-b border-border">
            {[
              { id: "descricao" as const, label: "Descrição" },
              { id: "avaliacoes" as const, label: `Avaliações (${localReviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-semibold transition-smooth border-b-2 -mb-px ${activeTab === tab.id ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Description tab */}
          {activeTab === "descricao" && (
            <div className="py-8 max-w-3xl">
              {product.description ? (
            /<[^>]+>/.test(product.description) ? (
              <div className="prose prose-sm text-foreground/85" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="text-foreground/85 leading-relaxed text-base">{product.description}</p>
            )
          ) : (
            <p className="text-muted-foreground">Sem descrição detalhada disponível.</p>
          )}

              {Object.keys(specs).length > 0 && (
                <div className="mt-8">
                  <h3 className="font-bold text-brand mb-4">Características do produto</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(specs).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground capitalize">{k}:</span>
                        <span className="text-sm font-semibold text-foreground">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-xl bg-gradient-hero text-brand-foreground p-5">
                <p className="text-sm font-semibold text-gold mb-1">Qualidade Giseveral e Services</p>
                <p className="text-sm text-brand-foreground/80">
                  "Qualidade garantida para o seu dia a dia. Todos os produtos são verificados antes da venda."
                </p>
                <div className="mt-3 flex gap-3">
                  <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">
                    <MessageCircle className="h-3.5 w-3.5" /> Tirar dúvidas
                  </a>
                  <a href="tel:+258874383621" className="inline-flex items-center gap-1.5 rounded-md border border-brand-foreground/30 px-3 py-1.5 text-xs font-semibold text-brand-foreground">
                    <Phone className="h-3.5 w-3.5" /> 874 383 621
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === "avaliacoes" && (
            <div className="py-8 max-w-3xl space-y-6">
              {localReviews.length > 0 && (
                <>
                  {/* Summary */}
                  <div className="flex items-center gap-6 p-5 rounded-xl border border-border bg-muted/30">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-brand">{avg.toFixed(1)}</p>
                      <StarDisplay rating={avg} size="lg" />
                      <p className="text-xs text-muted-foreground mt-1">{localReviews.length} avaliações</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = localReviews.filter((r) => r.rating === star).length;
                        const pct = localReviews.length ? (count / localReviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-muted-foreground">{star}</span>
                            <Star className="h-3 w-3 text-gold fill-gold" />
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-gold rounded-full transition-smooth" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-5 text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review list */}
                  <div className="space-y-4">
                    {localReviews.map((r) => (
                      <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <StarDisplay rating={r.rating} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">"{r.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {localReviews.length === 0 && (
                <div className="text-center py-10">
                  <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium text-foreground">Sem avaliações ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">Sê o primeiro a avaliar este produto!</p>
                </div>
              )}

              {/* Review form */}
              {user ? (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Deixa a tua avaliação</h3>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Classificação *</p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="transition-transform hover:scale-110"
                          aria-label={`${star} estrelas`}
                        >
                          <Star className={`h-7 w-7 ${star <= reviewRating ? "text-gold fill-gold" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Comentário (opcional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Partilha a tua experiência com este produto..."
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                  >
                    {reviewSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> A submeter...</> : <><Star className="h-4 w-4" /> Submeter avaliação</>}
                  </button>
                  <p className="text-xs text-muted-foreground">Só é possível avaliar após receber uma encomenda deste produto.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Inicia sessão para deixar uma avaliação</p>
                  <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
                    Iniciar sessão
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RELATED PRODUCTS ────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-brand">Clientes também compraram</h2>
              <Link to="/loja/papelaria" className="text-sm text-muted-foreground hover:text-brand transition-colors">
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => {
                const relDiscount = p.compare_price && p.compare_price > p.price
                  ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
                  : null;
                return (
                  <Link
                    key={p.id}
                    to="/loja/produto/$id"
                    params={{ id: p.id }}
                    className="group rounded-xl border border-border bg-card shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-smooth overflow-hidden"
                  >
                    <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      )}
                      {relDiscount && (
                        <span className="absolute top-2 left-2 rounded bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                          -{relDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-brand transition-colors">{p.name}</p>
                      <p className="mt-1 text-sm font-bold text-brand">{p.price.toLocaleString("pt-MZ")} MZN</p>
                      {p.compare_price && p.compare_price > p.price && (
                        <p className="text-xs text-muted-foreground line-through">{p.compare_price.toLocaleString("pt-MZ")} MZN</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <WhatsAppFab />
    </Layout>
  );
}

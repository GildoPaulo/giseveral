import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react";
import { Layout, PageHero } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";

export const Route = createFileRoute("/loja/carrinho")({
  head: () => ({
    meta: [{ title: "Carrinho – Loja Giseveral" }],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <PageHero title="O Meu Carrinho" />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Carrinho vazio</h2>
          <p className="mt-2 text-muted-foreground text-sm">Ainda não adicionaste nenhum produto.</p>
          <Link
            to="/loja/papelaria"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          >
            <ShoppingBag className="h-4 w-4" /> Ver Produtos
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero title="O Meu Carrinho" subtitle={`${items.length} item${items.length !== 1 ? "s" : ""} no carrinho`} />

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                {/* Image / icon */}
                <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${item.type === "produto" ? "text-gold" : "text-brand"}`}>
                        {item.type === "produto" ? "Produto" : "Serviço"}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground leading-snug">{item.name}</h3>
                      {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                      {item.serviceDetails && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.serviceDetails.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {/* Quantity controls */}
                    {item.type === "produto" ? (
                      <div className="flex items-center gap-1 rounded-md border border-border overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-muted transition-smooth"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm font-medium min-w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-muted transition-smooth"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Serviço</span>
                    )}

                    <span className="font-bold text-brand">
                      {(item.price * item.quantity).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card shadow-card p-6">
              <h2 className="text-lg font-bold text-brand mb-4">Resumo do Pedido</h2>

              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">
                      {(item.price * item.quantity).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="flex justify-between font-semibold text-sm">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa de entrega calculada no checkout
                </p>
              </div>

              <Link
                to="/loja/checkout"
                className="mt-6 flex items-center justify-center gap-2 w-full rounded-md bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
              >
                Finalizar Pedido <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/loja/papelaria"
                className="mt-3 flex items-center justify-center gap-2 w-full rounded-md border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-smooth"
              >
                Continuar a Comprar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

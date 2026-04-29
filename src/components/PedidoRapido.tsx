import { useState } from "react";
import { Zap, X, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PedidoRapidoProps {
  productName?: string;
  productId?: string;
  productPrice?: number;
}

export function PedidoRapidoButton({ productName, productId, productPrice }: PedidoRapidoProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand transition-colors"
      >
        <Zap className="h-3.5 w-3.5" />
        Pedido Rápido
      </button>
      {open && (
        <PedidoRapidoModal
          productName={productName}
          productId={productId}
          productPrice={productPrice}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PedidoRapidoModal({
  productName,
  productId,
  productPrice,
  onClose,
}: PedidoRapidoProps & { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState(productName ?? "");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const unitPrice = productPrice ?? 0;
  const total = unitPrice * quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !description.trim()) {
      toast.error("Preenche o nome, telefone e descrição");
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      toast.error("Número de telefone inválido");
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          neighborhood: "A confirmar",
          delivery_type: "pickup",
          subtotal: total,
          total,
          payment_method: "cash",
          notes: `PEDIDO RÁPIDO${productName ? ` — ${productName}` : ""}`,
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr;

      await supabase.from("order_items").insert({
        order_id: order.id,
        item_type: productId ? "produto" : "servico",
        product_id: productId ?? null,
        name: description.trim(),
        quantity,
        unit_price: unitPrice,
        subtotal: total,
      });

      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-foreground mb-1">Pedido recebido!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Entraremos em contacto em breve pelo número <strong>{phone}</strong>.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-md bg-gradient-gold text-sm font-semibold text-gold-foreground"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                <Zap className="h-4 w-4 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Pedido Rápido</h3>
                <p className="text-xs text-muted-foreground">Sem conta — entramos em contacto contigo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">O que precisas? *</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Impressão de 10 páginas A4, Caderno universitário..."
                  className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {unitPrice > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-foreground">Quantidade</label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-8 w-8 rounded-md border border-border text-sm font-bold hover:bg-muted transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="h-8 w-8 rounded-md border border-border text-sm font-bold hover:bg-muted transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total estimado</p>
                    <p className="font-bold text-brand">{total.toLocaleString("pt-MZ")} MZN</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Nome *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Teu nome"
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Telefone *</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="84 000 0000"
                    type="tel"
                    className="mt-1 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Ao confirmar, a Giseveral entrará em contacto para finalizar o pedido e confirmar o preço.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full rounded-md bg-gradient-gold py-2.5 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Confirmar Pedido Rápido</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

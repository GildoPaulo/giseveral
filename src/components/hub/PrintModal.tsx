import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Printer, MessageCircle } from "lucide-react";
import { HUB_SITE } from "@/data/hub-site";
import { DocItem } from "@/data/hub-documents";

interface Props {
  doc: DocItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PrintModal({ doc, open, onOpenChange }: Props) {
  const [color, setColor] = useState<"bw" | "color">("bw");
  const [duplex, setDuplex] = useState<"simplex" | "duplex">("simplex");

  const pricePerPage = color === "bw" ? HUB_SITE.pricePerPageBW : HUB_SITE.pricePerPageColor;
  const subtotal = pricePerPage * doc.pages;
  const total = duplex === "duplex" ? Math.round(subtotal * (1 + HUB_SITE.duplexSurcharge)) : subtotal;

  const message = encodeURIComponent(
    `Olá Giseveral! 👋\n\nGostaria de orçamento para imprimir:\n\n📄 *${doc.title}*\n📝 Páginas: ${doc.pages}\n🎨 Tipo: ${color === "bw" ? "Preto e Branco" : "Cores"}\n📑 Faces: ${duplex === "duplex" ? "Dupla face" : "Simples face"}\n\n💰 Estimativa: ${total} MZN\n\nObrigado!`,
  );
  const whatsappUrl = `https://wa.me/${HUB_SITE.whatsappPrint}?text=${message}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold text-gold-foreground">
              <Printer className="h-5 w-5" />
            </div>
            <DialogTitle>Orçamento de Impressão</DialogTitle>
          </div>
          <DialogDescription className="line-clamp-2">{doc.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Total de páginas</span>
            <span className="font-semibold text-foreground">{doc.pages} páginas</span>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Tipo de impressão</Label>
            <RadioGroup value={color} onValueChange={(v) => setColor(v as "bw" | "color")} className="grid grid-cols-2 gap-2">
              <label
                htmlFor="bw"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${color === "bw" ? "border-brand bg-muted" : "border-border hover:border-brand/40"}`}
              >
                <RadioGroupItem value="bw" id="bw" className="sr-only" />
                <span className="font-semibold text-sm">Preto e Branco</span>
                <span className="text-xs text-muted-foreground">{HUB_SITE.pricePerPageBW} MZN/página</span>
              </label>
              <label
                htmlFor="color"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${color === "color" ? "border-brand bg-muted" : "border-border hover:border-brand/40"}`}
              >
                <RadioGroupItem value="color" id="color" className="sr-only" />
                <span className="font-semibold text-sm">A Cores</span>
                <span className="text-xs text-muted-foreground">{HUB_SITE.pricePerPageColor} MZN/página</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Faces</Label>
            <RadioGroup value={duplex} onValueChange={(v) => setDuplex(v as "simplex" | "duplex")} className="grid grid-cols-2 gap-2">
              <label
                htmlFor="simplex"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${duplex === "simplex" ? "border-brand bg-muted" : "border-border hover:border-brand/40"}`}
              >
                <RadioGroupItem value="simplex" id="simplex" className="sr-only" />
                <span className="font-semibold text-sm">Simples face</span>
                <span className="text-xs text-muted-foreground">Padrão</span>
              </label>
              <label
                htmlFor="duplex"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${duplex === "duplex" ? "border-brand bg-muted" : "border-border hover:border-brand/40"}`}
              >
                <RadioGroupItem value="duplex" id="duplex" className="sr-only" />
                <span className="font-semibold text-sm">Dupla face</span>
                <span className="text-xs text-muted-foreground">+10%</span>
              </label>
            </RadioGroup>
          </div>

          <div className="rounded-xl bg-gradient-hero text-brand-foreground p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Estimativa Total</div>
              <div className="text-3xl font-bold text-gold">{total} MZN</div>
            </div>
            <Printer className="h-10 w-10 opacity-30" />
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white hover:shadow-elegant transition-shadow"
          >
            <MessageCircle className="h-5 w-5" />
            Solicitar no WhatsApp
          </a>
          <p className="text-[11px] text-center text-muted-foreground">
            Será redirecionado para o WhatsApp da Gráfica Giseveral. Valor final pode variar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Printer, MessageCircle } from "lucide-react";
import { SITE } from "@/data/site";
import { DocItem } from "@/data/documents";

interface Props {
  doc: DocItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const PrintModal = ({ doc, open, onOpenChange }: Props) => {
  const [color, setColor] = useState<"bw" | "color">("bw");
  const [duplex, setDuplex] = useState<"simplex" | "duplex">("simplex");

  const pricePerPage = color === "bw" ? SITE.pricePerPageBW : SITE.pricePerPageColor;
  const subtotal = pricePerPage * doc.pages;
  const total = duplex === "duplex" ? Math.round(subtotal * (1 + SITE.duplexSurcharge)) : subtotal;

  const message = encodeURIComponent(
    `Olá Giseveral! 👋\n\nGostaria de orçamento para imprimir:\n\n📄 *${doc.title}*\n📝 Páginas: ${doc.pages}\n🎨 Tipo: ${color === "bw" ? "Preto e Branco" : "Cores"}\n📑 Faces: ${duplex === "duplex" ? "Dupla face" : "Simples face"}\n\n💰 Estimativa: ${total} MZN\n\nObrigado!`,
  );
  const whatsappUrl = `https://wa.me/${SITE.whatsappPrint}?text=${message}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Printer className="h-5 w-5" />
            </div>
            <DialogTitle className="font-display">Orçamento de Impressão</DialogTitle>
          </div>
          <DialogDescription className="line-clamp-2">{doc.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Total de páginas</span>
            <span className="font-semibold text-foreground">{doc.pages} páginas</span>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Tipo de impressão</Label>
            <RadioGroup value={color} onValueChange={(v) => setColor(v as any)} className="grid grid-cols-2 gap-2">
              <label
                htmlFor="bw"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${color === "bw" ? "border-primary bg-secondary" : "border-border hover:border-primary/40"}`}
              >
                <RadioGroupItem value="bw" id="bw" className="sr-only" />
                <span className="font-semibold text-sm">Preto e Branco</span>
                <span className="text-xs text-muted-foreground">{SITE.pricePerPageBW} MZN/página</span>
              </label>
              <label
                htmlFor="color"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${color === "color" ? "border-primary bg-secondary" : "border-border hover:border-primary/40"}`}
              >
                <RadioGroupItem value="color" id="color" className="sr-only" />
                <span className="font-semibold text-sm">A Cores</span>
                <span className="text-xs text-muted-foreground">{SITE.pricePerPageColor} MZN/página</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Faces</Label>
            <RadioGroup value={duplex} onValueChange={(v) => setDuplex(v as any)} className="grid grid-cols-2 gap-2">
              <label
                htmlFor="simplex"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${duplex === "simplex" ? "border-primary bg-secondary" : "border-border hover:border-primary/40"}`}
              >
                <RadioGroupItem value="simplex" id="simplex" className="sr-only" />
                <span className="font-semibold text-sm">Simples face</span>
                <span className="text-xs text-muted-foreground">Padrão</span>
              </label>
              <label
                htmlFor="duplex"
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-smooth ${duplex === "duplex" ? "border-primary bg-secondary" : "border-border hover:border-primary/40"}`}
              >
                <RadioGroupItem value="duplex" id="duplex" className="sr-only" />
                <span className="font-semibold text-sm">Dupla face</span>
                <span className="text-xs text-muted-foreground">+10%</span>
              </label>
            </RadioGroup>
          </div>

          <div className="rounded-xl bg-gradient-hero text-primary-foreground p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Estimativa Total</div>
              <div className="text-3xl font-display font-bold text-accent">{total} MZN</div>
            </div>
            <Printer className="h-10 w-10 opacity-30" />
          </div>

          <Button asChild variant="whatsapp" size="lg" className="w-full">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Solicitar no WhatsApp
            </a>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Será redirecionado para o WhatsApp da Gráfica Giseveral. Valor final pode variar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

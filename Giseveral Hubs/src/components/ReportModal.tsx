import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocItem } from "@/data/documents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  doc: DocItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const REASONS = [
  { id: "Violação de direitos autorais", label: "Violação de direitos autorais" },
  { id: "Conteúdo impróprio ou ofensivo", label: "Conteúdo impróprio ou ofensivo" },
  { id: "Spam ou enganoso", label: "Spam ou enganoso" },
  { id: "Informação incorreta", label: "Informação incorreta" },
  { id: "Outro motivo", label: "Outro motivo" },
];

export const ReportModal = ({ doc, open, onOpenChange }: Props) => {
  const [reason, setReason] = useState(REASONS[0].id);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!user) {
      toast({ title: "Inicie sessão", description: "Precisa de uma conta para denunciar." });
      onOpenChange(false);
      navigate("/login");
      return;
    }
    setBusy(true);
    // Mock docs use string IDs that don't exist in DB; only insert if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.id);
    if (!isUuid) {
      // Demo content — don't fail, just acknowledge
      toast({ title: "Denúncia registada", description: "Documento de demonstração — denúncia simulada." });
      setBusy(false);
      setDetails("");
      onOpenChange(false);
      return;
    }
    const { error } = await supabase.from("reports").insert({
      document_id: doc.id,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Denúncia enviada", description: "A nossa equipa vai analisar o documento." });
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="font-display">Denunciar Documento</DialogTitle>
          </div>
          <DialogDescription className="line-clamp-2">{doc.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="font-semibold">Motivo da denúncia</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
              {REASONS.map((r) => (
                <label key={r.id} htmlFor={r.id} className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-smooth ${reason === r.id ? "border-primary bg-secondary" : "border-border hover:border-primary/40"}`}>
                  <RadioGroupItem value={r.id} id={r.id} />
                  <span className="text-sm font-medium">{r.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="font-semibold">Detalhes adicionais (opcional)</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder="Descreva o problema..." className="resize-none" rows={4} />
            <p className="text-[11px] text-muted-foreground text-right">{details.length}/500</p>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span>A sua denúncia é confidencial. Falsas denúncias podem resultar em suspensão da conta.</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enviar Denúncia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

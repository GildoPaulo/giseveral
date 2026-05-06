import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/data/documents";
import { SITE } from "@/data/site";
import { Upload as UploadIcon, FileText, Coins, CheckCircle2 } from "lucide-react";

const Upload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Anexe um ficheiro PDF", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({
      title: "Documento submetido!",
      description: `Será revisto em breve. Receberá ${SITE.creditsPerUpload} créditos após aprovação.`,
    });
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto container-px py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="font-display font-bold text-3xl mb-3">Submetido com sucesso!</h1>
            <p className="text-muted-foreground mb-6">
              O seu documento está em revisão. Após aprovação, ganhará <strong className="text-accent-foreground bg-accent/30 px-1 rounded">{SITE.creditsPerUpload} créditos</strong> e ficará disponível para a comunidade.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="mr-2">Enviar outro</Button>
            <Button asChild><a href="/perfil">Ir ao perfil</a></Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container mx-auto container-px max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-4">
            <Coins className="h-3.5 w-3.5" /> +{SITE.creditsPerUpload} CRÉDITOS POR UPLOAD
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2">Partilhe um documento</h1>
          <p className="opacity-90">Contribua com a comunidade e ganhe créditos para descarregar.</p>
        </div>
      </section>

      <section className="container mx-auto container-px py-10">
        <form onSubmit={submit} className="max-w-3xl mx-auto rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
          {/* DROPZONE */}
          <div>
            <Label className="font-semibold mb-2 block">Ficheiro PDF *</Label>
            <label
              htmlFor="file"
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-smooth ${file ? "border-success bg-success/5" : "border-border hover:border-primary hover:bg-secondary/40"}`}
            >
              <input
                id="file"
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-success text-success-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · clique para mudar</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                    <UploadIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">Clique para escolher um PDF</div>
                    <div className="text-xs text-muted-foreground">Tamanho máximo: 20 MB</div>
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Título do documento *</Label>
            <Input id="title" placeholder="Ex: Exame de Admissão UEM 2024" required />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat">Categoria *</Label>
              <Select required>
                <SelectTrigger id="cat"><SelectValue placeholder="Escolher..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" placeholder="UEM, Engenharia, 2024" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Descrição *</Label>
            <Textarea id="desc" placeholder="Descreva brevemente o conteúdo deste documento..." rows={4} maxLength={500} required />
          </div>

          <div className="rounded-xl bg-secondary/60 p-4 flex items-start gap-3 text-sm">
            <Coins className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="text-muted-foreground">
              Após aprovação pela equipa, ganhará <strong className="text-foreground">{SITE.creditsPerUpload} créditos</strong> que pode usar para descarregar outros documentos.
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full">
            <UploadIcon className="h-5 w-5" /> Enviar documento
          </Button>
        </form>
      </section>
    </Layout>
  );
};

export default Upload;

import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Crown, Check, X, Sparkles } from "lucide-react";
import { SITE } from "@/data/site";
import { SEO } from "@/components/SEO";

const features = [
  { feat: "Visualização online", free: true, premium: true },
  { feat: "Upload de documentos", free: true, premium: true },
  { feat: "Downloads", free: `${SITE.creditsPerDownload} crédito cada`, premium: "Ilimitados" },
  { feat: "Anúncios", free: "Sim", premium: "Sem anúncios" },
  { feat: "Marca d'água na pré-visualização", free: "Sim", premium: "Sim" },
  { feat: "Acesso a documentos Premium", free: false, premium: true },
  { feat: "Suporte prioritário", free: false, premium: true },
  { feat: "Desconto na impressão", free: false, premium: "10% off" },
];

const Premium = () => {
  return (
    <Layout>
      <SEO
        title="Giseveral Premium — Downloads ilimitados sem anúncios"
        description={`Por apenas ${SITE.premiumMonthly} MZN/mês descarregue todos os documentos sem limites e sem anúncios.`}
      />
      <section className="bg-gradient-hero text-primary-foreground py-16 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="container mx-auto container-px relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-bold mb-5 shadow-accent">
            <Crown className="h-4 w-4" /> GISEVERAL PREMIUM
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4 text-balance">
            Liberte todo o potencial<br/>do <span className="text-accent">Giseveral Hub</span>
          </h1>
          <p className="opacity-90 max-w-xl mx-auto text-lg">
            Downloads ilimitados, sem anúncios, e acesso completo aos documentos Premium da comunidade.
          </p>
        </div>
      </section>

      <section className="container mx-auto container-px py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="rounded-2xl bg-card border border-border p-8 shadow-card">
            <h3 className="font-display font-bold text-xl mb-1">Grátis</h3>
            <p className="text-sm text-muted-foreground mb-5">Para começar</p>
            <div className="mb-6">
              <span className="text-5xl font-display font-bold">0</span>
              <span className="text-muted-foreground"> MZN/mês</span>
            </div>
            <Button variant="outline" size="lg" className="w-full mb-6">Plano actual</Button>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-5 w-5 text-success shrink-0" /> {SITE.initialCredits} créditos iniciais</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-success shrink-0" /> {SITE.creditsPerUpload} créditos por upload</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-success shrink-0" /> Visualização ilimitada</li>
              <li className="flex gap-2 text-muted-foreground"><X className="h-5 w-5 shrink-0" /> Com anúncios</li>
              <li className="flex gap-2 text-muted-foreground"><X className="h-5 w-5 shrink-0" /> Sem acesso Premium</li>
            </ul>
          </div>

          {/* PREMIUM */}
          <div className="rounded-2xl bg-gradient-hero text-primary-foreground border-2 border-accent p-8 shadow-elegant relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 text-xs font-bold rounded-bl-xl">
              <Sparkles className="h-3 w-3 inline mr-1" /> RECOMENDADO
            </div>
            <h3 className="font-display font-bold text-xl mb-1 flex items-center gap-2"><Crown className="h-5 w-5 text-accent" /> Premium</h3>
            <p className="text-sm opacity-80 mb-5">Para utilizadores frequentes</p>
            <div className="mb-6">
              <span className="text-5xl font-display font-bold text-accent">{SITE.premiumMonthly}</span>
              <span className="opacity-80"> MZN/mês</span>
            </div>
            <Button variant="hero" size="lg" className="w-full mb-6">Tornar-me Premium</Button>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-5 w-5 text-accent shrink-0" /> Downloads ilimitados</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-accent shrink-0" /> Sem anúncios</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-accent shrink-0" /> Acesso a todos os documentos Premium</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-accent shrink-0" /> 10% desconto na impressão</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-accent shrink-0" /> Suporte prioritário</li>
            </ul>
          </div>
        </div>

        {/* COMPARISON */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-center mb-6">Comparação detalhada</h2>
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-4 font-semibold">Funcionalidade</th>
                  <th className="text-center p-4 font-semibold">Grátis</th>
                  <th className="text-center p-4 font-semibold text-primary">Premium</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-4">{f.feat}</td>
                    <td className="text-center p-4 text-muted-foreground">
                      {typeof f.free === "boolean" ? (f.free ? <Check className="h-5 w-5 mx-auto text-success" /> : <X className="h-5 w-5 mx-auto text-muted-foreground" />) : f.free}
                    </td>
                    <td className="text-center p-4 font-medium text-primary">
                      {typeof f.premium === "boolean" ? (f.premium ? <Check className="h-5 w-5 mx-auto text-success" /> : <X className="h-5 w-5 mx-auto" />) : f.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Premium;

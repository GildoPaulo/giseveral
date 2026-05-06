import { Layout } from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle, ArrowRight } from "lucide-react";
import { SITE } from "@/data/site";
import { SEO } from "@/components/SEO";

const FAQ_GROUPS = [
  {
    title: "Conta e créditos",
    items: [
      {
        q: "Como funciona o sistema de créditos?",
        a: `Ao criar conta recebe ${SITE.initialCredits} créditos grátis. Cada download custa ${SITE.creditsPerDownload} crédito. Por cada documento que envia e for aprovado, ganha ${SITE.creditsPerUpload} créditos.`,
      },
      {
        q: "É grátis criar uma conta?",
        a: "Sim, totalmente grátis. Basta o seu e-mail, sem cartão de crédito.",
      },
      {
        q: "Posso usar sem criar conta?",
        a: "Pode pesquisar e pré-visualizar documentos com marca d'água. Para descarregar, é necessário ter conta.",
      },
      {
        q: "Esqueci-me da palavra-passe, e agora?",
        a: "Na página de Login clique em 'Esqueci-me da palavra-passe' e siga as instruções enviadas por e-mail.",
      },
    ],
  },
  {
    title: "Documentos e uploads",
    items: [
      {
        q: "Que tipos de ficheiro posso enviar?",
        a: "Aceitamos PDFs até 50 MB. Recomendamos documentos académicos: exames, sebentas, trabalhos, dissertações.",
      },
      {
        q: "Quanto tempo demora a aprovação de um upload?",
        a: "Normalmente entre 6 e 24 horas. Depois da aprovação receberá os créditos automaticamente.",
      },
      {
        q: "Posso enviar documentos com direitos de autor?",
        a: "Não. Apenas materiais que sejam seus, de domínio público ou com autorização explícita do autor. Conteúdos não autorizados serão removidos.",
      },
      {
        q: "Como denuncio um documento inadequado?",
        a: "Em cada documento existe um botão 'Denunciar'. A nossa equipa de moderação avalia em até 48h.",
      },
    ],
  },
  {
    title: "Premium",
    items: [
      {
        q: "O que ganho com o Premium?",
        a: `Por ${SITE.premiumMonthly} MZN/mês tem downloads ilimitados, sem anúncios, suporte prioritário e acesso antecipado a novas funcionalidades.`,
      },
      {
        q: "Como pago o Premium?",
        a: "Aceitamos M-Pesa, e-Mola e transferência bancária. Após pagamento a sua conta é activada em minutos.",
      },
      {
        q: "Posso cancelar a qualquer momento?",
        a: "Sim. Pode cancelar a renovação no seu perfil. Mantém o Premium até ao fim do período pago.",
      },
    ],
  },
  {
    title: "Impressão (Gráfica Giseveral)",
    items: [
      {
        q: "Como peço impressão de um documento?",
        a: "Abra o documento, clique em 'Imprimir', escolha cor/P&B e número de cópias. Receberá o orçamento via WhatsApp instantaneamente.",
      },
      {
        q: "Quais são os preços?",
        a: `Preto e branco a partir de ${SITE.pricePerPageBW} MZN/página, cor a partir de ${SITE.pricePerPageColor} MZN/página. Frente e verso tem +10%.`,
      },
      {
        q: "Fazem entrega?",
        a: "Sim, em Maputo cidade. Levantamento na gráfica é grátis. Para entregas confirme o valor via WhatsApp.",
      },
    ],
  },
];

const FAQ = () => {
  return (
    <Layout>
      <SEO
        title="Perguntas Frequentes (FAQ) — Giseveral Hub"
        description="Tire as suas dúvidas sobre créditos, uploads, downloads, Premium e impressão na Giseveral & Services."
      />
      <section className="bg-gradient-hero text-primary-foreground py-16">
        <div className="container mx-auto container-px animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-4">
            <HelpCircle className="h-3.5 w-3.5" /> AJUDA
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-3">Perguntas frequentes</h1>
          <p className="text-lg opacity-90 max-w-xl">Respostas rápidas às dúvidas mais comuns sobre o Giseveral Hub.</p>
        </div>
      </section>

      <section className="container mx-auto container-px py-12 max-w-3xl">
        <div className="space-y-8">
          {FAQ_GROUPS.map((group, gi) => (
            <div key={group.title} className="animate-fade-in" style={{ animationDelay: `${gi * 100}ms` }}>
              <h2 className="font-display font-bold text-xl mb-3 text-primary">{group.title}</h2>
              <Accordion type="single" collapsible className="rounded-2xl bg-card border border-border px-5 shadow-card">
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`${gi}-${i}`} className="border-b last:border-0">
                    <AccordionTrigger className="text-left hover:no-underline font-semibold">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Não encontrou? */}
        <div className="mt-12 rounded-3xl bg-gradient-hero text-primary-foreground p-8 sm:p-10 text-center relative overflow-hidden animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <h3 className="font-display font-bold text-2xl sm:text-3xl mb-2 relative">Não encontrou a resposta?</h3>
          <p className="opacity-90 mb-5 relative">A nossa equipa está pronta para o ajudar via WhatsApp.</p>
          <div className="flex flex-wrap gap-3 justify-center relative">
            <Button asChild size="lg" variant="hero">
              <a href={`https://wa.me/${SITE.whatsappPrint}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" /> Falar via WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground hover:text-primary">
              <Link to="/contactos">Formulário de contacto <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;

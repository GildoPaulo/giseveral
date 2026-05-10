import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { FileText, AlertTriangle, CheckCircle2, Ban, Scale, Mail } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Serviço — Giseveral" },
      { name: "description", content: "Termos e condições de uso da plataforma Giseveral e Services." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
          <Icon className="h-5 w-5 text-brand" />
        </div>
        <h2 className="text-xl font-bold text-brand">{title}</h2>
      </div>
      <div className="text-sm text-foreground/80 space-y-3 leading-relaxed pl-12">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <Layout>
      <PageHero
        title="Termos de Serviço"
        subtitle="Última atualização: maio de 2026"
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-card">

          <p className="text-sm text-foreground/70 mb-8 leading-relaxed">
            Ao aceder ou utilizar os serviços da <strong>Giseveral e Services</strong>, aceita estes Termos de Serviço.
            Leia-os atentamente. Se não concordar, não utilize a plataforma.
          </p>

          <Section icon={FileText} title="1. Descrição dos serviços">
            <p>A Giseveral e Services oferece:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Loja online</strong> — encomenda de impressões, papelaria e produtos de escritório</li>
              <li><strong>Hub Académico</strong> — partilha de documentos académicos, bolsas de estudo e notícias</li>
              <li><strong>Gerador de cartas</strong> — criação assistida de cartas profissionais</li>
              <li><strong>CV Builder</strong> — criação de currículos profissionais</li>
              <li><strong>Serviços de informática e redes</strong> — suporte técnico e instalação</li>
            </ul>
          </Section>

          <Section icon={CheckCircle2} title="2. Uso aceitável">
            <p>Ao utilizar os nossos serviços, compromete-se a:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Usar a plataforma apenas para fins legais e legítimos</li>
              <li>Respeitar os direitos de propriedade intelectual de terceiros</li>
              <li>Não partilhar documentos com conteúdo ilegal, ofensivo ou protegido por direitos de autor sem autorização</li>
              <li>Não tentar comprometer a segurança ou integridade da plataforma</li>
            </ul>
          </Section>

          <Section icon={Ban} title="3. Conteúdo proibido">
            <p>É estritamente proibido partilhar ou publicar:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Conteúdo violento, discriminatório ou que promova ódio</li>
              <li>Dados pessoais de terceiros sem consentimento</li>
              <li>Material com direitos de autor sem autorização do titular</li>
              <li>Malware, vírus ou código malicioso</li>
              <li>Conteúdo enganoso ou fraudulento</li>
            </ul>
            <p className="mt-3">
              A Giseveral reserva-se o direito de remover qualquer conteúdo que viole estas regras e suspender contas infratoras
              sem aviso prévio.
            </p>
          </Section>

          <Section icon={AlertTriangle} title="4. Limitação de responsabilidade">
            <p>
              Os documentos académicos partilhados no Hub são da responsabilidade dos utilizadores que os publicam.
              A Giseveral não garante a exatidão, completude ou adequação desse conteúdo.
            </p>
            <p>
              A plataforma é fornecida "tal como está", sem garantias de disponibilidade contínua ou ausência de erros.
              Não nos responsabilizamos por perdas decorrentes do uso ou incapacidade de uso da plataforma.
            </p>
            <p>
              As cartas e CVs gerados automaticamente são sugestões e devem ser revistos pelo utilizador antes de envio.
              A Giseveral não se responsabiliza pelo resultado de candidaturas ou processos baseados nesses documentos.
            </p>
          </Section>

          <Section icon={FileText} title="5. Propriedade intelectual">
            <p>
              Todo o conteúdo original da plataforma (design, textos, código, imagens) é propriedade da Giseveral e Services
              e está protegido por direitos de autor.
            </p>
            <p>
              Os documentos que os utilizadores partilham permanecem propriedade dos seus autores originais.
              Ao partilhar conteúdo na plataforma, concede à Giseveral uma licença não exclusiva para exibir e distribuir
              esse conteúdo dentro da plataforma.
            </p>
          </Section>

          <Section icon={Scale} title="6. Contas de utilizador">
            <p>
              É responsável por manter a confidencialidade da sua password e por todas as atividades realizadas com a sua conta.
              Notifique-nos imediatamente de qualquer uso não autorizado.
            </p>
            <p>
              Podemos suspender ou encerrar contas que violem estes Termos, sem obrigação de reembolso de quaisquer valores pagos.
            </p>
          </Section>

          <Section icon={FileText} title="7. Alterações aos Termos">
            <p>
              Podemos atualizar estes Termos a qualquer momento. As alterações entram em vigor imediatamente após publicação.
              O uso continuado da plataforma após alterações constitui aceitação dos novos Termos.
            </p>
            <p>
              Para alterações significativas, notificaremos os utilizadores registados por e-mail.
            </p>
          </Section>

          <Section icon={Mail} title="8. Contacto">
            <p>Para questões sobre estes Termos:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>E-mail:</strong> <a href="mailto:geral@giseveral.com" className="text-brand hover:underline">geral@giseveral.com</a></li>
              <li><strong>WhatsApp:</strong> <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">+258 874 383 621</a></li>
            </ul>
          </Section>

          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 text-sm">
            <Link to="/privacy-policy" className="text-brand hover:underline font-medium">
              Política de Privacidade →
            </Link>
            <Link to="/contactos" className="text-muted-foreground hover:text-brand transition-colors">
              Contactos
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { Shield, Database, Cookie, Globe, User, Mail } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Giseveral" },
      { name: "description", content: "Saiba como a Giseveral recolhe, usa e protege os seus dados pessoais." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPolicyPage,
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

function PrivacyPolicyPage() {
  return (
    <Layout>
      <PageHero
        title="Política de Privacidade"
        subtitle="Última atualização: maio de 2026"
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-card">

          <p className="text-sm text-foreground/70 mb-8 leading-relaxed">
            A <strong>Giseveral e Services</strong> respeita a privacidade dos seus utilizadores e está comprometida em proteger
            os seus dados pessoais. Esta política explica que dados recolhemos, como os usamos e quais são os seus direitos.
          </p>

          <Section icon={Database} title="1. Dados que recolhemos">
            <p>Recolhemos dados pessoais apenas quando necessário para prestar os nossos serviços:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Conta de utilizador:</strong> nome, endereço de e-mail, password (encriptada via Supabase Auth)</li>
              <li><strong>Encomendas:</strong> nome, contacto, detalhes do pedido</li>
              <li><strong>Hub Académico:</strong> documentos partilhados, comentários, favoritos</li>
              <li><strong>Newsletter:</strong> endereço de e-mail para envio de alertas e novidades</li>
              <li><strong>Notificações push:</strong> identificador de subscrição (sem dados pessoais)</li>
              <li><strong>Analytics:</strong> dados de navegação anónimos via Umami (sem cookies de terceiros)</li>
            </ul>
          </Section>

          <Section icon={Globe} title="2. Como usamos os seus dados">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Autenticação e gestão da conta</li>
              <li>Processamento de encomendas e pedidos de serviços</li>
              <li>Envio de notificações sobre bolsas, prazos e oportunidades</li>
              <li>Melhoria da experiência na plataforma</li>
              <li>Análise de utilização anónima para melhorar o serviço</li>
              <li>Comunicação por e-mail quando autorizado (newsletter)</li>
            </ul>
            <p className="mt-3">Nunca vendemos nem partilhamos os seus dados com terceiros para fins comerciais.</p>
          </Section>

          <Section icon={Cookie} title="3. Cookies e rastreamento">
            <p>
              O nosso site usa cookies essenciais para o funcionamento da plataforma (sessão de utilizador, preferências).
              Usamos o <strong>Umami Analytics</strong>, uma ferramenta de análise respeitadora da privacidade que:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Não usa cookies de terceiros</li>
              <li>Não rastreia utilizadores entre sites</li>
              <li>Não recolhe dados pessoais identificáveis</li>
              <li>Está alojado nos nossos servidores</li>
            </ul>
            <p className="mt-3">Pode recusar cookies não essenciais através do banner de cookies que aparece na sua primeira visita.</p>
          </Section>

          <Section icon={Globe} title="4. Serviços de terceiros">
            <p>A plataforma integra os seguintes serviços de terceiros:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Supabase</strong> — base de dados e autenticação (servidores na UE)</li>
              <li><strong>Google OAuth</strong> — autenticação com conta Google (opcional)</li>
              <li><strong>Cloudflare Pages</strong> — alojamento e CDN</li>
              <li><strong>WhatsApp</strong> — comunicação com a equipa</li>
            </ul>
            <p className="mt-3">Cada serviço tem a sua própria política de privacidade. Recomendamos a sua leitura.</p>
          </Section>

          <Section icon={Shield} title="5. Segurança dos dados">
            <p>Aplicamos medidas técnicas para proteger os seus dados:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Passwords encriptadas com bcrypt via Supabase Auth</li>
              <li>Comunicações encriptadas via HTTPS/TLS</li>
              <li>Row Level Security (RLS) na base de dados — cada utilizador só acede aos seus dados</li>
              <li>Tokens de sessão com expiração automática</li>
            </ul>
          </Section>

          <Section icon={User} title="6. Os seus direitos">
            <p>Tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Aceder</strong> aos seus dados pessoais</li>
              <li><strong>Corrigir</strong> dados incorretos ou incompletos</li>
              <li><strong>Eliminar</strong> a sua conta e todos os dados associados</li>
              <li><strong>Exportar</strong> os seus dados em formato legível</li>
              <li><strong>Revogar</strong> o consentimento para newsletters e notificações a qualquer momento</li>
            </ul>
            <p className="mt-3">Para exercer qualquer destes direitos, contacte-nos por e-mail.</p>
          </Section>

          <Section icon={Mail} title="7. Contacto">
            <p>Para questões sobre privacidade ou para exercer os seus direitos:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>E-mail:</strong> <a href="mailto:geral@giseveral.com" className="text-brand hover:underline">geral@giseveral.com</a></li>
              <li><strong>WhatsApp:</strong> <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">+258 874 383 621</a></li>
              <li><strong>Morada:</strong> Beira, Esturro — Rua Alfredo Lawley, Moçambique</li>
            </ul>
            <p className="mt-3">Respondemos em até 5 dias úteis.</p>
          </Section>

          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 text-sm">
            <Link to="/terms" className="text-brand hover:underline font-medium">
              Termos de Serviço →
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

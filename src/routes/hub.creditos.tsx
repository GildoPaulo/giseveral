import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserCredits } from "@/lib/hub";
import { useState, useEffect } from "react";
import {
  Coins, Crown, CheckCircle2, MessageCircle, LogIn,
  ChevronLeft, Zap, Infinity,
} from "lucide-react";

export const Route = createFileRoute("/hub/creditos")({
  head: () => ({
    meta: [
      { title: "Créditos — Giseveral Hub" },
      { name: "description", content: "Obtenha créditos para descarregar documentos académicos no Giseveral Hub." },
    ],
  }),
  component: HubCreditosPage,
});

const WA_NUMBER = "258874383621";

function waLink(message: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

type Plan = {
  id: string;
  name: string;
  credits: number | null;
  price: string;
  highlight?: boolean;
  features: string[];
  waMessage: string;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: "100 MT",
    features: [
      "10 downloads de documentos",
      "Válido por 90 dias",
      "Suporte via WhatsApp",
    ],
    waMessage: "Olá! Quero comprar o pacote Starter (10 créditos) por 100 MT para o Giseveral Hub.",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 25,
    price: "200 MT",
    highlight: true,
    features: [
      "25 downloads de documentos",
      "Válido por 6 meses",
      "Suporte prioritário",
    ],
    waMessage: "Olá! Quero comprar o pacote Standard (25 créditos) por 200 MT para o Giseveral Hub.",
  },
  {
    id: "premium",
    name: "Premium",
    credits: null,
    price: "350 MT/mês",
    features: [
      "Downloads ilimitados",
      "Acesso antecipado a novos docs",
      "Badge Premium na conta",
      "Suporte prioritário",
    ],
    waMessage: "Olá! Quero assinar o plano Premium (ilimitado) por 350 MT/mês no Giseveral Hub.",
  },
];

function HubCreditosPage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserCredits(user.id).then(({ hub_credits, hub_premium }) => {
      setCredits(hub_credits);
      setPremium(hub_premium);
    });
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Link
          to="/hub"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-smooth mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Giseveral Hub
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 mx-auto mb-4">
            <Coins className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold text-brand mb-2">Créditos Hub</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Cada download custa 1 crédito. Obtenha créditos ou torne-se Premium para downloads ilimitados.
          </p>
        </div>

        {/* Current balance */}
        {user && credits !== null && (
          <div className="rounded-2xl bg-gradient-hero text-brand-foreground p-5 flex items-center gap-4 mb-10">
            {premium ? (
              <Infinity className="h-8 w-8 text-gold flex-shrink-0" />
            ) : (
              <Coins className="h-8 w-8 text-gold flex-shrink-0" />
            )}
            <div>
              <p className="text-sm opacity-75">O seu saldo actual</p>
              <p className="text-2xl font-bold">
                {premium ? "Premium — ilimitado" : `${credits} crédito${credits !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        )}

        {!user && (
          <div className="rounded-2xl bg-card border border-border p-6 text-center mb-10">
            <p className="text-muted-foreground mb-3">Inicie sessão para ver o seu saldo e comprar créditos.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              <LogIn className="h-4 w-4" /> Entrar / Criar conta
            </Link>
          </div>
        )}

        {/* Free credits info */}
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 flex items-start gap-3 mb-10">
          <Zap className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-700 dark:text-emerald-400">
            <strong>Ganhe créditos grátis!</strong> Ao criar conta recebe 3 créditos de boas-vindas. Cada documento que partilhar e for aprovado rende mais 2 créditos.
          </div>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col p-6 ${
                plan.highlight
                  ? "bg-gradient-hero text-brand-foreground shadow-elegant ring-2 ring-brand/30"
                  : "bg-card border border-border shadow-card"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-[11px] font-bold px-3 py-1 rounded-full">
                  Mais popular
                </span>
              )}

              <div className="mb-4">
                {plan.credits === null ? (
                  <Crown className="h-7 w-7 text-gold mb-2" />
                ) : (
                  <Coins className="h-7 w-7 text-gold mb-2" />
                )}
                <h3 className="text-lg font-bold mb-0.5">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gold">{plan.price.split("/")[0]}</span>
                  {plan.price.includes("/") && (
                    <span className={`text-sm ${plan.highlight ? "opacity-70" : "text-muted-foreground"}`}>
                      /{plan.price.split("/")[1]}
                    </span>
                  )}
                </div>
                {plan.credits !== null && (
                  <p className={`text-sm mt-1 ${plan.highlight ? "opacity-70" : "text-muted-foreground"}`}>
                    {plan.credits} créditos
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-gold" : "text-emerald-500"}`} />
                    <span className={plan.highlight ? "opacity-80" : "text-muted-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={waLink(plan.waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-smooth ${
                  plan.highlight
                    ? "bg-gradient-gold text-gold-foreground shadow-card hover:shadow-glow"
                    : "bg-[#25D366] text-white hover:bg-[#20ba59]"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                {plan.id === "premium" ? "Assinar via WhatsApp" : "Comprar via WhatsApp"}
              </a>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-bold text-base text-brand mb-4">Como funciona a compra?</h3>
          <ol className="space-y-3">
            {[
              "Clique no plano desejado — será aberto o WhatsApp com uma mensagem pré-preenchida.",
              "A nossa equipa confirmará o pagamento via M-Pesa, e-Mola ou transferência bancária.",
              "Os créditos são adicionados à sua conta em até 1 hora útil.",
              "Use os créditos para descarregar qualquer documento no Hub.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-brand/10 text-brand text-xs font-bold grid place-items-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Layout>
  );
}

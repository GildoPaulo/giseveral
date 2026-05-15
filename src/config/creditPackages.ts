export type CreditPackage = {
  id: string;
  credits: number;
  price: number;
  label: string;
  popular?: boolean;
  pitch: string;
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "basico",      credits: 5,  price: 150,  label: "Básico",      pitch: "Para começar" },
  { id: "standard",    credits: 10, price: 250,  label: "Standard",    popular: true, pitch: "Mais escolhido" },
  { id: "premium",     credits: 20, price: 450,  label: "Premium",     pitch: "Melhor relação" },
  { id: "empresarial", credits: 50, price: 1000, label: "Empresarial", pitch: "Para equipas" },
];

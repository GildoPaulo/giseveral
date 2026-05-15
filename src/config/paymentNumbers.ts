export type PaymentMethod = "mpesa" | "mkesh" | "emola";

export type PaymentMethodInfo = {
  id: PaymentMethod;
  label: string;
  number: string;
  name: string;
  instructions: string;
};

export const PAYMENT_NUMBERS: Record<PaymentMethod, PaymentMethodInfo> = {
  mpesa: {
    id: "mpesa",
    label: "M-Pesa",
    number: "850 411 768",
    name: "Gildo Paulo Correia Victor",
    instructions:
      "Envie o valor exacto para o número M-Pesa abaixo. Guarde o SMS de confirmação — vai precisar dele a seguir.",
  },
  mkesh: {
    id: "mkesh",
    label: "Mkesh",
    number: "831 084 812",
    name: "Gildo Paulo Correia Victor",
    instructions:
      "Faça a transferência via Mkesh para o número abaixo. Tire screenshot ou guarde o comprovativo.",
  },
  emola: {
    id: "emola",
    label: "E-Mola",
    number: "874 383 621",
    name: "Ermelinda da Conceição Marissane",
    instructions:
      "Envie o valor via E-Mola para o número abaixo. Guarde o SMS / comprovativo da transferência.",
  },
};

export const PAYMENT_METHOD_LIST: PaymentMethodInfo[] = [
  PAYMENT_NUMBERS.mpesa,
  PAYMENT_NUMBERS.mkesh,
  PAYMENT_NUMBERS.emola,
];

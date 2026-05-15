import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Add new languages here. Keys are short ISO codes; labels are what the
// switcher displays.
export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português", short: "PT", flag: "🇵🇹" },
  { code: "en", label: "English",   short: "EN", flag: "🇬🇧" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// Translation dictionary. Keep it shallow — keys are kebab-case strings, values
// are the displayed text. Components that need translations call `t("nav.home")`.
type Dict = Record<string, string>;

const DICT: Record<LanguageCode, Dict> = {
  pt: {
    "nav.home":       "Home",
    "nav.about":      "Sobre",
    "nav.services":   "Serviços",
    "nav.store":      "Loja",
    "nav.blog":       "Blog",
    "nav.gallery":    "Galeria",
    "nav.account":    "Conta",
    "nav.login":      "Entrar",
    "nav.cart":       "Carrinho",
    "nav.language":   "Idioma",
    "nav.theme.light": "Modo claro",
    "nav.theme.dark":  "Modo escuro",
  },
  en: {
    "nav.home":       "Home",
    "nav.about":      "About",
    "nav.services":   "Services",
    "nav.store":      "Store",
    "nav.blog":       "Blog",
    "nav.gallery":    "Gallery",
    "nav.account":    "Account",
    "nav.login":      "Sign in",
    "nav.cart":       "Cart",
    "nav.language":   "Language",
    "nav.theme.light": "Light mode",
    "nav.theme.dark":  "Dark mode",
  },
};

type LanguageContextValue = {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "giseveral.lang";

function detectDefaultLang(): LanguageCode {
  if (typeof window === "undefined") return "pt";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) return stored as LanguageCode;
  const nav = window.navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("en")) return "en";
  return "pt";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("pt");

  useEffect(() => { setLangState(detectDefaultLang()); }, []);

  const setLang = useCallback((code: LanguageCode) => {
    setLangState(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, code);
      document.documentElement.lang = code;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string) => {
    return DICT[lang]?.[key] ?? DICT.pt[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { Chatbot } from "./Chatbot";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <Chatbot />
    </div>
  );
}

export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-gradient-hero text-brand-foreground">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <h1 className="text-3xl md:text-5xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base md:text-lg text-brand-foreground/80">{subtitle}</p>
        )}
        <div className="mt-6 h-1 w-20 bg-gradient-gold rounded-full" />
      </div>
    </section>
  );
}

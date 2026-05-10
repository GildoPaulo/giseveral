import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { Chatbot } from "./Chatbot";
import defaultHeroBg from "@/assets/hero-bg.jpg";

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

export function PageHero({ title, subtitle, image }: { title: string; subtitle?: string; image?: string }) {
  const bg = image ?? defaultHeroBg;
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-brand-foreground">
      {/* Photo layer */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${bg})` }}
      />
      {/* Subtle vignette at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand/40 to-transparent" />
      <div className="relative container mx-auto px-4 py-16 md:py-20">
        <h1 className="text-3xl md:text-5xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base md:text-lg text-brand-foreground/80">{subtitle}</p>
        )}
        <div className="mt-6 h-1 w-20 bg-gradient-gold rounded-full" />
      </div>
    </section>
  );
}

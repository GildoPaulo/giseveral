import { Header } from "./Header";
import { Footer } from "./Footer";
import { ReactNode } from "react";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-gradient-soft">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

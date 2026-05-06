import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Explorar from "./pages/Explorar.tsx";
import Categorias from "./pages/Categorias.tsx";
import Documento from "./pages/Documento.tsx";
import Login from "./pages/Login.tsx";
import Perfil from "./pages/Perfil.tsx";
import Premium from "./pages/Premium.tsx";
import Upload from "./pages/Upload.tsx";
import Denuncias from "./pages/Denuncias.tsx";
import Admin from "./pages/Admin.tsx";
import Sobre from "./pages/Sobre.tsx";
import Contactos from "./pages/Contactos.tsx";
import FAQ from "./pages/FAQ.tsx";
import Bolsas from "./pages/Bolsas.tsx";
import BolsaDetail from "./pages/BolsaDetail.tsx";
import NoticiaDetail from "./pages/NoticiaDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/documento/:id" element={<Documento />} />
            <Route path="/login" element={<Login />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/denuncias" element={<Denuncias />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/bolsas" element={<Bolsas />} />
            <Route path="/bolsas/:id" element={<BolsaDetail />} />
            <Route path="/noticias/:id" element={<NoticiaDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

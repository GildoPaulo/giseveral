import { Link, useNavigate, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Mail, Lock, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Email inválido" }).max(255);
const passwordSchema = z.string().min(6, { message: "Mínimo 6 caracteres" }).max(72);
const nameSchema = z.string().trim().min(2, { message: "Mínimo 2 caracteres" }).max(100);

const Login = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/perfil" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanEmail = emailSchema.parse(email);
      passwordSchema.parse(password);
      if (mode === "register") nameSchema.parse(name);

      setBusy(true);
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique o seu email para confirmar a conta." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!" });
        navigate("/perfil");
      }
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto container-px py-12 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elegant mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h1 className="font-display font-bold text-2xl mb-1">
              {mode === "login" ? "Aceder à conta" : "Criar conta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Bem-vindo de volta ao Giseveral Hub" : "Junte-se à comunidade académica de Moçambique"}
            </p>
          </div>

          <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
            <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-lg mb-5">
              <button onClick={() => setMode("login")} className={`py-2 rounded-md text-sm font-semibold transition-smooth ${mode === "login" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>Entrar</button>
              <button onClick={() => setMode("register")} className={`py-2 rounded-md text-sm font-semibold transition-smooth ${mode === "register" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>Registar</button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Carlos Mucavele" className="pl-9" required />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="pl-9" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" required minLength={6} />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Entrar" : "Criar conta grátis"}
              </Button>

              {mode === "register" && (
                <p className="text-[11px] text-center text-muted-foreground">
                  Ao criar conta recebe <strong className="text-accent-foreground bg-accent/30 px-1 rounded">3 créditos grátis</strong>
                </p>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar concorda com os <Link to="#" className="text-primary hover:underline">termos</Link> e a <Link to="#" className="text-primary hover:underline">privacidade</Link>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

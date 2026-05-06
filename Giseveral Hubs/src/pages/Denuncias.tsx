import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, Eye, CheckCircle2, XCircle, Flag, Loader2 } from "lucide-react";

type MyReport = {
  id: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  documents?: { title: string } | null;
};

const statusMap = {
  pending: { label: "Em análise", color: "bg-accent text-accent-foreground" },
  resolved: { label: "Resolvida", color: "bg-success text-success-foreground" },
  dismissed: { label: "Rejeitada", color: "bg-destructive text-destructive-foreground" },
} as const;

const Denuncias = () => {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("reports").select("*, documents(title)")
      .eq("reporter_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setReports((data ?? []) as MyReport[]);
        setDataLoading(false);
      });
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;

  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container mx-auto container-px">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/20 text-destructive-foreground">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl">As Minhas Denúncias</h1>
              <p className="opacity-80 text-sm">Acompanhe o estado das denúncias que enviou</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto container-px py-10">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Em análise", value: stats.pending, icon: Eye, color: "text-accent-foreground bg-accent" },
            { label: "Resolvidas", value: stats.resolved, icon: CheckCircle2, color: "text-success-foreground bg-success" },
            { label: "Rejeitadas", value: stats.dismissed, icon: XCircle, color: "text-destructive-foreground bg-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-5 flex items-center gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display font-bold text-2xl">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-border bg-secondary/40 flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            <h2 className="font-display font-bold">Histórico de denúncias</h2>
          </div>
          {dataLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Ainda não enviou nenhuma denúncia. Encontrou conteúdo impróprio?{" "}
              <Link to="/explorar" className="text-primary hover:underline font-medium">Explore documentos</Link>.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((r) => {
                const s = statusMap[r.status];
                return (
                  <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{r.documents?.title ?? "Documento removido"}</h3>
                      <p className="text-xs text-muted-foreground">Motivo: <span className="text-foreground font-medium">{r.reason}</span> · {new Date(r.created_at).toLocaleDateString("pt-PT")}</p>
                    </div>
                    <Badge className={s.color}>{s.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-secondary/60 border border-border p-6 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" /> Política de moderação</h3>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>Documentos com violação clara de direitos autorais são removidos imediatamente.</li>
            <li>Falsas denúncias podem resultar em suspensão da conta.</li>
            <li>Todas as denúncias são revistas por moderadores num prazo máximo de 48h.</li>
          </ul>
        </div>
      </section>
    </Layout>
  );
};

export default Denuncias;

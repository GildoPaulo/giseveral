import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldAlert, FileText, Flag, CheckCircle2, XCircle, Eye, Loader2,
  Users, Crown, TrendingUp,
} from "lucide-react";

type AdminDoc = {
  id: string;
  title: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  downloads: number;
  views: number;
  created_at: string;
  user_id: string;
};

type AdminReport = {
  id: string;
  document_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  reporter_id: string;
  documents?: { title: string } | null;
};

type Stats = {
  totalUsers: number;
  totalDocs: number;
  pendingDocs: number;
  pendingReports: number;
  premium: number;
};

const Admin = () => {
  const { user, isModerator, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<AdminDoc[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalDocs: 0, pendingDocs: 0, pendingReports: 0, premium: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const load = async () => {
    setDataLoading(true);
    const [docsRes, reportsRes, profilesRes] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("reports").select("*, documents(title)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, is_premium"),
    ]);
    setDocs((docsRes.data ?? []) as AdminDoc[]);
    setReports((reportsRes.data ?? []) as AdminReport[]);
    const profiles = profilesRes.data ?? [];
    const allDocs = (docsRes.data ?? []) as AdminDoc[];
    const allReports = (reportsRes.data ?? []) as AdminReport[];
    setStats({
      totalUsers: profiles.length,
      totalDocs: allDocs.length,
      pendingDocs: allDocs.filter((d) => d.status === "pending").length,
      pendingReports: allReports.filter((r) => r.status === "pending").length,
      premium: profiles.filter((p: { is_premium: boolean }) => p.is_premium).length,
    });
    setDataLoading(false);
  };

  useEffect(() => { if (user && isModerator) load(); }, [user, isModerator]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (!loading && !isModerator) return <Navigate to="/" replace />;

  const setDocStatus = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase.from("documents").update({ status }).eq("id", id);
    setBusy(null);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: status === "approved" ? "Documento aprovado" : "Documento rejeitado" });
    load();
  };

  const deleteDoc = async (id: string) => {
    if (!isAdmin) return toast({ title: "Apenas administradores podem apagar." });
    if (!confirm("Apagar este documento permanentemente?")) return;
    setBusy(id);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    setBusy(null);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Documento apagado" });
    load();
  };

  const setReportStatus = async (id: string, status: "resolved" | "dismissed") => {
    setBusy(id);
    const { error } = await supabase.from("reports").update({
      status, resolved_by: user!.id, resolved_at: new Date().toISOString(),
    }).eq("id", id);
    setBusy(null);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: status === "resolved" ? "Denúncia resolvida" : "Denúncia rejeitada" });
    load();
  };

  const pendingDocs = docs.filter((d) => d.status === "pending");
  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground py-10">
        <div className="container mx-auto container-px flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/20 text-destructive-foreground">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl">Painel de Moderação</h1>
            <p className="opacity-80 text-sm">Gerencie documentos, denúncias e utilizadores</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto container-px py-8">
        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Utilizadores", v: stats.totalUsers, icon: Users, color: "bg-primary text-primary-foreground" },
            { label: "Documentos", v: stats.totalDocs, icon: FileText, color: "bg-accent text-accent-foreground" },
            { label: "Pendentes", v: stats.pendingDocs, icon: Eye, color: "bg-secondary text-secondary-foreground" },
            { label: "Denúncias", v: stats.pendingReports, icon: Flag, color: "bg-destructive text-destructive-foreground" },
            { label: "Premium", v: stats.premium, icon: Crown, color: "bg-success text-success-foreground" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 shadow-card">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="font-display font-bold text-2xl">{s.v}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="reports">Denúncias <Badge variant="secondary" className="ml-2">{pendingReports.length}</Badge></TabsTrigger>
              <TabsTrigger value="pending">Pendentes <Badge variant="secondary" className="ml-2">{pendingDocs.length}</Badge></TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            {/* DENÚNCIAS */}
            <TabsContent value="reports" className="mt-5">
              <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
                <div className="px-5 py-3 border-b border-border bg-secondary/40 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" />
                  <h2 className="font-display font-bold">Denúncias pendentes</h2>
                </div>
                {reports.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">Sem denúncias até ao momento.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {reports.map((r) => (
                      <div key={r.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{r.documents?.title ?? "Documento removido"}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-medium text-foreground">{r.reason}</span>
                            {" · "}{new Date(r.created_at).toLocaleDateString("pt-PT")}
                          </p>
                          {r.details && <p className="text-xs text-muted-foreground mt-1 italic">"{r.details}"</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status === "pending" ? "default" : r.status === "resolved" ? "secondary" : "outline"}>
                            {r.status === "pending" ? "Pendente" : r.status === "resolved" ? "Resolvida" : "Rejeitada"}
                          </Badge>
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setReportStatus(r.id, "dismissed")} disabled={busy === r.id}>
                                Rejeitar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setReportStatus(r.id, "resolved")} disabled={busy === r.id}>
                                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Resolver
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* DOCS PENDENTES */}
            <TabsContent value="pending" className="mt-5">
              <DocList docs={pendingDocs} busy={busy} onApprove={(id) => setDocStatus(id, "approved")} onReject={(id) => setDocStatus(id, "rejected")} onDelete={deleteDoc} isAdmin={isAdmin} emptyMsg="Sem documentos a aguardar aprovação." />
            </TabsContent>

            <TabsContent value="all" className="mt-5">
              <DocList docs={docs} busy={busy} onApprove={(id) => setDocStatus(id, "approved")} onReject={(id) => setDocStatus(id, "rejected")} onDelete={deleteDoc} isAdmin={isAdmin} emptyMsg="Sem documentos." />
            </TabsContent>
          </Tabs>
        )}
      </section>
    </Layout>
  );
};

const DocList = ({
  docs, busy, onApprove, onReject, onDelete, isAdmin, emptyMsg,
}: {
  docs: AdminDoc[]; busy: string | null;
  onApprove: (id: string) => void; onReject: (id: string) => void; onDelete: (id: string) => void;
  isAdmin: boolean; emptyMsg: string;
}) => (
  <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
    <div className="px-5 py-3 border-b border-border bg-secondary/40 flex items-center gap-2">
      <FileText className="h-4 w-4" />
      <h2 className="font-display font-bold">{docs.length} documento(s)</h2>
    </div>
    {docs.length === 0 ? (
      <p className="p-8 text-center text-sm text-muted-foreground">{emptyMsg}</p>
    ) : (
      <div className="divide-y divide-border">
        {docs.map((d) => (
          <div key={d.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{d.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {d.category} · <TrendingUp className="inline h-3 w-3" /> {d.downloads} downloads · {d.views} views · {new Date(d.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={d.status === "approved" ? "secondary" : d.status === "rejected" ? "destructive" : "default"}>
                {d.status === "approved" ? "Aprovado" : d.status === "rejected" ? "Rejeitado" : "Pendente"}
              </Badge>
              {d.status !== "approved" && (
                <Button size="sm" onClick={() => onApprove(d.id)} disabled={busy === d.id}>
                  <CheckCircle2 className="h-4 w-4" /> Aprovar
                </Button>
              )}
              {d.status !== "rejected" && (
                <Button size="sm" variant="outline" onClick={() => onReject(d.id)} disabled={busy === d.id}>
                  <XCircle className="h-4 w-4" /> Rejeitar
                </Button>
              )}
              {isAdmin && (
                <Button size="sm" variant="destructive" onClick={() => onDelete(d.id)} disabled={busy === d.id}>
                  Apagar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default Admin;

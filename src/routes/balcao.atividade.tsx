import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Bell, ShoppingBag, GraduationCap, BookOpen,
  Newspaper, FileText, Users, TrendingUp, Award,
  Clock, CheckCircle2, AlertTriangle, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/balcao/atividade")({
  component: AtividadePage,
});

type Stat = { label: string; value: number | string; icon: React.ElementType; color: string; bg: string; to?: string };
type ActivityItem = { id: string; type: string; title: string; subtitle: string; time: string; status?: string };

const STATUS_COLOR: Record<string, string> = {
  sent:    "text-emerald-600",
  partial: "text-yellow-600",
  failed:  "text-red-600",
  pending:    "text-yellow-600",
  confirmed:  "text-blue-600",
  delivering: "text-purple-600",
  delivered:  "text-emerald-600",
  cancelled:  "text-red-600",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function StatCard({ label, value, icon: Icon, color, bg, to }: Stat) {
  const content = (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elegant transition-smooth">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg} mb-3`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
  return to ? <Link to={to as any}>{content}</Link> : content;
}

function AtividadePage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [
        subsRes, pushRes, campRes, pushLogRes,
        ordersRes, docsRes, newsRes, bolsasRes, blogRes,
      ] = await Promise.all([
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_campaigns").select("id,subject,sent_to,status,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("push_notifications_log").select("id,title,sent,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("id,order_number,customer_name,status,total,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("hub_documents").select("id", { count: "exact", head: true }),
        supabase.from("hub_news").select("id", { count: "exact", head: true }),
        supabase.from("hub_scholarships").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        subscribers: subsRes.count ?? 0,
        push_devices: pushRes.count ?? 0,
        hub_docs: docsRes.count ?? 0,
        hub_news: newsRes.count ?? 0,
        bolsas: bolsasRes.count ?? 0,
        blog_posts: blogRes.count ?? 0,
      });

      // Build unified activity feed
      const items: ActivityItem[] = [];

      (ordersRes.data ?? []).forEach((o: any) => {
        items.push({
          id: `order-${o.id}`,
          type: "order",
          title: `Pedido ${o.order_number}`,
          subtitle: `${o.customer_name} · ${Number(o.total ?? 0).toLocaleString("pt-PT", { style: "currency", currency: "MZN" })}`,
          time: o.created_at,
          status: o.status,
        });
      });

      (campRes.data ?? []).forEach((c: any) => {
        items.push({
          id: `camp-${c.id}`,
          type: "newsletter",
          title: `Newsletter: ${c.subject}`,
          subtitle: `${c.sent_to} emails enviados`,
          time: c.created_at,
          status: c.status,
        });
      });

      (pushLogRes.data ?? []).forEach((p: any) => {
        items.push({
          id: `push-${p.id}`,
          type: "push",
          title: `Push: ${p.title ?? "Notificação"}`,
          subtitle: `${p.sent ?? 0} dispositivos`,
          time: p.created_at,
          status: "sent",
        });
      });

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 20));
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }

  const statCards: Stat[] = [
    { label: "Subscritores newsletter",  value: stats.subscribers  ?? "…", icon: Mail,        color: "text-blue-600",    bg: "bg-blue-50",   to: "/balcao/newsletter" },
    { label: "Dispositivos push",        value: stats.push_devices ?? "…", icon: Bell,        color: "text-purple-600",  bg: "bg-purple-50", to: "/balcao/notificacoes" },
    { label: "Documentos Hub",           value: stats.hub_docs     ?? "…", icon: FileText,    color: "text-teal-600",    bg: "bg-teal-50",   to: "/balcao/hub" },
    { label: "Notícias Hub",             value: stats.hub_news     ?? "…", icon: Newspaper,   color: "text-amber-600",   bg: "bg-amber-50",  to: "/balcao/noticias" },
    { label: "Bolsas Hub",               value: stats.bolsas       ?? "…", icon: Award,       color: "text-gold",        bg: "bg-yellow-50", to: "/balcao/bolsas" },
    { label: "Artigos de blog",          value: stats.blog_posts   ?? "…", icon: BookOpen,    color: "text-emerald-600", bg: "bg-emerald-50",to: "/balcao/blog" },
  ];

  const TYPE_ICON: Record<string, React.ElementType> = {
    order:      ShoppingBag,
    newsletter: Mail,
    push:       Bell,
  };

  const TYPE_COLOR: Record<string, string> = {
    order:      "bg-blue-100 text-blue-600",
    newsletter: "bg-emerald-100 text-emerald-600",
    push:       "bg-purple-100 text-purple-600",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <TrendingUp className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel de Atividade</h1>
            <p className="text-xs text-muted-foreground">
              Última atualização: {lastRefresh.toLocaleTimeString("pt-PT")}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-brand hover:bg-accent transition-smooth disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Activity feed */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Atividade recente</h2>
          <span className="ml-auto text-xs text-muted-foreground">{activity.length} eventos</span>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">A carregar…</span>
          </div>
        ) : activity.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma atividade registada ainda.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activity.map((item) => {
              const Icon = TYPE_ICON[item.type] ?? TrendingUp;
              return (
                <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[item.type] ?? "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status && (
                      <span className={`text-xs font-medium ${STATUS_COLOR[item.status] ?? "text-muted-foreground"}`}>
                        {item.status}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.time)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Enviar newsletter", to: "/balcao/newsletter", icon: Mail, color: "text-blue-600" },
          { label: "Enviar push", to: "/balcao/notificacoes", icon: Bell, color: "text-purple-600" },
          { label: "Ver pedidos", to: "/balcao/pedidos", icon: ShoppingBag, color: "text-brand" },
          { label: "Gerir bolsas", to: "/balcao/bolsas", icon: Award, color: "text-gold" },
        ].map(({ label, to, icon: Icon, color }) => (
          <Link
            key={to}
            to={to as any}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground hover:bg-accent hover:border-brand/30 transition-smooth"
          >
            <Icon className={`h-4 w-4 ${color} shrink-0`} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

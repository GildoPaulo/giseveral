import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Clock, CheckCircle2, TrendingUp, AlertTriangle, Package, Users, Eye, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/balcao/")({
  component: BalcaoDashboard,
});

type StatsData = {
  total: number;
  pending: number;
  delivering: number;
  revenue: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  delivery_type: string;
  created_at: string;
};

type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

type ChartDay = {
  day: string;
  pedidos: number;
  receita: number;
};

type StatusSlice = {
  name: string;
  value: number;
  fill: string;
};

// ── Umami Analytics ──────────────────────────────────────────────────────────

const UMAMI_API = "https://api.umami.is/v1";
const UMAMI_KEY = import.meta.env.VITE_UMAMI_API_KEY as string | undefined;
const UMAMI_WID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;

type UmamiStats = {
  pageviews: { value: number };
  visitors: { value: number };
  visits: { value: number };
  bounces: { value: number };
  totaltime: { value: number };
};

type UmamiMetric = { x: string; y: number };

type UmamiPageview = { x: string; y: number };

type AnalyticsData = {
  stats: UmamiStats | null;
  topPages: UmamiMetric[];
  referrers: UmamiMetric[];
  devices: UmamiMetric[];
  pageviewsChart: { day: string; views: number }[];
};

async function fetchUmamiAnalytics(days = 30): Promise<AnalyticsData | null> {
  if (!UMAMI_KEY || !UMAMI_WID) return null;
  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  const qs = `startAt=${startAt}&endAt=${endAt}`;
  const h = { "x-umami-api-key": UMAMI_KEY };

  try {
    const [statsRes, pagesRes, refRes, devRes, pvRes] = await Promise.all([
      fetch(`${UMAMI_API}/websites/${UMAMI_WID}/stats?${qs}`, { headers: h }),
      fetch(`${UMAMI_API}/websites/${UMAMI_WID}/metrics?${qs}&type=url&limit=10`, { headers: h }),
      fetch(`${UMAMI_API}/websites/${UMAMI_WID}/metrics?${qs}&type=referrer&limit=8`, { headers: h }),
      fetch(`${UMAMI_API}/websites/${UMAMI_WID}/metrics?${qs}&type=device`, { headers: h }),
      fetch(`${UMAMI_API}/websites/${UMAMI_WID}/pageviews?${qs}&unit=day&timezone=Africa%2FMaputo`, { headers: h }),
    ]);

    const [stats, pages, refs, devs, pvData] = await Promise.all([
      statsRes.ok ? statsRes.json() : null,
      pagesRes.ok ? pagesRes.json() : [],
      refRes.ok ? refRes.json() : [],
      devRes.ok ? devRes.json() : [],
      pvRes.ok ? pvRes.json() : { pageviews: [] },
    ]);

    return {
      stats: stats as UmamiStats | null,
      topPages: (Array.isArray(pages) ? pages : []) as UmamiMetric[],
      referrers: (Array.isArray(refs) ? refs : []) as UmamiMetric[],
      devices: (Array.isArray(devs) ? devs : []) as UmamiMetric[],
      pageviewsChart: ((pvData?.pageviews ?? []) as UmamiPageview[]).map((p) => {
        const d = p.x ? new Date(p.x) : null;
        return {
          day: d && !isNaN(d.getTime()) ? d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) : p.x ?? "?",
          views: p.y ?? 0,
        };
      }),
    };
  } catch {
    return null;
  }
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pendente",      cls: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Confirmado",    cls: "bg-blue-100 text-blue-700" },
  preparing:  { label: "Em preparação", cls: "bg-orange-100 text-orange-700" },
  delivering: { label: "Em entrega",    cls: "bg-purple-100 text-purple-700" },
  delivered:  { label: "Entregue",      cls: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelado",     cls: "bg-red-100 text-red-600" },
};

function BalcaoDashboard() {
  const [stats, setStats] = useState<StatsData>({ total: 0, pending: 0, delivering: 0, revenue: 0 });
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [statusData, setStatusData] = useState<StatusSlice[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    Promise.all([
      supabase.from("orders").select("status, total").gte("created_at", today.toISOString()),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, status, total, delivery_type, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("products").select("id, name, stock, unit").lte("stock", 5).gt("stock", 0).eq("active", true).order("stock"),
      supabase
        .from("orders")
        .select("status, total, created_at")
        .gte("created_at", sevenDaysAgo.toISOString()),
    ]).then(([{ data: todayOrders }, { data: recentOrders }, { data: low }, { data: weekOrdersRaw }]) => {
      const orders = todayOrders ?? [];
      const completed = orders.filter((o) => o.status === "delivered").length;
      const cancelled = orders.filter((o) => o.status === "cancelled").length;

      setStats({
        total: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        delivering: orders.filter((o) => o.status === "delivering").length,
        revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
      });
      setRecent((recentOrders ?? []) as RecentOrder[]);
      setLowStock((low ?? []) as LowStockProduct[]);

      // Build 7-day chart data
      const weekOrders = weekOrdersRaw ?? [];
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const built: ChartDay[] = days.map((day) => {
        const dayOrders = weekOrders.filter((o) => o.created_at.startsWith(day));
        return {
          day: new Date(day).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric" }),
          pedidos: dayOrders.length,
          receita: dayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
        };
      });
      setChartData(built);

      // Status pie data from today
      const slices: StatusSlice[] = [
        { name: "Pendentes",  value: orders.filter((o) => o.status === "pending").length,   fill: "#f59e0b" },
        { name: "Em entrega", value: orders.filter((o) => o.status === "delivering").length, fill: "#8b5cf6" },
        { name: "Concluídos", value: completed,                                               fill: "#10b981" },
        { name: "Cancelados", value: cancelled,                                               fill: "#ef4444" },
      ].filter((s) => s.value > 0);
      setStatusData(slices);
    });

    // Fetch Umami analytics in background
    fetchUmamiAnalytics(30).then((data) => {
      setAnalytics(data);
      setAnalyticsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumo de hoje, {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pedidos hoje", value: stats.total, icon: ShoppingBag, color: "text-brand" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Em entrega", value: stats.delivering, icon: TrendingUp, color: "text-purple-600" },
          { label: "Receita hoje (MZN)", value: stats.revenue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }), icon: CheckCircle2, color: "text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 7-day trend — takes 2 cols */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-5">
          <h2 className="font-bold text-foreground mb-1">Tendência — últimos 7 dias</h2>
          <p className="text-xs text-muted-foreground mb-4">Pedidos e receita diária</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Line yAxisId="left" type="monotone" dataKey="pedidos" stroke="#1a3a6b" strokeWidth={2} dot={{ r: 3 }} name="Pedidos" />
              <Line yAxisId="right" type="monotone" dataKey="receita" stroke="#d4af37" strokeWidth={2} dot={{ r: 3 }} name="Receita (MZN)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution pie */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <h2 className="font-bold text-foreground mb-1">Hoje por estado</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribuição dos pedidos de hoje</p>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground/40">
              <p className="text-sm">Sem pedidos hoje</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold text-foreground">Pedidos Recentes</h2>
            <Link to="/balcao/pedidos" className="text-xs font-medium text-brand hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Sem pedidos ainda.</p>
            ) : (
              recent.map((order) => {
                const st = statusLabel[order.status] ?? statusLabel.pending;
                return (
                  <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand">{order.order_number}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{order.customer_name} · {order.customer_phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        {order.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" /> Stock Baixo
            </h2>
            <Link to="/balcao/stock" className="text-xs font-medium text-brand hover:underline">Gerir</Link>
          </div>
          <div className="divide-y divide-border">
            {lowStock.length === 0 ? (
              <div className="p-5 flex flex-col items-center text-center">
                <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Stock está OK</p>
              </div>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-foreground truncate mr-2">{p.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${p.stock <= 2 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                    {p.stock} {p.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── ANALYTICS ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand" /> Estatísticas de Visitas
            </h2>
            <p className="text-xs text-muted-foreground">Últimos 30 dias · fonte: Umami Analytics</p>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground/40">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mr-3" />
            A carregar estatísticas…
          </div>
        ) : !analytics?.stats?.visitors ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Estatísticas não disponíveis</p>
            <p className="text-xs mt-1">
              {UMAMI_KEY ? "Erro ao contactar a API do Umami." : "Configure VITE_UMAMI_API_KEY e VITE_UMAMI_WEBSITE_ID no ambiente."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Visitantes únicos", value: (analytics.stats.visitors?.value ?? 0).toLocaleString(), icon: Users, color: "text-brand" },
                { label: "Visualizações", value: (analytics.stats.pageviews?.value ?? 0).toLocaleString(), icon: Eye, color: "text-indigo-600" },
                { label: "Visitas totais", value: (analytics.stats.visits?.value ?? 0).toLocaleString(), icon: TrendingUp, color: "text-emerald-600" },
                { label: "Tempo médio (s)", value: Math.round(((analytics.stats as any).totaltime?.value ?? 0) / ((analytics.stats.visits?.value || 1))).toLocaleString(), icon: Clock, color: "text-amber-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-card">
                  <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
                  <div>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pageviews chart + top pages */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-5">
                <h3 className="font-bold text-foreground mb-1 text-sm">Visitas diárias</h3>
                <p className="text-xs text-muted-foreground mb-4">Últimos 30 dias</p>
                {analytics.pageviewsChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={analytics.pageviewsChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        labelStyle={{ fontWeight: 600, fontSize: 11 }}
                      />
                      <Line type="monotone" dataKey="views" stroke="#1a3a6b" strokeWidth={2} dot={false} name="Visualizações" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de visitas</p>
                )}
              </div>

              {/* Devices pie */}
              <div className="rounded-xl border border-border bg-card shadow-card p-5">
                <h3 className="font-bold text-foreground mb-1 text-sm">Dispositivos</h3>
                <p className="text-xs text-muted-foreground mb-4">Desktop · Mobile · Tablet</p>
                {analytics.devices.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.devices.slice(0, 4).map((d) => {
                      const total = analytics.devices.reduce((s, x) => s + x.y, 0);
                      const pct = total > 0 ? Math.round((d.y / total) * 100) : 0;
                      const DevIcon = d.x?.toLowerCase().includes("mobile") ? Smartphone
                        : d.x?.toLowerCase().includes("tablet") ? Tablet : Monitor;
                      return (
                        <div key={d.x} className="flex items-center gap-2">
                          <DevIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-foreground/80 truncate">{d.x || "Desconhecido"}</span>
                              <span className="font-semibold text-foreground ml-1">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sem dados</p>
                )}
              </div>
            </div>

            {/* Top pages + referrers */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card shadow-card">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm">Páginas mais visitadas</h3>
                </div>
                <div className="divide-y divide-border">
                  {analytics.topPages.slice(0, 8).map((p, i) => (
                    <div key={p.x} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-xs text-foreground flex-1 truncate font-mono">{p.x || "/"}</span>
                      <span className="text-xs font-semibold text-brand flex-shrink-0">{p.y.toLocaleString()}</span>
                    </div>
                  ))}
                  {analytics.topPages.length === 0 && <p className="p-5 text-sm text-muted-foreground">Sem dados</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card shadow-card">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm">Origem do tráfego</h3>
                </div>
                <div className="divide-y divide-border">
                  {analytics.referrers.slice(0, 8).map((r) => {
                    const total = analytics.referrers.reduce((s, x) => s + x.y, 0);
                    const pct = total > 0 ? Math.round((r.y / total) * 100) : 0;
                    return (
                      <div key={r.x} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="text-xs text-foreground flex-1 truncate">{r.x || "Directo"}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{r.y}</span>
                        </div>
                      </div>
                    );
                  })}
                  {analytics.referrers.length === 0 && <p className="p-5 text-sm text-muted-foreground">Sem dados</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Phone, MessageCircle, LogOut, Plus, X,
  ShoppingBag, ClipboardList, User, Package,
} from "lucide-react";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "A Minha Conta — Giseveral e Services" },
      { name: "description", content: "Área pessoal: histórico de pedidos, novos pedidos de serviço e contacto direto." },
    ],
  }),
  component: AccountPage,
});

type ServiceCategory = "reprografia" | "informatica" | "redes" | "papelaria" | "design" | "outro";
type RequestStatus = "pending" | "in_progress" | "completed" | "cancelled";
type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";

type ServiceRequest = {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  status: RequestStatus;
  created_at: string;
};

type StoreOrder = {
  id: string;
  order_number: string;
  total: number;
  status: OrderStatus;
  delivery_type: string;
  created_at: string;
  order_items: { name: string; quantity: number }[];
};

type Profile = { full_name: string; phone: string | null; email: string | null };

const categoryLabel: Record<ServiceCategory, string> = {
  reprografia: "Reprografia", informatica: "Informática", redes: "Redes",
  papelaria: "Papelaria", design: "Design", outro: "Outro",
};

const reqStatusStyle: Record<RequestStatus, string> = {
  pending:    "bg-amber-100 text-amber-700",
  in_progress:"bg-blue-100 text-blue-700",
  completed:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-muted text-muted-foreground",
};

const reqStatusLabel: Record<RequestStatus, string> = {
  pending: "Pendente", in_progress: "Em curso", completed: "Concluído", cancelled: "Cancelado",
};

const orderStatusStyle: Record<OrderStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  preparing:  "bg-orange-100 text-orange-700",
  delivering: "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-muted text-muted-foreground",
};

const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Pendente", confirmed: "Confirmado", preparing: "Em preparação",
  delivering: "Em entrega", delivered: "Entregue", cancelled: "Cancelado",
};

const requestSchema = z.object({
  category: z.enum(["reprografia","informatica","redes","papelaria","design","outro"]),
  title: z.string().trim().min(3, "Título muito curto").max(120),
  description: z.string().trim().min(5, "Descreva o pedido").max(2000),
});

type TabId = "pedidos" | "loja" | "perfil";

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("pedidos");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ category: ServiceCategory; title: string; description: string }>({
    category: "reprografia", title: "", description: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).maybeSingle(),
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, order_number, total, status, delivery_type, created_at, order_items(name, quantity)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([{ data: prof }, { data: reqs }, { data: ords }]) => {
      setProfile(prof as Profile | null);
      setRequests((reqs as ServiceRequest[]) ?? []);
      setOrders((ords as StoreOrder[]) ?? []);
    });
  }, [user]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("service_requests")
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setRequests((r) => [data as ServiceRequest, ...r]);
    setForm({ category: "reprografia", title: "", description: "" });
    setShowForm(false);
    toast.success("Pedido enviado! Entraremos em contacto em breve.");
  };

  const cancelRequest = async (id: string) => {
    const { error } = await supabase.from("service_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRequests((r) => r.map((x) => (x.id === id ? { ...x, status: "cancelled" as RequestStatus } : x)));
    toast.success("Pedido cancelado");
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      </Layout>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "pedidos", label: "Pedidos de serviço", icon: ClipboardList, count: requests.length },
    { id: "loja",    label: "Compras na loja",    icon: ShoppingBag,   count: orders.length },
    { id: "perfil",  label: "Perfil",             icon: User },
  ];

  return (
    <Layout>
      <PageHero
        title={profile?.full_name ? `Olá, ${profile.full_name.split(" ")[0]}` : "A Minha Conta"}
        subtitle="Acompanhe os seus pedidos, compras e dados pessoais."
      />

      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Profile card */}
            <div className="rounded-2xl border border-border bg-card shadow-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-bold text-lg flex-shrink-0">
                  {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{profile?.full_name ?? "Utilizador"}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email ?? user.email}</p>
                </div>
              </div>

              {/* Nav tabs */}
              <nav className="space-y-1">
                {tabs.map(({ id, label, icon: Icon, count }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth text-left ${activeTab === id ? "bg-gradient-brand text-brand-foreground" : "text-foreground/70 hover:bg-muted hover:text-brand"}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {count !== undefined && count > 0 && (
                      <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${activeTab === id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-smooth"
              >
                <LogOut className="h-4 w-4" /> Terminar sessão
              </button>
            </div>

            {/* Quick contact */}
            <div className="rounded-2xl border border-border bg-card shadow-card p-5">
              <h3 className="text-sm font-bold text-brand mb-3">Contacto rápido</h3>
              <div className="space-y-2">
                <a href="tel:+258874383621" className="flex items-center gap-2 rounded-lg p-2.5 text-sm hover:bg-muted transition-smooth">
                  <Phone className="h-4 w-4 text-gold" /> 874 383 621
                </a>
                <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg p-2.5 text-sm hover:bg-muted transition-smooth">
                  <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* ── PEDIDOS DE SERVIÇO ── */}
            {activeTab === "pedidos" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-brand">Pedidos de Serviço</h2>
                  <button
                    onClick={() => setShowForm((s) => !s)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                  >
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showForm ? "Fechar" : "Novo pedido"}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={submitRequest} className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
                    <h3 className="font-semibold text-foreground">Novo pedido de serviço</h3>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Categoria</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        {Object.entries(categoryLabel).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Título</label>
                      <input
                        placeholder="Ex: Impressão de 50 panfletos A5"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                      <textarea
                        rows={4}
                        placeholder="Detalhes do que precisa..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                      >
                        {submitting ? "A enviar..." : "Enviar pedido"}
                      </button>
                      <button type="button" onClick={() => setShowForm(false)}
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                    <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Ainda não tem pedidos de serviço.</p>
                    <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-semibold text-gold hover:underline">
                      Fazer o primeiro pedido
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {requests.map((r) => (
                      <li key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition-smooth">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                                {categoryLabel[r.category]}
                              </span>
                              <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${reqStatusStyle[r.status]}`}>
                                {reqStatusLabel[r.status]}
                              </span>
                            </div>
                            <h3 className="font-semibold text-brand">{r.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString("pt-PT")}
                            </p>
                          </div>
                          {r.status === "pending" && (
                            <button
                              onClick={() => cancelRequest(r.id)}
                              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-smooth flex-shrink-0"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── COMPRAS NA LOJA ── */}
            {activeTab === "loja" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-brand">Compras na Loja</h2>
                  <Link to="/loja" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth">
                    <ShoppingBag className="h-4 w-4" /> Ir à loja
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Ainda não fizeste nenhuma compra na loja.</p>
                    <Link to="/loja/papelaria" className="mt-3 inline-block text-sm font-semibold text-gold hover:underline">
                      Ver produtos
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {orders.map((o) => (
                      <li key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition-smooth">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-bold text-brand text-sm">{o.order_number}</span>
                              <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${orderStatusStyle[o.status as OrderStatus] ?? "bg-muted text-muted-foreground"}`}>
                                {orderStatusLabel[o.status as OrderStatus] ?? o.status}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {o.delivery_type === "pickup" ? "Levantamento" : "Entrega"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {o.order_items.slice(0, 3).map((i, idx) => (
                                <span key={idx}>{idx > 0 ? " · " : ""}{i.name} ×{i.quantity}</span>
                              ))}
                              {o.order_items.length > 3 && <span> +{o.order_items.length - 3} mais</span>}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(o.created_at).toLocaleString("pt-PT")}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-brand">
                              {o.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                            </p>
                            <Link
                              to="/loja/pedido/$id"
                              params={{ id: o.id }}
                              className="text-xs text-muted-foreground hover:text-brand"
                            >
                              Ver detalhes →
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── PERFIL ── */}
            {activeTab === "perfil" && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-brand">Os meus dados</h2>
                <div className="rounded-2xl border border-border bg-card shadow-card p-6 divide-y divide-border">
                  {[
                    { label: "Nome completo", value: profile?.full_name ?? "—" },
                    { label: "Email",         value: profile?.email ?? user.email ?? "—" },
                    { label: "Telefone",      value: profile?.phone ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Para actualizar os seus dados, contacte-nos via{" "}
                  <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    WhatsApp
                  </a>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

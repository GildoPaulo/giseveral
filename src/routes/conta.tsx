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
  Star, Shield, Edit3, Check, Eye, EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "A Minha Conta — Giseveral e Services" },
      { name: "description", content: "Área pessoal: perfil, pedidos, avaliações e segurança." },
    ],
  }),
  component: AccountPage,
});

type ServiceCategory = "reprografia" | "informatica" | "redes" | "papelaria" | "design" | "outro";
type RequestStatus = "pending" | "in_progress" | "completed" | "cancelled";
type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";

type ServiceRequest = {
  id: string; category: ServiceCategory; title: string;
  description: string; status: RequestStatus; created_at: string;
};
type StoreOrder = {
  id: string; order_number: string; total: number; status: OrderStatus;
  delivery_type: string; created_at: string;
  order_items: { name: string; quantity: number }[];
};
type Profile = { full_name: string; phone: string | null; email: string | null };

const categoryLabel: Record<ServiceCategory, string> = {
  reprografia: "Reprografia", informatica: "Informática", redes: "Redes",
  papelaria: "Papelaria", design: "Design", outro: "Outro",
};
const reqStatusStyle: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-700", in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-muted text-muted-foreground",
};
const reqStatusLabel: Record<RequestStatus, string> = {
  pending: "Pendente", in_progress: "Em curso", completed: "Concluído", cancelled: "Cancelado",
};
const orderStatusStyle: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700", delivering: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-muted text-muted-foreground",
};
const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Pendente", confirmed: "Confirmado", preparing: "Em preparação",
  delivering: "Em entrega", delivered: "Entregue", cancelled: "Cancelado",
};

const requestSchema = z.object({
  category: z.enum(["reprografia", "informatica", "redes", "papelaria", "design", "outro"]),
  title: z.string().trim().min(3, "Título muito curto").max(120),
  description: z.string().trim().min(5, "Descreva o pedido").max(2000),
});

type TabId = "dados" | "pedidos" | "avaliacoes" | "seguranca";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hover || value) ? "fill-gold text-gold" : "text-border"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("dados");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ category: ServiceCategory; title: string; description: string }>({
    category: "reprografia", title: "", description: "",
  });

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Reviews
  const [reviewMap, setReviewMap] = useState<Record<string, { rating: number; comment: string; saved: boolean }>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).maybeSingle(),
      supabase.from("service_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("id, order_number, total, status, delivery_type, created_at, order_items(name, quantity)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([{ data: prof }, { data: reqs }, { data: ords }]) => {
      setProfile(prof as Profile | null);
      setEditForm({ full_name: prof?.full_name ?? "", phone: prof?.phone ?? "" });
      setRequests((reqs as ServiceRequest[]) ?? []);
      setOrders((ords as StoreOrder[]) ?? []);
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    if (!editForm.full_name.trim()) { toast.error("Nome obrigatório"); return; }
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name.trim(),
      phone: editForm.phone.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSavingProfile(false);
    if (error) { toast.error("Erro ao guardar: " + error.message); return; }
    setProfile((p) => p ? { ...p, full_name: editForm.full_name.trim(), phone: editForm.phone.trim() || null } : p);
    setEditingProfile(false);
    toast.success("Perfil actualizado!");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw.length < 8) { toast.error("A nova senha deve ter pelo menos 8 caracteres"); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error("As senhas não coincidem"); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setSavingPw(false);
    if (error) { toast.error(error.message); return; }
    setPwForm({ current: "", newPw: "", confirm: "" });
    toast.success("Senha alterada com sucesso!");
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("service_requests").insert({ ...parsed.data, user_id: user.id }).select().single();
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

  const submitReview = async (orderId: string) => {
    const r = reviewMap[orderId];
    if (!r || r.rating === 0) { toast.error("Seleciona uma classificação"); return; }
    setReviewMap((m) => ({ ...m, [orderId]: { ...r, saved: true } }));
    toast.success("Avaliação guardada! Obrigado pelo seu feedback.");
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

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const totalItems = requests.length + orders.length;

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: "dados",      label: "Dados",       icon: User },
    { id: "pedidos",    label: "Pedidos",     icon: ShoppingBag, badge: totalItems },
    { id: "avaliacoes", label: "Avaliações",  icon: Star, badge: deliveredOrders.length },
    { id: "seguranca",  label: "Segurança",   icon: Shield },
  ];

  return (
    <Layout>
      <PageHero
        title={profile?.full_name ? `Olá, ${profile.full_name.split(" ")[0]}` : "A Minha Conta"}
        subtitle="Gerir perfil, pedidos, avaliações e segurança."
      />

      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
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

              <nav className="space-y-1">
                {tabs.map(({ id, label, icon: Icon, badge }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth text-left ${activeTab === id ? "bg-gradient-brand text-brand-foreground" : "text-foreground/70 hover:bg-muted hover:text-brand"}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${activeTab === id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        {badge}
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

          {/* Main */}
          <div className="lg:col-span-3">

            {/* ── DADOS ── */}
            {activeTab === "dados" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-brand">Os meus dados</h2>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-smooth"
                    >
                      <Edit3 className="h-4 w-4" /> Editar
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo *</label>
                      <input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Ex: 874 383 621"
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> {savingProfile ? "A guardar..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => { setEditingProfile(false); setEditForm({ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" }); }}
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* ── PEDIDOS ── */}
            {activeTab === "pedidos" && (
              <div className="space-y-8">
                {/* Service requests */}
                <div className="space-y-4">
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
                          {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
                        <button type="submit" disabled={submitting}
                          className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50">
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
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                      <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Ainda não tem pedidos de serviço.</p>
                      <button onClick={() => setShowForm(true)} className="mt-2 text-sm font-semibold text-gold hover:underline">
                        Fazer o primeiro pedido
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {requests.map((r) => (
                        <li key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{categoryLabel[r.category]}</span>
                                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${reqStatusStyle[r.status]}`}>{reqStatusLabel[r.status]}</span>
                              </div>
                              <h3 className="font-semibold text-brand">{r.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                              <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-PT")}</p>
                            </div>
                            {r.status === "pending" && (
                              <button onClick={() => cancelRequest(r.id)}
                                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-smooth flex-shrink-0">
                                Cancelar
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Store orders */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand">Compras na Loja</h2>
                    <Link to="/loja" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-smooth">
                      <ShoppingBag className="h-4 w-4" /> Ir à loja
                    </Link>
                  </div>

                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                      <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Ainda não fizeste nenhuma compra.</p>
                      <Link to="/loja/papelaria" className="mt-2 inline-block text-sm font-semibold text-gold hover:underline">
                        Ver produtos
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {orders.map((o) => (
                        <li key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
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
                              <p className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-PT")}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-brand">{o.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</p>
                              <Link to="/loja/pedido/$id" params={{ id: o.id }} className="text-xs text-muted-foreground hover:text-brand">
                                Ver detalhes →
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ── AVALIAÇÕES ── */}
            {activeTab === "avaliacoes" && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-brand">Avaliações</h2>

                {deliveredOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                    <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium text-foreground">Ainda não há encomendas entregues</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      As avaliações ficam disponíveis após a entrega da sua encomenda.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {deliveredOrders.map((o) => {
                      const rv = reviewMap[o.id] ?? { rating: 0, comment: "", saved: false };
                      return (
                        <li key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <span className="font-bold text-brand text-sm">{o.order_number}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {o.order_items.slice(0, 2).map((i, idx) => (
                                  <span key={idx}>{idx > 0 ? " · " : ""}{i.name}</span>
                                ))}
                                {o.order_items.length > 2 && <span> +{o.order_items.length - 2} mais</span>}
                              </p>
                            </div>
                            <span className="text-xs rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 font-medium">Entregue</span>
                          </div>

                          {rv.saved ? (
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                              <Check className="h-4 w-4" /> Avaliação guardada — obrigado!
                              <StarRating value={rv.rating} />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-foreground mb-1.5">Como foi a sua experiência?</p>
                                <StarRating
                                  value={rv.rating}
                                  onChange={(v) => setReviewMap((m) => ({ ...m, [o.id]: { ...rv, rating: v } }))}
                                />
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Deixe um comentário (opcional)..."
                                value={rv.comment}
                                onChange={(e) => setReviewMap((m) => ({ ...m, [o.id]: { ...rv, comment: e.target.value } }))}
                                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                              />
                              <button
                                onClick={() => submitReview(o.id)}
                                className="rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-brand-foreground"
                              >
                                Guardar avaliação
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* ── SEGURANÇA ── */}
            {activeTab === "seguranca" && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-brand">Segurança</h2>

                <div className="rounded-2xl border border-border bg-card shadow-card p-6">
                  <h3 className="font-semibold text-foreground mb-1">Alterar senha</h3>
                  <p className="text-sm text-muted-foreground mb-5">A nova senha deve ter pelo menos 8 caracteres.</p>

                  <form onSubmit={changePassword} className="space-y-4 max-w-md">
                    {([
                      { key: "newPw" as const, label: "Nova senha" },
                      { key: "confirm" as const, label: "Confirmar nova senha" },
                    ]).map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[key] ? "text" : "password"}
                            value={pwForm[key]}
                            onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={savingPw || !pwForm.newPw || !pwForm.confirm}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                    >
                      {savingPw ? "A alterar..." : "Alterar senha"}
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-card p-6">
                  <h3 className="font-semibold text-foreground mb-1">Email da conta</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email ?? user.email}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Para alterar o email, contacte-nos via{" "}
                    <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      WhatsApp
                    </a>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  Mail, Users, Send, TestTube2, Clock, CheckCircle2,
  AlertTriangle, Trash2, Eye, X, ChevronDown, ChevronUp,
} from "lucide-react";

export const Route = createFileRoute("/balcao/newsletter")({
  component: NewsletterAdmin,
});

type Subscriber = { id: string; email: string; source: string; subscribed_at: string };
type Campaign = { id: string; subject: string; body_html: string; sent_to: number; failed: number; status: string; created_at: string };

const STATUS_STYLE: Record<string, string> = {
  sent:    "bg-emerald-100 text-emerald-700",
  partial: "bg-yellow-100 text-yellow-700",
  failed:  "bg-red-100 text-red-700",
};

function NewsletterAdmin() {
  const { session } = useAuth();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Compose
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [preview, setPreview] = useState<Campaign | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoadingSubs(true);
    const [subRes, campRes] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
      supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false }),
    ]);
    if (subRes.data) setSubscribers(subRes.data as Subscriber[]);
    if (campRes.data) setCampaigns(campRes.data as Campaign[]);
    setLoadingSubs(false);
  }

  async function deleteSubscriber(id: string, email: string) {
    if (!confirm(`Remover ${email} da lista?`)) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover subscritor."); return; }
    setSubscribers((p) => p.filter((s) => s.id !== id));
    toast.success("Subscritor removido.");
  }

  async function sendCampaign(isTest: boolean) {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Assunto e conteúdo são obrigatórios.");
      return;
    }
    if (isTest && !testEmail.trim()) {
      toast.error("Introduza um email para teste.");
      return;
    }
    if (!isTest && !confirm(`Enviar a ${subscribers.length} subscritor(es)?`)) return;

    setSending(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/newsletter-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          body_html: bodyHtml,
          ...(isTest ? { test_email: testEmail.trim() } : {}),
        }),
      });

      const data = await res.json() as { sent?: number; failed?: number; total?: number; error?: string };

      if (!res.ok) {
        if (res.status === 503 || data.error?.toLowerCase().includes("not configured")) {
          toast.error("Serviço de email não configurado", {
            description: "Adicione RESEND_API_KEY, RESEND_FROM_EMAIL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do Cloudflare Pages.",
            duration: 8000,
          });
        } else {
          toast.error(data.error ?? "Erro ao enviar.");
        }
        return;
      }

      if (isTest) {
        toast.success(`Email de teste enviado para ${testEmail}.`);
      } else {
        toast.success(`Enviado para ${data.sent} subscritor(es). ${data.failed ? `Falhou: ${data.failed}` : ""}`);
        await loadData();
        setSubject("");
        setBodyHtml("");
      }
    } catch {
      toast.error("Erro de rede. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
          <Mail className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Newsletter</h1>
          <p className="text-sm text-muted-foreground">Gira subscritores e envia campanhas por email</p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Subscritores", value: subscribers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Campanhas", value: campaigns.length, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Emails enviados", value: campaigns.reduce((s, c) => s + c.sent_to, 0), icon: CheckCircle2, color: "text-gold", bg: "bg-amber-50" },
          { label: "Falhas totais", value: campaigns.reduce((s, c) => s + c.failed, 0), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg} mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{loadingSubs ? "…" : value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Compose ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground">Compor campanha</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Escreva o email e envie para todos os subscritores</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Assunto *</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: Bolsa Chevening 2026 — Prazo a fechar!"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <RichTextEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            label="Conteúdo do email *"
            hint="O conteúdo será enviado como HTML. Use formatação, links e imagens."
            placeholder="Escreva o conteúdo da newsletter..."
            bucket="images"
          />

          {/* Test email */}
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <TestTube2 className="h-3.5 w-3.5" /> Envio de teste
            </p>
            <div className="flex gap-2">
              <input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email-de-teste@exemplo.com"
                type="email"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button
                onClick={() => sendCampaign(true)}
                disabled={sending}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-smooth disabled:opacity-50"
              >
                <TestTube2 className="h-4 w-4" />
                Testar
              </button>
            </div>
          </div>

          {/* Send to all */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Enviar para <strong className="text-foreground">{subscribers.length}</strong> subscritor(es)
            </p>
            <button
              onClick={() => sendCampaign(false)}
              disabled={sending || subscribers.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth disabled:opacity-50"
            >
              {sending
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" />
                : <Send className="h-4 w-4" />
              }
              Enviar campanha
            </button>
          </div>
        </div>
      </div>

      {/* ── Campaign history ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground">Histórico de campanhas</h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Ainda não foram enviadas campanhas.</div>
        ) : (
          <div className="divide-y divide-border">
            {campaigns.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{c.subject}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[c.status] ?? "bg-muted text-muted-foreground"}`}>
                      {c.status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {c.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {c.sent_to} enviados
                    </span>
                    {c.failed > 0 && (
                      <span className="text-xs text-red-500">{c.failed} falhas</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(c.created_at).toLocaleString("pt-PT")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPreview(preview?.id === c.id ? null : c)}
                  className="text-muted-foreground hover:text-brand transition-colors flex-shrink-0"
                  title="Pré-visualizar"
                >
                  {preview?.id === c.id ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            ))}
            {preview && (
              <div className="px-5 py-4 bg-muted/30 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview: {preview.subject}</p>
                  <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className="prose prose-sm max-w-none bg-white rounded-lg p-4 border border-border text-foreground max-h-80 overflow-auto text-xs"
                  dangerouslySetInnerHTML={{ __html: preview.body_html }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Subscribers list ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <button
          onClick={() => setShowSubs(!showSubs)}
          className="w-full px-5 py-4 flex items-center justify-between border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Lista de subscritores ({subscribers.length})</h2>
          </div>
          {showSubs ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showSubs && (
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {subscribers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum subscritor ainda.</p>
            ) : (
              subscribers.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.source} · {new Date(s.subscribed_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSubscriber(s.id, s.email)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

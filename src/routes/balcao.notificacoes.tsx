import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, FormEvent } from "react";
import {
  Bell, Send, Users, User, GraduationCap, ShieldCheck,
  CheckCircle2, XCircle, Clock, RefreshCw, Trash2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/notificacoes")({
  component: BalcaoNotificacoes,
});

type LogEntry = {
  id: string;
  title: string;
  body: string;
  url: string;
  target_type: string;
  sent_count: number;
  failed_count: number;
  removed_count: number;
  sent_at: string;
};

const TARGET_OPTIONS = [
  { value: "all",      label: "Todos os subscritores",  icon: Users,         cls: "text-brand" },
  { value: "admins",   label: "Apenas admins",           icon: ShieldCheck,   cls: "text-red-600" },
  { value: "students", label: "Estudantes",              icon: GraduationCap, cls: "text-blue-600" },
];

function BalcaoNotificacoes() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);

  async function loadLog() {
    setLoadingLog(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      // Use anon key since service role must never be in the frontend
      // Admins can read via RLS policy
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("push_notifications_log")
        .select("id, title, body, url, target_type, sent_count, failed_count, removed_count, sent_at")
        .order("sent_at", { ascending: false })
        .limit(50);
      setLog((data ?? []) as LogEntry[]);
    } catch {
      // table may not exist yet in local dev
    } finally {
      setLoadingLog(false);
    }
  }

  useEffect(() => { loadLog(); }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Título e mensagem são obrigatórios.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/push-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url, target }),
      });
      const data = await res.json() as { sent?: number; failed?: number; removed?: number; total?: number; error?: string };
      if (!res.ok || data.error) {
        if (res.status === 503 || data.error?.toLowerCase().includes("not configured")) {
          toast.error("Push não configurado", {
            description: "Adicione VAPID_PRIVATE_KEY_JWK e SUPABASE_SERVICE_ROLE_KEY no Cloudflare Pages.",
            duration: 8000,
          });
        } else {
          toast.error(`Erro: ${data.error ?? res.statusText}`);
        }
      } else {
        toast.success(`Enviado! ${data.sent}/${data.total} entregues.`, {
          description: data.removed ? `${data.removed} subscrições inválidas removidas automaticamente.` : undefined,
        });
        setTitle("");
        setBody("");
        setUrl("/");
        loadLog();
      }
    } catch {
      toast.error("Erro de rede ao enviar notificação.");
    } finally {
      setSending(false);
    }
  }

  const charCount = body.length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700/40 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-400">Configuração necessária no Cloudflare Pages</p>
          <p className="text-amber-700 dark:text-amber-500 text-xs mt-1">
            Defina em <strong>Settings → Environment variables</strong>:{" "}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">VAPID_PRIVATE_KEY_JWK</code>{" · "}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Push Notifications</h1>
        <button
          onClick={loadLog}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        {/* ── Compose form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSend} className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-brand">
            <Bell className="h-4 w-4" /> Nova notificação
          </div>

          {/* Target audience */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Audiência
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TARGET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTarget(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[11px] font-semibold transition-smooth ${
                      target === opt.value
                        ? "border-brand bg-brand/8 text-brand shadow-card"
                        : "border-border text-muted-foreground hover:border-brand/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${target === opt.value ? "text-brand" : opt.cls}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={64}
              placeholder="Ex.: Nova bolsa Chevening 2026"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Mensagem
              </label>
              <span className={`text-[10px] ${charCount > 140 ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount}/160
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Texto que o utilizador vê na notificação..."
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Link ao clicar
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/hub/bolsas"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs space-y-1">
            <p className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Pré-visualização</p>
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded bg-brand flex-shrink-0 flex items-center justify-center">
                <Bell className="h-4 w-4 text-brand-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight">{title || "Título da notificação"}</p>
                <p className="text-muted-foreground mt-0.5 leading-snug">{body || "Texto da mensagem..."}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            {sending ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> A enviar...</>
            ) : (
              <><Send className="h-4 w-4" /> Enviar notificação</>
            )}
          </button>
        </form>

        {/* ── History ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <p className="text-sm font-semibold text-brand mb-4 flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Histórico recente
          </p>

          {loadingLog ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
            </div>
          ) : log.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Nenhuma notificação enviada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {log.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-3 text-xs space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground leading-tight line-clamp-1">{entry.title}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {new Date(entry.sent_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{entry.body}</p>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold
                      ${entry.target_type === "admins" ? "bg-red-50 text-red-600 dark:bg-red-950/30" :
                        entry.target_type === "students" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30" :
                        "bg-brand/10 text-brand"}`}
                    >
                      {entry.target_type === "all" ? "Todos" : entry.target_type === "admins" ? "Admins" : "Estudantes"}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> {entry.sent_count}
                    </span>
                    {entry.failed_count > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-3 w-3" /> {entry.failed_count}
                      </span>
                    )}
                    {entry.removed_count > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Trash2 className="h-3 w-3" /> {entry.removed_count} removidas
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

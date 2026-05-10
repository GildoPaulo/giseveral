// POST /api/auto-notify
// Orchestrates push + email + in-app notifications for system events.
// Requires admin/staff Authorization token.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
}

interface Payload {
  event_type: string;
  title: string;
  body: string;
  url: string;
  channels: Array<"push" | "email" | "inapp">;
  target: "all" | "user";
  user_id?: string;
  notif_type?: string;
  email_subject?: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL } = context.env;

  // ── Validate admin token ───────────────────────────────────────────────────
  const token = context.request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: CORS });
  }
  const userData = await userRes.json() as { id: string };

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role&limit=1`,
    { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY } }
  );
  const profiles = await profileRes.json() as { role: string }[];
  if (!profiles[0] || !["admin", "staff"].includes(profiles[0].role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  let payload: Payload;
  try {
    payload = await context.request.json<Payload>();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { title, body, url, channels, target, user_id, notif_type, email_subject } = payload;
  if (!title || !body || !channels?.length || !target) {
    return new Response(JSON.stringify({ error: "title, body, channels, target required" }), { status: 400, headers: CORS });
  }

  const origin = new URL(context.request.url).origin;
  const results: Record<string, unknown> = {};

  // ── Push notification ──────────────────────────────────────────────────────
  if (channels.includes("push")) {
    try {
      const pushBody: Record<string, unknown> = { title, body, url, target };
      if (target === "user" && user_id) pushBody.user_id = user_id;

      const res = await fetch(`${origin}/api/push-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pushBody),
      });
      results.push = await res.json().catch(() => ({ status: res.status }));
    } catch (e) {
      results.push = { error: String(e) };
    }
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  if (channels.includes("email")) {
    const emailHtml = buildEmailHtml(title, body, url);
    const subject = email_subject ?? title;

    if (target === "all") {
      // Newsletter to all subscribers via existing function
      try {
        const res = await fetch(`${origin}/api/newsletter-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subject, body_html: emailHtml }),
        });
        results.email = await res.json().catch(() => ({ status: res.status }));
      } catch (e) {
        results.email = { error: String(e) };
      }
    } else if (target === "user" && user_id && RESEND_API_KEY) {
      // Personal email to specific user
      try {
        const authUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
          headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
        });
        if (authUserRes.ok) {
          const authUser = await authUserRes.json() as { email?: string };
          if (authUser.email) {
            const from = RESEND_FROM_EMAIL || "Giseveral <onboarding@resend.dev>";
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from, to: [authUser.email], subject, html: emailHtml }),
            });
            results.email = { status: res.status, to: authUser.email };
          }
        }
      } catch (e) {
        results.email = { error: String(e) };
      }
    }
  }

  // ── In-app notification (user-specific only) ───────────────────────────────
  if (channels.includes("inapp") && target === "user" && user_id) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id,
          type: notif_type ?? "info",
          title,
          body,
          link: url,
          is_read: false,
        }),
      });
      results.inapp = { status: res.status };
    } catch (e) {
      results.inapp = { error: String(e) };
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: CORS });
};

// ── Email HTML template ────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmailHtml(title: string, body: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
<tr><td style="background:linear-gradient(135deg,#3b0764,#6d28d9);padding:28px 32px">
  <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Giseveral</p>
  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3">${esc(title)}</h1>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.7">${esc(body)}</p>
  <a href="${ctaUrl}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">Ver mais →</a>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5">
  <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5">
    Recebeste este email porque estás subscrito às notificações da Giseveral.<br>
    <a href="https://giseveral.com" style="color:#6d28d9;text-decoration:none">giseveral.com</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

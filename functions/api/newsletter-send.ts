interface Env {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string; // e.g. "Giseveral <geral@giseveral.com>"
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Payload {
  subject: string;
  body_html: string;
  test_email?: string; // if set, only send to this address (test mode)
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
  // ── 1. Validate API keys present ──────────────────────────────────────────
  const { RESEND_API_KEY, RESEND_FROM_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env;
  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), { status: 503, headers: CORS });
  }

  // ── 2. Verify caller is admin/staff ───────────────────────────────────────
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
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

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  let payload: Payload;
  try {
    payload = await context.request.json<Payload>();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { subject, body_html, test_email } = payload;
  if (!subject?.trim() || !body_html?.trim()) {
    return new Response(JSON.stringify({ error: "subject and body_html are required" }), { status: 400, headers: CORS });
  }

  // ── 4. Fetch subscribers (or use test email) ──────────────────────────────
  let recipients: string[];
  if (test_email) {
    recipients = [test_email];
  } else {
    const subsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/newsletter_subscribers?select=email&order=subscribed_at.desc&limit=500`,
      { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY } }
    );
    const subs = await subsRes.json() as { email: string }[];
    recipients = subs.map((s) => s.email);
  }

  if (recipients.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, total: 0, message: "No subscribers" }), { status: 200, headers: CORS });
  }

  // ── 5. Send via Resend (batch up to 100 at a time) ────────────────────────
  const from = RESEND_FROM_EMAIL || "Giseveral <onboarding@resend.dev>";
  const BATCH = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);

    // Use Resend batch endpoint
    const batchPayload = chunk.map((email) => ({
      from,
      to: [email],
      subject,
      html: body_html,
    }));

    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchPayload),
    });

    if (res.ok) {
      sent += chunk.length;
    } else {
      // Fall back to individual sends if batch fails
      for (const email of chunk) {
        const singleRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to: [email], subject, html: body_html }),
        });
        if (singleRes.ok) sent++;
        else failed++;
      }
    }
  }

  // ── 6. Log campaign (skip for test sends) ─────────────────────────────────
  if (!test_email) {
    await fetch(`${SUPABASE_URL}/rest/v1/newsletter_campaigns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        subject,
        body_html,
        sent_to: sent,
        failed,
        status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
      }),
    });
  }

  return new Response(
    JSON.stringify({ sent, failed, total: recipients.length, test: !!test_email }),
    { status: 200, headers: CORS }
  );
};

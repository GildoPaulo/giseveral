interface Env {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string; // Set to "Giseveral <geral@giseveral.com>" after verifying domain in Resend
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { to, subject, html } = await context.request.json<EmailPayload>();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const RESEND_KEY = context.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 503, headers: corsHeaders });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: context.env.RESEND_FROM_EMAIL || "Giseveral <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

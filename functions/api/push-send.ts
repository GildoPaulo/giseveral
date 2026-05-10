// POST /api/push-send
// Body: { title, body, url, target?: "all" | "admins" | "students" | "user", user_id? }
// Requires VAPID_PRIVATE_KEY_JWK and SUPABASE_* env vars.
// Uses RFC 8291 (aes128gcm) Web Push encryption.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VAPID_PRIVATE_KEY_JWK: string;
  PUSH_RATE_LIMIT?: string; // optional, defaults to 20/min
}

const VAPID_PUBLIC_KEY =
  "BCRMoEH3RVWPg7NYPGtPnth4x4uL5ZOR7kIhEvadQdpNA4SbuqjJAUzWRXuVAS4ARe-kTo3HSCeM4Ml8p-RHK1Y";
const VAPID_SUBJECT = "mailto:geral@giseveral.com";

// Simple in-memory rate limiter (resets per worker instance, ~1–5 min TTL)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxPerMin = 20): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMin) return false;
  entry.count++;
  return true;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function b64url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromB64url(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b + "=".repeat((4 - (b.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function hmac256(key: ArrayBuffer | Uint8Array, data: ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", k, data);
}

async function hkdfExpand(prk: ArrayBuffer, info: Uint8Array, len: number): Promise<Uint8Array> {
  const result = new Uint8Array(Math.ceil(len / 32) * 32);
  let prev = new Uint8Array(0);
  for (let i = 0; i < Math.ceil(len / 32); i++) {
    const input = new Uint8Array(prev.length + info.length + 1);
    input.set(prev); input.set(info, prev.length); input[prev.length + info.length] = i + 1;
    prev = new Uint8Array(await hmac256(prk, input));
    result.set(prev, i * 32);
  }
  return result.slice(0, len);
}

// ── RFC 8291 Web Push Encryption ──────────────────────────────────────────────

async function encryptPayload(
  plaintext: string,
  p256dhB64: string,
  authB64: string,
): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const subPubKeyRaw = fromB64url(p256dhB64);
  const authSecret = fromB64url(authB64);

  const subPubKey = await crypto.subtle.importKey(
    "raw", subPubKeyRaw, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  const senderPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const senderPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderPair.publicKey)
  );

  const ecdhSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subPubKey }, senderPair.privateKey, 256
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyInfoLabel = enc.encode("WebPush: info");
  const keyInfo = new Uint8Array(keyInfoLabel.length + 1 + subPubKeyRaw.length + senderPubRaw.length);
  keyInfo.set(keyInfoLabel); keyInfo[keyInfoLabel.length] = 0x00;
  keyInfo.set(subPubKeyRaw, keyInfoLabel.length + 1);
  keyInfo.set(senderPubRaw, keyInfoLabel.length + 1 + subPubKeyRaw.length);

  const prkKey = await hmac256(authSecret, ecdhSecret);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);
  const prk = await hmac256(salt, ikm);

  const cekLabel = enc.encode("Content-Encoding: aes128gcm");
  const cekInfo = new Uint8Array(cekLabel.length + 2);
  cekInfo.set(cekLabel); cekInfo[cekLabel.length] = 0x00; cekInfo[cekLabel.length + 1] = 0x01;
  const cek = await hkdfExpand(prk, cekInfo, 16);

  const nonceLabel = enc.encode("Content-Encoding: nonce");
  const nonceInfo = new Uint8Array(nonceLabel.length + 2);
  nonceInfo.set(nonceLabel); nonceInfo[nonceLabel.length] = 0x00; nonceInfo[nonceLabel.length + 1] = 0x01;
  const nonce = await hkdfExpand(prk, nonceInfo, 12);

  const ptBytes = enc.encode(plaintext);
  const padded = new Uint8Array(ptBytes.length + 1);
  padded.set(ptBytes); padded[ptBytes.length] = 0x02;

  const cekKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded);

  const rs = 4096;
  const out = new Uint8Array(16 + 4 + 1 + 65 + ct.byteLength);
  out.set(salt, 0);
  out[16] = (rs >>> 24) & 0xff; out[17] = (rs >>> 16) & 0xff;
  out[18] = (rs >>> 8) & 0xff;  out[19] = rs & 0xff;
  out[20] = 65;
  out.set(senderPubRaw, 21);
  out.set(new Uint8Array(ct), 86);
  return out.buffer;
}

// ── VAPID JWT ─────────────────────────────────────────────────────────────────

async function vapidJWT(audience: string, privateJwk: JsonWebKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const hdr = b64url(enc.encode(JSON.stringify({ alg: "ES256", typ: "JWT" })));
  const pay = b64url(enc.encode(JSON.stringify({
    aud: audience, exp: now + 43200, sub: VAPID_SUBJECT,
  })));
  const sigInput = `${hdr}.${pay}`;

  const privKey = await crypto.subtle.importKey(
    "jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privKey, enc.encode(sigInput)
  );
  return `${sigInput}.${b64url(sig)}`;
}

// ── Send one push — returns status code ───────────────────────────────────────

async function sendOne(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  privateJwk: JsonWebKey,
): Promise<number> {
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await vapidJWT(audience, privateJwk);
  const body = await encryptPayload(payload, sub.p256dh, sub.auth);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body,
  });

  return res.status;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const onRequestOptions = () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Rate limit by IP
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const maxPerMin = parseInt(env.PUSH_RATE_LIMIT ?? "20", 10);
  if (!checkRateLimit(ip, maxPerMin)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
  }

  try {
    const {
      title = "Giseveral",
      body = "",
      url = "/",
      target = "all",     // "all" | "admins" | "students" | "user"
      user_id,            // only used when target === "user"
    } = await request.json() as {
      title?: string; body?: string; url?: string;
      target?: string; user_id?: string;
    };

    const privateJwk: JsonWebKey = JSON.parse(env.VAPID_PRIVATE_KEY_JWK);

    // Build filter query based on target
    let query = `${env.SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth`;
    if (target === "admins") {
      query += "&role=eq.admin";
    } else if (target === "students") {
      query += "&role=eq.student";
    } else if (target === "user" && user_id) {
      query += `&user_id=eq.${user_id}`;
    }
    // "all" — no filter

    const sbRes = await fetch(query, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!sbRes.ok) throw new Error("Cannot fetch subscriptions");

    const subs: Array<{ endpoint: string; p256dh: string; auth: string }> = await sbRes.json();
    const payload = JSON.stringify({ title, body, url });

    let sent = 0;
    let failed = 0;
    const staleEndpoints: string[] = [];

    await Promise.allSettled(
      subs.map(async (s) => {
        const status = await sendOne(s, payload, privateJwk);
        if (status === 200 || status === 201) {
          sent++;
        } else if (status === 410 || status === 404) {
          // Browser unsubscribed or endpoint expired — remove it
          staleEndpoints.push(s.endpoint);
          failed++;
        } else {
          failed++;
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await fetch(
        `${env.SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=in.(${staleEndpoints.map(e => `"${e}"`).join(",")})`,
        {
          method: "DELETE",
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
    }

    // Log to push_notifications_log (best-effort)
    fetch(`${env.SUPABASE_URL}/rest/v1/push_notifications_log`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title, body, url,
        target_type: target,
        target_user_id: user_id ?? null,
        sent_count: sent,
        failed_count: failed,
        removed_count: staleEndpoints.length,
      }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({ sent, failed, removed: staleEndpoints.length, total: subs.length }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};

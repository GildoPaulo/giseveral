import { supabase } from "@/integrations/supabase/client";

export type AutoNotifyChannel = "push" | "email" | "inapp";
export type AutoNotifType = "order" | "progress" | "delivery" | "done" | "promo" | "alert" | "info";

export interface AutoNotifyOptions {
  event_type: string;
  title: string;
  body: string;
  url: string;
  channels: AutoNotifyChannel[];
  target: "all" | "user";
  user_id?: string;
  notif_type?: AutoNotifType;
  email_subject?: string;
}

export async function triggerAutoNotify(options: AutoNotifyOptions): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch("/api/auto-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    });
  } catch {
    // Best-effort — never block the main admin action
  }
}

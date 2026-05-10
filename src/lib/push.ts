export async function sendPushNotification(opts: {
  title: string;
  body: string;
  url?: string;
  target?: "all" | "admins" | "students" | "user";
  user_id?: string;
}): Promise<void> {
  try {
    await fetch("/api/push-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  } catch {
    // non-critical — push failure should never block UI
  }
}

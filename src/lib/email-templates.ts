export function orderConfirmationEmail(order: {
  order_number: string;
  customer_name: string;
  total: number;
  items: string;
}): { subject: string; html: string } {
  return {
    subject: `Pedido ${order.order_number} confirmado — Giseveral`,
    html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1a3a6b;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">GISEVERAL E SERVICES</h1>
      <p style="color:#d4af37;margin:6px 0 0;font-size:13px;letter-spacing:2px">BEIRA, MOÇAMBIQUE</p>
    </div>
    <div style="padding:32px 24px">
      <h2 style="color:#1a3a6b;margin:0 0 8px">Pedido confirmado ✓</h2>
      <p style="color:#555;margin:0 0 24px">Olá <strong>${order.customer_name}</strong>, recebemos o seu pedido!</p>
      <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Nº do Pedido</p>
        <p style="margin:0;font-size:22px;font-weight:bold;color:#1a3a6b">${order.order_number}</p>
      </div>
      <p style="color:#555;margin:0 0 8px"><strong>Itens:</strong> ${order.items}</p>
      <p style="color:#555;margin:0 0 24px"><strong>Total:</strong> ${order.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</p>
      <p style="color:#888;font-size:13px;margin:0">Entraremos em contacto em breve para confirmar os detalhes. Obrigado pela sua preferência!</p>
    </div>
    <div style="background:#f8f9fa;padding:20px 24px;text-align:center">
      <p style="margin:0;color:#aaa;font-size:12px">Giseveral e Services · Beira, Moçambique · +258 874 383 621</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function orderStatusEmail(order: {
  order_number: string;
  customer_name: string;
  status: string;
}): { subject: string; html: string } {
  const statusMap: Record<string, { label: string; color: string; message: string }> = {
    confirmed:  { label: "Confirmado",    color: "#3b82f6", message: "O seu pedido foi confirmado e está a ser preparado." },
    preparing:  { label: "Em preparação", color: "#f59e0b", message: "O seu pedido está a ser preparado pela nossa equipa." },
    delivering: { label: "Em entrega",    color: "#8b5cf6", message: "O seu pedido está a caminho! Esteja atento." },
    delivered:  { label: "Entregue",      color: "#10b981", message: "O seu pedido foi entregue. Obrigado pela sua confiança!" },
    cancelled:  { label: "Cancelado",     color: "#ef4444", message: "O seu pedido foi cancelado. Contacte-nos para mais informações." },
  };
  const st = statusMap[order.status] ?? { label: order.status, color: "#666", message: "Estado actualizado." };
  return {
    subject: `Pedido ${order.order_number} — ${st.label}`,
    html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1a3a6b;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">GISEVERAL E SERVICES</h1>
    </div>
    <div style="padding:32px 24px">
      <div style="display:inline-block;background:${st.color}20;border:1px solid ${st.color}40;border-radius:20px;padding:6px 16px;margin-bottom:20px">
        <span style="color:${st.color};font-weight:bold;font-size:14px">${st.label}</span>
      </div>
      <h2 style="color:#1a3a6b;margin:0 0 8px">Actualização do pedido</h2>
      <p style="color:#555">Olá <strong>${order.customer_name}</strong>,</p>
      <p style="color:#555">O seu pedido <strong>${order.order_number}</strong> foi actualizado.</p>
      <p style="color:#555">${st.message}</p>
    </div>
    <div style="background:#f8f9fa;padding:20px 24px;text-align:center">
      <p style="margin:0;color:#aaa;font-size:12px">Giseveral e Services · Beira, Moçambique · +258 874 383 621</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

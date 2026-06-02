import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSubscription } from "@/lib/storage";
import { getPlanById } from "@/lib/plans";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("No autenticado", { status: 401 });

    const user = await currentUser();
    const sub  = await getSubscription(userId);
    if (!sub || sub.plan === "free") return new NextResponse("Sin suscripción activa", { status: 404 });

    const plan     = getPlanById(sub.planId || "starter");
    const name     = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Cliente";
    const email    = user?.emailAddresses?.[0]?.emailAddress || "";
    const amount   = sub.lastInvoiceAmount ?? sub.amount ?? plan.price;
    const date     = sub.lastInvoiceDate
      ? new Date(sub.lastInvoiceDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
    const receiptId = `BF-${Date.now().toString(36).toUpperCase()}`;
    const periodEnd = sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
      : "—";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo Botflow #${receiptId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFF; color: #0F172A; }
    .container { max-width: 640px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
    .header { background: #2563EB; padding: 36px 40px; color: white; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .logo-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .logo-name { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .receipt-title { font-size: 15px; opacity: 0.85; margin-bottom: 4px; }
    .receipt-id { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
    .body { padding: 36px 40px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F1F5F9; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 14px; color: #64748B; }
    .info-value { font-size: 14px; font-weight: 600; color: #0F172A; text-align: right; }
    .plan-card { background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 14px; padding: 20px 22px; display: flex; align-items: center; justify-content: space-between; }
    .plan-name { font-size: 18px; font-weight: 800; color: #2563EB; }
    .plan-desc { font-size: 13px; color: #64748B; margin-top: 2px; }
    .plan-price { font-size: 28px; font-weight: 900; color: #2563EB; }
    .plan-interval { font-size: 13px; color: #64748B; }
    .total-row { background: #F8FAFF; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
    .total-label { font-size: 15px; font-weight: 700; color: #0F172A; }
    .total-amount { font-size: 24px; font-weight: 900; color: #2563EB; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 100px; padding: 6px 14px; font-size: 13px; font-weight: 700; color: #16A34A; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #16A34A; }
    .footer { background: #F8FAFF; border-top: 1px solid #E2E8F0; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94A3B8; line-height: 1.6; }
    .footer a { color: #2563EB; text-decoration: none; font-weight: 600; }
    @media print { body { background: white; } .container { box-shadow: none; margin: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">💬</div>
        <div class="logo-name">Bot<span style="opacity:0.7">flow</span></div>
      </div>
      <div class="receipt-title">Comprobante de pago</div>
      <div class="receipt-id">#${receiptId}</div>
    </div>

    <div class="body">
      <div class="section">
        <div class="section-title">Estado del pago</div>
        <span class="status-badge">
          <span class="status-dot"></span>
          Pago exitoso
        </span>
      </div>

      <div class="section">
        <div class="section-title">Información del cliente</div>
        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fecha de pago</span>
          <span class="info-value">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Próxima renovación</span>
          <span class="info-value">${periodEnd}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Plan contratado</div>
        <div class="plan-card">
          <div>
            <div class="plan-name">${plan.name}</div>
            <div class="plan-desc">${plan.limits.bots === Infinity ? "Bots ilimitados" : `${plan.limits.bots} bots`} · ${plan.limits.messagesPerMonth === Infinity ? "Mensajes ilimitados" : `${plan.limits.messagesPerMonth.toLocaleString()} msgs/mes`}</div>
          </div>
          <div style="text-align:right">
            <div class="plan-price">$${plan.price}</div>
            <div class="plan-interval">USD/mes</div>
          </div>
        </div>
        <div class="total-row">
          <span class="total-label">Total cobrado</span>
          <span class="total-amount">$${amount.toFixed(2)} USD</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Método de pago</div>
        <div class="info-row">
          <span class="info-label">Procesado por</span>
          <span class="info-value">Stripe — tarjeta de crédito/débito</span>
        </div>
        <div class="info-row">
          <span class="info-label">ID de suscripción</span>
          <span class="info-value" style="font-family:monospace;font-size:12px">${sub.stripeSubscriptionId || "—"}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Botflow · Plataforma de agentes de WhatsApp con IA<br>
      ¿Preguntas? Escríbenos a <a href="mailto:soporte@botflow.app">soporte@botflow.app</a><br>
      Este documento es tu comprobante oficial de pago.</p>
      <div style="margin-top:16px">
        <button onclick="window.print()" style="padding:8px 20px;background:#2563EB;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px">🖨 Imprimir</button>
        <button onclick="window.close()" style="padding:8px 20px;background:#F1F5F9;color:#64748B;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Cerrar</button>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    return new NextResponse("Error generando recibo: " + err.message, { status: 500 });
  }
}

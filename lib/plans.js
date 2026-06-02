// ── Botflow Plan Definitions ──────────────────────────────
// priceId values are set via environment variables so they
// can differ between Stripe test and live modes.

export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: null,
    priceId: null,
    color: "#64748B",
    badge: null,
    limits: {
      bots: 1,
      messagesPerMonth: 100,
      knowledgeFiles: 3,
      analytics: false,
      whatsapp: false,
      support: "community",
    },
    features: [
      "1 bot",
      "100 mensajes / mes",
      "3 archivos en Knowledge Base",
      "Chat de prueba",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_STARTER,
    color: "#2563EB",
    badge: null,
    limits: {
      bots: 3,
      messagesPerMonth: 2000,
      knowledgeFiles: 20,
      analytics: true,
      whatsapp: true,
      support: "email",
    },
    features: [
      "3 bots",
      "2,000 mensajes / mes",
      "20 archivos Knowledge Base",
      "WhatsApp Business real",
      "Analytics básicos",
      "Soporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_PRO,
    color: "#7C3AED",
    badge: "Más popular",
    limits: {
      bots: 10,
      messagesPerMonth: 10000,
      knowledgeFiles: 100,
      analytics: true,
      whatsapp: true,
      support: "priority",
    },
    features: [
      "10 bots",
      "10,000 mensajes / mes",
      "100 archivos Knowledge Base",
      "WhatsApp Business real",
      "Analytics avanzados",
      "Soporte prioritario",
      "Acceso a nuevas funciones primero",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    color: "#0F172A",
    badge: null,
    limits: {
      bots: Infinity,
      messagesPerMonth: Infinity,
      knowledgeFiles: Infinity,
      analytics: true,
      whatsapp: true,
      support: "dedicated",
    },
    features: [
      "Bots ilimitados",
      "Mensajes ilimitados",
      "Knowledge Base ilimitado",
      "WhatsApp Business real",
      "Analytics completos",
      "Soporte dedicado 24/7",
      "Onboarding personalizado",
      "SLA garantizado",
    ],
  },
];

export function getPlanById(id) {
  return PLANS.find(p => p.id === id) || PLANS[0];
}

export function getPlanByPriceId(priceId) {
  return PLANS.find(p => p.priceId === priceId) || null;
}

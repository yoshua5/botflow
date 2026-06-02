import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Botflow – Agentes de WhatsApp con IA",
  description: "Crea tu agente de WhatsApp personalizado con IA en menos de 5 minutos.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

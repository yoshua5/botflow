import { getConfig } from "@/lib/storage";

// Serve the custom favicon from config
export async function GET() {
  try {
    const config = await getConfig();
    if (config.faviconBase64 && config.faviconMimeType) {
      const buffer = Buffer.from(config.faviconBase64, "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": config.faviconMimeType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch {}

  // Default: a simple blue bot emoji SVG favicon
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#2563EB"/>
    <text x="16" y="23" font-size="18" text-anchor="middle">🤖</text>
  </svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}

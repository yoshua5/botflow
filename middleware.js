import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // This function runs for authenticated requests only
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow all public routes
        const publicPaths = [
          "/",
          "/sign-in",
          "/sign-up",
          "/booking",
          "/onboarding",
          "/conectar",
          "/api/auth",
          "/api/webhook",
          "/api/stripe/webhook",
          "/api/booking-config",
          "/api/booking-slots",
          "/api/appointments",
          "/api/favicon",
          "/api/chat",
        ];

        const isPublic = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));
        if (isPublic) return true;

        // Require token for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)",
  ],
};

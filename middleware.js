import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/booking(.*)",
  "/onboarding(.*)",
  "/conectar(.*)",
  "/api/webhook(.*)",
  "/api/stripe/webhook(.*)",
  "/api/booking-config(.*)",
  "/api/booking-slots(.*)",
  "/api/appointments(.*)",
  "/api/favicon(.*)",
  "/api/chat(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)",
  ],
};

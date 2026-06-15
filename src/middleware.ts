import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/pagamento",
  "/recuperar-senha",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth",
  "/api/cron",
  "/api/webhooks",
  "/api/admin/reseed-matches",
  "/api/admin/register-efi-webhook",
  "/api/admin/push-test",
  "/api/admin/broadcast-poll",
  "/api/admin/broadcast-pending",
  "/api/admin/wc26-preview",
  "/api/admin/digest-test",
  "/api/health",
  "/api/stats",
];

const ADMIN_PATHS = ["/admin"];

export default auth(async (req: NextRequest & { auth: { user?: { id: string; role?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  // Not authenticated
  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = req.auth.user;

  // Admin routes
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.png$).*)"],
};

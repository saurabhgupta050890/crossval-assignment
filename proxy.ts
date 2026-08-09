import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/"];

/**
 * API routes under /api/auth/* are intentionally public (signin, signup,
 * signout, me). Every other /api/* route requires a valid session and will
 * receive a 401 JSON response if the cookie is missing or invalid.
 */
const PUBLIC_API_PREFIXES = ["/api/auth/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read and verify session cookie once for the entire middleware chain.
  const sessionToken = request.cookies.get("session")?.value;
  const session = await decrypt(sessionToken);
  const isAuthenticated = !!session;

  // ── API route guard ──────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (!isPublicApi && !isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authenticated (or public) API request — proceed to the route handler.
    return NextResponse.next();
  }

  // ── Page route guard ─────────────────────────────────────────────────────
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Redirect unauthenticated users away from protected page routes.
  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect authenticated users away from the auth page to the dashboard.
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};

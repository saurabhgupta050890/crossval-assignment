import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Read session cookie
  const sessionToken = request.cookies.get("session")?.value;
  const session = await decrypt(sessionToken);
  const isAuthenticated = !!session;

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect authenticated users away from auth page to dashboard
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

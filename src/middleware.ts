import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/api/auth/login", "/api/auth/me", "/api/seed"];

// Protected API routes that require auth
const PROTECTED_API_PREFIXES = ["/api/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();

  // Allow static assets and API routes that don't need auth
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // For protected API routes, check session cookie
  if (pathname.startsWith("/api/")) {
    const sessionToken = req.cookies.get("aaa_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // For HTML pages, check session cookie and redirect to login if missing
  const sessionToken = req.cookies.get("aaa_session")?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

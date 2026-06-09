import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/invite",
  // PWA assets — must always be accessible, even when unauthenticated
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
];
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

// NextAuth uses __Secure- prefix whenever NEXTAUTH_URL starts with https://,
// regardless of NODE_ENV. Using ngrok (HTTPS in dev) requires the secure name.
const SESSION_COOKIE =
  process.env.NEXTAUTH_URL?.startsWith("https://") || !!process.env.VERCEL
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let NextAuth handle its own routes without interference
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Optimistic check — just verify the cookie exists, no JWT decode.
  // Full verification happens server-side in route handlers/server components.
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // Authenticated users on login/register pages → redirect to dashboard
  if (hasSession && AUTH_ONLY_PATHS.includes(pathname)) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/dashboard";
    return NextResponse.redirect(new URL(callbackUrl, req.url));
  }

  // Public paths — always allow
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Protected route without session → redirect to login
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-|manifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

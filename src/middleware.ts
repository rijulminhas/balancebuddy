import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Redirect authenticated users away from auth pages
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (token && ["/login", "/register", "/forgot-password"].includes(pathname)) {
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/dashboard";
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public paths — always allowed
        const publicPaths = [
          "/",
          "/login",
          "/register",
          "/forgot-password",
          "/verify-email",
          "/invite",
        ];

        if (publicPaths.some((p) => pathname.startsWith(p))) return true;

        // API auth routes are always public
        if (pathname.startsWith("/api/auth")) return true;

        // Everything else requires a valid session
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-|manifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

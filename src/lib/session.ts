import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

// NextAuth v4 encode/decode uses salt="" by default (verified from source).
// We replicate getToken's exact decode call to guarantee consistency.
// Also treat any Vercel deployment as secure (VERCEL env var is always set by Vercel).
const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") || !!process.env.VERCEL;
const SESSION_COOKIE = useSecureCookies
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await decode({ token, secret: process.env.NEXTAUTH_SECRET! });
    if (!decoded) return null;

    return {
      user: {
        id: ((decoded.id ?? decoded.sub) as string),
        name: decoded.name as string | null | undefined,
        email: decoded.email as string | null | undefined,
        image: decoded.picture as string | null | undefined,
        emailVerified: decoded.emailVerified as Date | null | undefined,
      },
      expires: new Date((decoded.exp as number) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

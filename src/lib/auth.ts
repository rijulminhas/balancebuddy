import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.password) return null;
        if (!user.isActive) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified;
      }
      // Refresh token fields when profile is updated via useSession().update()
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        // Only accept non-base64 values to keep JWT cookie size small.
        // The profile form sends a proxy URL (/api/users/[id]/avatar) for uploads.
        if (session.image === null) {
          token.picture = undefined;
        } else if (typeof session.image === "string" && !session.image.startsWith("data:")) {
          token.picture = session.image;
        }
      }
      // Sanitize on every refresh: replace any base64 that snuck into the JWT
      // (e.g. from a previous session) with the lightweight proxy URL.
      if (typeof token.picture === "string" && token.picture.startsWith("data:")) {
        token.picture = `/api/users/${token.id as string}/avatar`;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as Date | null;
        // Explicitly propagate token.picture so server-side getServerSession()
        // callers (e.g. the landing page) always receive the correct image URL.
        // NextAuth's automatic token.picture → session.user.image mapping is
        // unreliable when the session callback is overridden.
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
};

export default authOptions;

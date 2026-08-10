import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authEnabled = process.env.AUTH_ENABLED === "true";
export const demoUser = {
  id: "demo",
  name: "Maya Reyes",
  email: "demo@contentos.app",
};

const googleProvider =
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      })
    : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(googleProvider ? [googleProvider] : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // First Google sign-in creates the local user row so all data is
      // per-user. Subsequent sign-ins just resolve to the same row.
      if (account?.provider === "google") {
        const email = String(profile?.email ?? "").trim().toLowerCase();
        if (!email) return false;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email,
              name: (profile?.name as string) ?? null,
              image: (profile?.image as string) ?? null,
            },
          });
        }
      }
      return true;
    },
    jwt: async ({ token, user, account, profile }) => {
      if (user?.id && account?.provider === "credentials") token.sub = user.id;
      if (account?.provider === "google") {
        const email = String(profile?.email ?? "").trim().toLowerCase();
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) token.sub = dbUser.id;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      } else {
        session.user.id = demoUser.id;
      }
      return session;
    },
  },
});

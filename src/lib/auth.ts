import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "PARTICIPANT";
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl ?? null;
      }

      if (trigger === "update" && session) {
        token.name = session.name;
        token.avatarUrl = session.avatarUrl;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google OAuth: create payment record and score if first time
      if (account?.provider === "google" && user.id) {
        const existingPayment = await db.payment.findUnique({
          where: { userId: user.id },
        });
        if (!existingPayment) {
          await db.payment.create({
            data: { userId: user.id },
          });
        }
        const existingScore = await db.userScore.findUnique({
          where: { userId: user.id },
        });
        if (!existingScore) {
          await db.userScore.create({
            data: { userId: user.id },
          });
        }
      }
      return true;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatarUrl: string | null;
    };
  }
}

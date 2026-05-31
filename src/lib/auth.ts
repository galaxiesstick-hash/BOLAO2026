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
      allowDangerousEmailAccountLinking: true,
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
  events: {
    // Fires AFTER the adapter inserts the new user row — safe to create FK-dependent records
    async createUser({ user }) {
      if (!user.id) return;
      // Re-read role from DB — admin accounts must never get participant records
      const dbUser = await db.user.findUnique({ where: { id: user.id as string }, select: { role: true, phone: true } });
      if (dbUser?.role === "ADMIN") return;
      await Promise.all([
        db.payment.create({ data: { userId: user.id } }),
        db.userScore.create({ data: { userId: user.id } }),
      ]);
      // Notify admin (Google OAuth path — email/password path notifies in /api/auth/register).
      // Dynamic import avoids bundling nodemailer into the Edge-runtime middleware chunk.
      import("@/lib/email").then(({ sendNewRegistrationEmail }) =>
        sendNewRegistrationEmail({
          name: user.name ?? "Sem nome",
          email: user.email ?? "",
          phone: dbUser?.phone ?? null,
        })
      ).catch((err) => console.error("[auth/createUser] Admin notification email error:", err));
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        // Fetch DB row to get role + avatarUrl (adapter doesn't forward custom fields)
        const dbUser = await db.user.findUnique({ where: { id: user.id as string } });
        token.role = dbUser?.role ?? "PARTICIPANT";
        token.avatarUrl = dbUser?.avatarUrl ?? dbUser?.image ?? null;
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

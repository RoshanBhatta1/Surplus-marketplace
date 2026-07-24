import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AccountType, AdminRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      accountType: AccountType;
      adminRole: AdminRole;
      isEmailVerified: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    accountType?: AccountType;
    adminRole?: AdminRole;
    isEmailVerified?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;
        if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          accountType: user.accountType,
          adminRole: user.adminRole,
          isEmailVerified: user.emailVerifiedAt !== null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.accountType = (user as { accountType: AccountType }).accountType;
        token.adminRole = (user as { adminRole: AdminRole }).adminRole;
        token.isEmailVerified = (user as { isEmailVerified: boolean }).isEmailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
        session.user.accountType = token.accountType!;
        session.user.adminRole = token.adminRole!;
        session.user.isEmailVerified = token.isEmailVerified!;
      }
      return session;
    },
  },
});

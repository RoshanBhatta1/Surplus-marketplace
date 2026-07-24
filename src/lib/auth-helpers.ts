import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireVerifiedUser() {
  const session = await requireUser();
  if (!session.user.isEmailVerified) redirect("/verify-email/pending");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.adminRole !== "ADMIN") redirect("/");
  return session;
}

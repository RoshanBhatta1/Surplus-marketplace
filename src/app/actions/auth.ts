"use server";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { requireUser } from "@/lib/auth-helpers";
import {
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

type ActionResult = { ok: true } | { ok: false; error: string };

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const PHONE_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_PHONE_ATTEMPTS = 5;

export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      accountType: data.accountType,
      businessName: data.accountType === "BUSINESS" ? data.businessName || null : null,
      businessNumber: data.accountType === "BUSINESS" ? data.businessNumber || null : null,
    },
  });

  const token = nanoid(48);
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS) },
  });
  await sendVerificationEmail(user.email, token);

  return { ok: true };
}

export async function verifyEmail(token: string): Promise<ActionResult> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "This verification link is invalid or has expired." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return { ok: true };
}

export async function resendVerificationEmail(): Promise<ActionResult> {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "User not found" };
  if (user.emailVerifiedAt) return { ok: true };

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const token = nanoid(48);
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS) },
  });
  await sendVerificationEmail(user.email, token);
  return { ok: true };
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always return ok so we don't leak which emails have accounts.
  if (!user) return { ok: true };

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const token = nanoid(48);
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  await sendPasswordResetEmail(user.email, token);
  return { ok: true };
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const record = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return { ok: true };
}

export async function sendPhoneVerificationCode(phone: string): Promise<ActionResult> {
  const session = await requireUser();
  const trimmed = phone.trim();
  if (trimmed.length < 7) return { ok: false, error: "Enter a valid phone number" };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.$transaction([
    prisma.phoneVerificationCode.deleteMany({ where: { userId: session.user.id } }),
    prisma.phoneVerificationCode.create({
      data: { userId: session.user.id, code, expiresAt: new Date(Date.now() + PHONE_CODE_TTL_MS) },
    }),
    prisma.user.update({ where: { id: session.user.id }, data: { phone: trimmed, phoneVerifiedAt: null } }),
  ]);

  await sendSms(trimmed, `Your Surplus Flooring Marketplace verification code is ${code}`);
  return { ok: true };
}

export async function confirmPhoneVerificationCode(code: string): Promise<ActionResult> {
  const session = await requireUser();
  const record = await prisma.phoneVerificationCode.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "Code expired — request a new one." };
  }
  if (record.attempts >= MAX_PHONE_ATTEMPTS) {
    return { ok: false, error: "Too many attempts — request a new code." };
  }
  if (record.code !== code.trim()) {
    await prisma.phoneVerificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { phoneVerifiedAt: new Date() } }),
    prisma.phoneVerificationCode.deleteMany({ where: { userId: session.user.id } }),
  ]);
  return { ok: true };
}

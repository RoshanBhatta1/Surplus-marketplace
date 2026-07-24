"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  region: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      postalCode: parsed.data.postalCode || null,
    },
  });

  revalidatePath("/account");
  return { ok: true };
}

const businessVerificationSchema = z.object({
  businessName: z.string().trim().min(2).max(200),
  businessNumber: z.string().trim().min(3).max(50),
  insuranceDocumentUrl: z.url(),
});

/**
 * Uploading a document is the whole verification step for v1 — this is a
 * trust badge, not a permission gate, so there's no manual review queue.
 */
export async function submitBusinessVerification(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = businessVerificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      accountType: "BUSINESS",
      businessName: parsed.data.businessName,
      businessNumber: parsed.data.businessNumber,
      insuranceDocumentUrl: parsed.data.insuranceDocumentUrl,
      businessVerifiedAt: new Date(),
    },
  });

  revalidatePath("/account");
  return { ok: true };
}

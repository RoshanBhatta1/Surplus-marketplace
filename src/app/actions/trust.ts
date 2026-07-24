"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type ActionResult = { ok: true } | { ok: false; error: string };

const reportSchema = z.object({
  targetType: z.enum(["LISTING", "USER"]),
  listingId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: z.string().trim().min(1).max(200),
  details: z.string().trim().max(2000).optional(),
});

export async function fileReport(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid report" };
  const data = parsed.data;

  await prisma.report.create({
    data: {
      targetType: data.targetType,
      listingId: data.targetType === "LISTING" ? data.listingId : null,
      reportedUserId: data.targetType === "USER" ? data.reportedUserId : null,
      reportedById: session.user.id,
      reason: data.reason,
      details: data.details || null,
    },
  });

  return { ok: true };
}

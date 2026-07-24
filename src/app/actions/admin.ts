"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { releaseTransactionFunds, refundTransactionToBuyer } from "@/lib/transactions";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function adminRemoveListing(listingId: string, note?: string): Promise<ActionResult> {
  const session = await requireAdmin();
  await prisma.$transaction([
    prisma.listing.update({ where: { id: listingId }, data: { status: "REMOVED" } }),
    prisma.adminAction.create({
      data: { actorId: session.user.id, type: "LISTING_REMOVED", targetId: listingId, note },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
  return { ok: true };
}

export async function adminRestoreListing(listingId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  await prisma.$transaction([
    prisma.listing.update({ where: { id: listingId }, data: { status: "ACTIVE" } }),
    prisma.adminAction.create({
      data: { actorId: session.user.id, type: "LISTING_RESTORED", targetId: listingId },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
  return { ok: true };
}

const resolveReportSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["RESOLVED", "DISMISSED"]),
  note: z.string().trim().max(2000).optional(),
});

export async function resolveReport(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = resolveReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  await prisma.$transaction([
    prisma.report.update({
      where: { id: parsed.data.reportId },
      data: {
        status: parsed.data.action,
        resolvedAt: new Date(),
        resolutionNote: parsed.data.note || null,
      },
    }),
    prisma.adminAction.create({
      data: {
        actorId: session.user.id,
        type: "REPORT_RESOLVED",
        targetId: parsed.data.reportId,
        note: parsed.data.note,
      },
    }),
  ]);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function suspendUser(userId: string, note?: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (userId === session.user.id) return { ok: false, error: "You can't suspend yourself" };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } }),
    prisma.adminAction.create({
      data: { actorId: session.user.id, type: "USER_SUSPENDED", targetId: userId, note },
    }),
  ]);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function reinstateUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } }),
    prisma.adminAction.create({
      data: { actorId: session.user.id, type: "USER_REINSTATED", targetId: userId },
    }),
  ]);
  revalidatePath("/admin/users");
  return { ok: true };
}

async function resolveDispute(
  disputeId: string,
  status: "RESOLVED_RELEASE_TO_SELLER" | "RESOLVED_REFUND_TO_BUYER",
  note: string | undefined,
  adminId: string
) {
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status, resolvedAt: new Date(), resolutionNote: note || null, resolvedById: adminId },
  });
  await prisma.adminAction.create({
    data: { actorId: adminId, type: "DISPUTE_RESOLVED", targetId: disputeId, note },
  });
}

export async function resolveDisputeReleaseToSeller(
  disputeId: string,
  note?: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute || dispute.status !== "OPEN") return { ok: false, error: "Dispute not open" };

  const result = await releaseTransactionFunds(dispute.transactionId, { confirmedByBuyer: false });
  if (!result.ok) return result;

  await resolveDispute(disputeId, "RESOLVED_RELEASE_TO_SELLER", note, session.user.id);
  revalidatePath("/admin/disputes");
  return { ok: true };
}

export async function resolveDisputeRefundToBuyer(
  disputeId: string,
  note?: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute || dispute.status !== "OPEN") return { ok: false, error: "Dispute not open" };

  const result = await refundTransactionToBuyer(dispute.transactionId);
  if (!result.ok) return result;

  await resolveDispute(disputeId, "RESOLVED_REFUND_TO_BUYER", note, session.user.id);
  revalidatePath("/admin/disputes");
  return { ok: true };
}

const configSchema = z.object({
  commissionPercent: z.coerce.number().min(0).max(50),
  fundReleaseWindowDays: z.coerce.number().int().min(1).max(30),
});

export async function updatePlatformConfig(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  await prisma.$transaction([
    prisma.platformConfig.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data,
    }),
    prisma.adminAction.create({
      data: {
        actorId: session.user.id,
        type: "CONFIG_CHANGED",
        note: `commission=${parsed.data.commissionPercent}%, releaseWindow=${parsed.data.fundReleaseWindowDays}d`,
      },
    }),
  ]);
  revalidatePath("/admin/config");
  return { ok: true };
}

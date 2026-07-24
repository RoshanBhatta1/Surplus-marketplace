"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { releaseTransactionFunds } from "@/lib/transactions";
import { sendTransactionEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function confirmReceipt(transactionId: string): Promise<ActionResult> {
  const session = await requireUser();

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction || transaction.buyerId !== session.user.id) {
    return { ok: false, error: "Order not found" };
  }

  const result = await releaseTransactionFunds(transactionId, { confirmedByBuyer: true });
  if (!result.ok) return result;

  revalidatePath(`/account/orders/${transactionId}`);
  revalidatePath("/account/orders");
  return { ok: true };
}

const disputeSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().trim().min(1).max(200),
  details: z.string().trim().min(1).max(3000),
});

export async function fileDispute(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please describe the issue" };

  const transaction = await prisma.transaction.findUnique({
    where: { id: parsed.data.transactionId },
    include: { listing: true, seller: true },
  });
  if (!transaction || transaction.buyerId !== session.user.id) {
    return { ok: false, error: "Order not found" };
  }
  if (transaction.status !== "FUNDS_HELD") {
    return { ok: false, error: "This order can't be disputed right now" };
  }

  await prisma.$transaction([
    prisma.dispute.create({
      data: {
        transactionId: transaction.id,
        filedById: session.user.id,
        reason: parsed.data.reason,
        details: parsed.data.details,
      },
    }),
    prisma.transaction.update({ where: { id: transaction.id }, data: { status: "DISPUTED" } }),
    prisma.transactionStatusEvent.create({
      data: { transactionId: transaction.id, fromStatus: "FUNDS_HELD", toStatus: "DISPUTED" },
    }),
  ]);

  await sendTransactionEmail(
    transaction.seller.email,
    "A buyer flagged an issue with an order",
    `Order for "${transaction.listing.title}" has been disputed and is paused pending review.`
  );

  revalidatePath(`/account/orders/${transaction.id}`);
  return { ok: true };
}

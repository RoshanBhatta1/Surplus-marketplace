"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { submitReviewSchema } from "@/lib/validation/review";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitReview(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid review" };

  const transaction = await prisma.transaction.findUnique({ where: { id: parsed.data.transactionId } });
  if (!transaction || transaction.buyerId !== session.user.id) {
    return { ok: false, error: "Order not found" };
  }
  if (transaction.status !== "RELEASED") {
    return { ok: false, error: "You can review this order once it's complete" };
  }

  const existing = await prisma.review.findUnique({ where: { transactionId: transaction.id } });
  if (existing) return { ok: false, error: "You already reviewed this order" };

  await prisma.review.create({
    data: {
      transactionId: transaction.id,
      authorId: session.user.id,
      subjectId: transaction.sellerId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  revalidatePath(`/account/orders/${transaction.id}`);
  return { ok: true };
}

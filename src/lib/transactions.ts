import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { sendTransactionEmail } from "@/lib/email";

type ReleaseResult = { ok: true } | { ok: false; error: string };

/**
 * Pays out a held transaction to the seller's connected account. Shared by
 * the buyer's "confirm receipt" action and the auto-release cron job — both
 * are just different triggers for the same FUNDS_HELD -> RELEASED move.
 */
export async function releaseTransactionFunds(
  transactionId: string,
  opts: { confirmedByBuyer: boolean }
): Promise<ReleaseResult> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { listing: true, buyer: true, seller: true },
  });
  if (!transaction) return { ok: false, error: "Order not found" };
  if (transaction.status !== "FUNDS_HELD" && transaction.status !== "DISPUTED") {
    return { ok: false, error: "This order isn't awaiting release" };
  }
  if (!isStripeConfigured()) return { ok: false, error: "Payments are not configured" };
  if (!transaction.seller.stripeConnectAccountId) {
    return { ok: false, error: "Seller has no payout account on file" };
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(transaction.sellerPayoutAmount) * 100),
      currency: transaction.currency.toLowerCase(),
      destination: transaction.seller.stripeConnectAccountId,
      transfer_group: transaction.id,
      metadata: { transactionId: transaction.id },
    });

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          stripeTransferId: transfer.id,
          buyerConfirmedAt: opts.confirmedByBuyer ? new Date() : transaction.buyerConfirmedAt,
        },
      }),
      prisma.transactionStatusEvent.create({
        data: {
          transactionId: transaction.id,
          fromStatus: transaction.status,
          toStatus: "RELEASED",
          note: opts.confirmedByBuyer ? "Buyer confirmed receipt" : "Auto-released after hold window",
        },
      }),
    ]);

    await sendTransactionEmail(
      transaction.seller.email,
      "You've been paid",
      `Your payout of ${transaction.currency} ${transaction.sellerPayoutAmount} for "${transaction.listing.title}" has been sent.`
    );

    return { ok: true };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : "Payout failed";
    return { ok: false, error: message };
  }
}

/**
 * Full refund to the buyer, used for admin dispute resolution. The seller
 * receives nothing; commission is not collected since the sale didn't stand.
 */
export async function refundTransactionToBuyer(transactionId: string): Promise<ReleaseResult> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { listing: true, buyer: true, seller: true },
  });
  if (!transaction) return { ok: false, error: "Order not found" };
  if (transaction.status !== "FUNDS_HELD" && transaction.status !== "DISPUTED") {
    return { ok: false, error: "This order can't be refunded right now" };
  }
  if (!isStripeConfigured()) return { ok: false, error: "Payments are not configured" };
  if (!transaction.stripePaymentIntentId) return { ok: false, error: "No payment on file to refund" };

  try {
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripePaymentIntentId,
    });

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "REFUNDED", refundedAt: new Date(), stripeRefundId: refund.id },
      }),
      prisma.transactionStatusEvent.create({
        data: {
          transactionId: transaction.id,
          fromStatus: transaction.status,
          toStatus: "REFUNDED",
          note: "Refunded by admin",
        },
      }),
      prisma.listing.update({ where: { id: transaction.listingId }, data: { status: "ACTIVE", soldAt: null } }),
    ]);

    await sendTransactionEmail(
      transaction.buyer.email,
      "You've been refunded",
      `Your payment of ${transaction.currency} ${transaction.totalAmount} for "${transaction.listing.title}" has been refunded.`
    );

    return { ok: true };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : "Refund failed";
    return { ok: false, error: message };
  }
}

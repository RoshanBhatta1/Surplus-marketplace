import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlatformConfig } from "@/lib/config";
import { sendTransactionEmail } from "@/lib/email";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const transactionId = checkoutSession.metadata?.transactionId;
      if (!transactionId) break;

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { listing: true, buyer: true, seller: true },
      });
      if (!transaction || transaction.status !== "PENDING_PAYMENT") break;

      const config = await getPlatformConfig();
      const fundsReleaseDueAt = new Date(
        Date.now() + config.fundReleaseWindowDays * 24 * 60 * 60 * 1000
      );
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id;

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FUNDS_HELD",
            paidAt: new Date(),
            fundsReleaseDueAt,
            stripePaymentIntentId: paymentIntentId ?? transaction.stripePaymentIntentId,
          },
        }),
        prisma.transactionStatusEvent.create({
          data: { transactionId: transaction.id, fromStatus: "PENDING_PAYMENT", toStatus: "FUNDS_HELD" },
        }),
        prisma.listing.update({
          where: { id: transaction.listingId },
          data: { status: "SOLD", soldAt: new Date() },
        }),
      ]);

      await Promise.all([
        sendTransactionEmail(
          transaction.buyer.email,
          "Order confirmed",
          `Your order for "${transaction.listing.title}" is confirmed. Funds are held until you confirm receipt.`
        ),
        sendTransactionEmail(
          transaction.seller.email,
          "You made a sale",
          `"${transaction.listing.title}" sold. Funds are held until the buyer confirms receipt or the hold window ends.`
        ),
      ]);
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await prisma.user.updateMany({
        where: { stripeConnectAccountId: account.id },
        data: {
          stripeConnectOnboarded: Boolean(account.details_submitted),
          stripeConnectPayoutsEnabled: Boolean(account.payouts_enabled),
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

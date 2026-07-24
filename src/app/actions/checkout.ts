"use server";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth-helpers";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getPlatformConfig } from "@/lib/config";
import { computeTransactionPricing } from "@/lib/pricing";
import { startCheckoutSchema } from "@/lib/validation/checkout";

type ActionResult = { ok: true; url: string } | { ok: false; error: string };

export async function createCheckoutSession(input: unknown): Promise<ActionResult> {
  const session = await requireVerifiedUser();

  const parsed = startCheckoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid checkout request" };
  const { listingId, fulfillmentMethod, offerId } = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });
  if (!listing || listing.status !== "ACTIVE") return { ok: false, error: "Listing not available" };
  if (listing.sellerId === session.user.id) return { ok: false, error: "You can't buy your own listing" };

  const allowed =
    listing.fulfillmentOption === "BOTH" ? true : listing.fulfillmentOption === fulfillmentMethod;
  if (!allowed) return { ok: false, error: "That fulfillment method isn't offered on this listing" };

  if (!isStripeConfigured()) {
    return { ok: false, error: "Payments are not configured on this deployment yet." };
  }

  if (!listing.seller.stripeConnectPayoutsEnabled) {
    return { ok: false, error: "This seller hasn't finished payout setup yet — check back soon." };
  }

  let itemSubtotal: number;
  let acceptedOfferId: string | undefined;

  if (offerId) {
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.buyerId !== session.user.id || offer.listingId !== listingId) {
      return { ok: false, error: "Offer not found" };
    }
    if (offer.status !== "ACCEPTED") return { ok: false, error: "This offer hasn't been accepted yet" };
    itemSubtotal = Number(offer.amount);
    acceptedOfferId = offer.id;
  } else {
    itemSubtotal = Number(listing.totalPrice);
  }

  const shippingFee = fulfillmentMethod === "SELLER_SHIPPING" ? Number(listing.flatShippingFee ?? 0) : 0;
  const config = await getPlatformConfig();
  const commissionPercent = Number(config.commissionPercent);
  const { totalAmount, commissionAmount, sellerPayoutAmount } = computeTransactionPricing({
    itemSubtotal,
    shippingFee,
    commissionPercent,
  });

  // Reuse an existing unpaid attempt for this offer/listing instead of piling up rows.
  const existing = await prisma.transaction.findFirst({
    where: acceptedOfferId
      ? { offerId: acceptedOfferId, status: "PENDING_PAYMENT" }
      : { listingId, buyerId: session.user.id, status: "PENDING_PAYMENT", offerId: null },
  });

  const transaction = existing
    ? await prisma.transaction.update({
        where: { id: existing.id },
        data: {
          quantity: listing.quantity,
          itemSubtotal,
          shippingFee,
          totalAmount,
          commissionPercent,
          commissionAmount,
          sellerPayoutAmount,
          fulfillmentMethod,
        },
      })
    : await prisma.transaction.create({
        data: {
          listingId,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          offerId: acceptedOfferId,
          quantity: listing.quantity,
          itemSubtotal,
          shippingFee,
          totalAmount,
          commissionPercent,
          commissionAmount,
          sellerPayoutAmount,
          fulfillmentMethod,
          status: "PENDING_PAYMENT",
        },
      });

  const baseUrl = process.env.APP_BASE_URL;
  const lineItems = [
    {
      price_data: {
        currency: "cad",
        product_data: { name: listing.title },
        unit_amount: Math.round(itemSubtotal * 100),
      },
      quantity: 1,
    },
    ...(shippingFee > 0
      ? [
          {
            price_data: {
              currency: "cad",
              product_data: { name: "Shipping" },
              unit_amount: Math.round(shippingFee * 100),
            },
            quantity: 1,
          },
        ]
      : []),
  ];

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: session.user.email,
      metadata: { transactionId: transaction.id },
      payment_intent_data: { metadata: { transactionId: transaction.id } },
      success_url: `${baseUrl}/account/orders/${transaction.id}?success=1`,
      cancel_url: `${baseUrl}/listings/${listingId}`,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { stripePaymentIntentId: checkoutSession.payment_intent as string | null },
    });

    if (!checkoutSession.url) return { ok: false, error: "Could not start checkout" };
    return { ok: true, url: checkoutSession.url };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : "Could not start checkout";
    return { ok: false, error: message };
  }
}

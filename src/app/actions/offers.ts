"use server";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth-helpers";
import { createOfferSchema, respondOfferSchema } from "@/lib/validation/offer";
import { sendTransactionEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createOffer(input: unknown): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  const parsed = createOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid offer" };

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    include: { seller: true },
  });
  if (!listing || listing.status !== "ACTIVE") return { ok: false, error: "Listing not available" };
  if (listing.listingType !== "BEST_OFFER") return { ok: false, error: "This listing doesn't accept offers" };
  if (listing.sellerId === session.user.id) return { ok: false, error: "You can't make an offer on your own listing" };

  const existingOpen = await prisma.offer.findFirst({
    where: {
      listingId: listing.id,
      buyerId: session.user.id,
      status: { in: ["PENDING", "COUNTERED"] },
    },
  });
  if (existingOpen) return { ok: false, error: "You already have an open offer on this listing" };

  await prisma.offer.create({
    data: {
      listingId: listing.id,
      buyerId: session.user.id,
      amount: parsed.data.amount,
      quantity: listing.quantity,
      status: "PENDING",
      proposedBy: "BUYER",
    },
  });

  await sendTransactionEmail(
    listing.seller.email,
    "New offer on your listing",
    `You received a new offer on "${listing.title}".`
  );

  revalidatePath(`/listings/${listing.id}`);
  revalidatePath("/account/offers");
  return { ok: true };
}

export async function respondToOffer(input: unknown): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  const parsed = respondOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { offerId, action, counterAmount } = parsed.data;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  });
  if (!offer) return { ok: false, error: "Offer not found" };
  if (offer.status !== "PENDING") return { ok: false, error: "This offer is no longer open" };

  const isSellerTurn = offer.proposedBy === "BUYER";
  const isBuyerTurn = offer.proposedBy === "SELLER";
  const actingAsSeller = offer.listing.sellerId === session.user.id;
  const actingAsBuyer = offer.buyerId === session.user.id;

  if (isSellerTurn && !actingAsSeller) return { ok: false, error: "Waiting on the seller to respond" };
  if (isBuyerTurn && !actingAsBuyer) return { ok: false, error: "Waiting on the buyer to respond" };
  if (!actingAsSeller && !actingAsBuyer) return { ok: false, error: "Not authorized" };

  if (action === "ACCEPT") {
    await prisma.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
  } else if (action === "DECLINE") {
    await prisma.offer.update({ where: { id: offer.id }, data: { status: "DECLINED" } });
  } else {
    if (typeof counterAmount !== "number") return { ok: false, error: "Enter a counter amount" };
    await prisma.$transaction([
      prisma.offer.update({ where: { id: offer.id }, data: { status: "COUNTERED" } }),
      prisma.offer.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          amount: counterAmount,
          quantity: offer.quantity,
          status: "PENDING",
          proposedBy: actingAsSeller ? "SELLER" : "BUYER",
          respondsToId: offer.id,
        },
      }),
    ]);
  }

  revalidatePath(`/listings/${offer.listingId}`);
  revalidatePath("/account/offers");
  return { ok: true };
}

export async function withdrawOffer(offerId: string): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.buyerId !== session.user.id) return { ok: false, error: "Offer not found" };
  if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
    return { ok: false, error: "This offer can't be withdrawn" };
  }
  await prisma.offer.update({ where: { id: offerId }, data: { status: "WITHDRAWN" } });
  revalidatePath("/account/offers");
  return { ok: true };
}

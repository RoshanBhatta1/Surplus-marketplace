import Link from "next/link";
import type { Listing } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { OfferPanel } from "@/components/checkout/offer-panel";

export async function BuyBox({
  listing,
  isLoggedIn,
  currentUserId,
}: {
  listing: Listing;
  isLoggedIn: boolean;
  currentUserId?: string;
}) {
  if (listing.status === "SOLD") {
    return <p className="text-sm text-slate-500">This listing has sold.</p>;
  }
  if (!isLoggedIn || !currentUserId) {
    return (
      <Link href={`/login?callbackUrl=/listings/${listing.id}`} className="btn-primary block text-center">
        Log in to buy
      </Link>
    );
  }

  const myOffer =
    listing.listingType === "BEST_OFFER"
      ? await prisma.offer.findFirst({
          where: { listingId: listing.id, buyerId: currentUserId },
          orderBy: { createdAt: "desc" },
        })
      : null;

  return (
    <div className="flex flex-col gap-3">
      <Link href={`/listings/${listing.id}/checkout`} className="btn-primary block text-center">
        Buy now — {formatCurrency(listing.totalPrice)}
      </Link>

      {listing.listingType === "BEST_OFFER" && (
        <OfferPanel
          listingId={listing.id}
          myOffer={
            myOffer && {
              id: myOffer.id,
              amount: Number(myOffer.amount),
              status: myOffer.status,
              proposedBy: myOffer.proposedBy,
            }
          }
        />
      )}
    </div>
  );
}

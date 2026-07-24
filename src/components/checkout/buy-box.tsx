import Link from "next/link";
import type { Listing } from "@prisma/client";

// Full checkout flow (Buy Now / offers / Stripe) is wired up in the
// checkout & payments milestone. This placeholder keeps the listing page
// functional in the meantime.
export function BuyBox({ listing, isLoggedIn }: { listing: Listing; isLoggedIn: boolean }) {
  if (listing.status === "SOLD") {
    return <p className="text-sm text-slate-500">This listing has sold.</p>;
  }
  if (!isLoggedIn) {
    return (
      <Link href={`/login?callbackUrl=/listings/${listing.id}`} className="btn-primary block text-center">
        Log in to buy
      </Link>
    );
  }
  return (
    <Link href={`/listings/${listing.id}/checkout`} className="btn-primary block text-center">
      {listing.listingType === "BEST_OFFER" ? "Buy now or make an offer" : "Buy now"}
    </Link>
  );
}

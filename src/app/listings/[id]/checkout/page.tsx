import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { formatCurrency } from "@/lib/format";

export default async function ListingCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireVerifiedUser();

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.status !== "ACTIVE") notFound();
  if (listing.sellerId === session.user.id) notFound();

  const acceptedOffer = await prisma.offer.findFirst({
    where: { listingId: id, buyerId: session.user.id, status: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
  });

  const itemSubtotal = acceptedOffer ? Number(acceptedOffer.amount) : Number(listing.totalPrice);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-slate-600">{listing.title}</p>
      {acceptedOffer && (
        <p className="mt-1 text-xs text-emerald-700">
          Paying your accepted offer price of {formatCurrency(itemSubtotal)}.
        </p>
      )}
      <div className="mt-6">
        <CheckoutForm
          listingId={listing.id}
          offerId={acceptedOffer?.id}
          itemSubtotal={itemSubtotal}
          fulfillmentOption={listing.fulfillmentOption}
          flatShippingFee={listing.flatShippingFee ? Number(listing.flatShippingFee) : null}
        />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/listings/listing-form";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireVerifiedUser();

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });

  if (!listing || listing.sellerId !== session.user.id) notFound();

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Edit listing</h1>
      </div>
      <div className="mt-6">
        <ListingForm
          mode="edit"
          listingId={listing.id}
          defaultValues={{
            title: listing.title,
            manufacturer: listing.manufacturer,
            productLine: listing.productLine,
            colorName: listing.colorName,
            colorNumber: listing.colorNumber,
            dyeLotNumber: listing.dyeLotNumber ?? "",
            materialType: listing.materialType,
            condition: listing.condition,
            unitOfMeasure: listing.unitOfMeasure,
            quantity: Number(listing.quantity),
            pricePerUnit: Number(listing.pricePerUnit),
            currency: "CAD",
            listingType: listing.listingType,
            minOfferPrice: listing.minOfferPrice ? Number(listing.minOfferPrice) : undefined,
            fulfillmentOption: listing.fulfillmentOption,
            flatShippingFee: listing.flatShippingFee ? Number(listing.flatShippingFee) : undefined,
            city: listing.city,
            region: listing.region,
            postalCode: listing.postalCode,
            description: listing.description ?? "",
            images: listing.images.map((img) => ({ url: img.url, kind: img.kind })),
          }}
        />
      </div>
    </div>
  );
}

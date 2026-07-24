import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/listing-card";

export default async function ListingsPage() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { images: { where: { kind: "PHOTO" }, orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Browse listings</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={{
              ...listing,
              pricePerUnit: Number(listing.pricePerUnit),
              coverImageUrl: listing.images[0]?.url ?? null,
            }}
          />
        ))}
        {listings.length === 0 && <p className="text-sm text-slate-500">No listings yet.</p>}
      </div>
    </div>
  );
}

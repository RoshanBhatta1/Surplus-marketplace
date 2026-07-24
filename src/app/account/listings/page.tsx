import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

export default async function MyListingsPage() {
  const session = await requireUser();
  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My listings</h1>
        <Link href="/sell/new" className="btn-primary">
          New listing
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="card flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{listing.title}</p>
              <p className="text-xs text-slate-500">
                {formatCurrency(listing.pricePerUnit)} / unit · {listing.status}
              </p>
            </div>
          </Link>
        ))}
        {listings.length === 0 && (
          <p className="text-sm text-slate-500">You haven&apos;t listed anything yet.</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { adminRemoveListing, adminRestoreListing } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/admin-action-buttons";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { seller: { select: { name: true, email: true } } },
  });

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Listings</h2>
      {listings.map((listing) => (
        <div key={listing.id} className="card flex items-center justify-between">
          <div>
            <Link href={`/listings/${listing.id}`} className="text-sm font-medium text-slate-900 underline">
              {listing.title}
            </Link>
            <p className="text-xs text-slate-500">
              {listing.seller.name} ({listing.seller.email}) · {formatCurrency(listing.totalPrice)} ·{" "}
              {listing.status}
            </p>
          </div>
          {listing.status === "REMOVED" ? (
            <AdminActionButton label="Restore" onRun={adminRestoreListing.bind(null, listing.id)} />
          ) : (
            <AdminActionButton
              label="Remove"
              variant="danger"
              confirmText="Remove this listing from the marketplace?"
              onRun={adminRemoveListing.bind(null, listing.id)}
            />
          )}
        </div>
      ))}
      {listings.length === 0 && <p className="text-sm text-slate-500">No listings.</p>}
    </div>
  );
}

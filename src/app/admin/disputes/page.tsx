import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { resolveDisputeReleaseToSeller, resolveDisputeRefundToBuyer } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/admin-action-buttons";

export default async function AdminDisputesPage() {
  const disputes = await prisma.dispute.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      transaction: {
        include: {
          listing: { select: { id: true, title: true } },
          buyer: { select: { name: true, email: true } },
          seller: { select: { name: true, email: true } },
        },
      },
      filedBy: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Open disputes</h2>
      {disputes.map((dispute) => (
        <div key={dispute.id} className="card">
          <Link href={`/listings/${dispute.transaction.listing.id}`} className="text-sm font-medium text-slate-900 underline">
            {dispute.transaction.listing.title}
          </Link>
          <p className="mt-1 text-sm text-slate-700">{dispute.reason}</p>
          <p className="mt-1 text-sm text-slate-500">{dispute.details}</p>
          <p className="mt-1 text-xs text-slate-400">
            Filed by {dispute.filedBy.name} on {formatDate(dispute.createdAt)}
          </p>
          <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
            <p>Buyer: {dispute.transaction.buyer.name} ({dispute.transaction.buyer.email})</p>
            <p>Seller: {dispute.transaction.seller.name} ({dispute.transaction.seller.email})</p>
            <p>Total paid: {formatCurrency(dispute.transaction.totalAmount)}</p>
            <p>Seller payout if released: {formatCurrency(dispute.transaction.sellerPayoutAmount)}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <AdminActionButton
              label="Release to seller"
              variant="primary"
              confirmText="Release held funds to the seller? This resolves the dispute."
              onRun={resolveDisputeReleaseToSeller.bind(null, dispute.id)}
            />
            <AdminActionButton
              label="Refund buyer"
              variant="danger"
              confirmText="Refund the full payment to the buyer? This resolves the dispute."
              onRun={resolveDisputeRefundToBuyer.bind(null, dispute.id)}
            />
          </div>
        </div>
      ))}
      {disputes.length === 0 && <p className="text-sm text-slate-500">No open disputes.</p>}
    </div>
  );
}

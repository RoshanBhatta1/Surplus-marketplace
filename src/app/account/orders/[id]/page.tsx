import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmReceiptButton } from "@/components/checkout/confirm-receipt-button";
import { DisputeForm } from "@/components/checkout/dispute-form";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const session = await requireUser();

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { listing: true, buyer: true, seller: true },
  });

  if (!transaction || (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id)) {
    notFound();
  }

  const isBuyer = transaction.buyerId === session.user.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {success && transaction.status === "PENDING_PAYMENT" && (
        <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Payment is processing — this page will update once it's confirmed.
        </div>
      )}
      {success && transaction.status !== "PENDING_PAYMENT" && (
        <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Payment confirmed. Funds are held until receipt is confirmed.
        </div>
      )}

      <h1 className="text-xl font-semibold">
        <Link href={`/listings/${transaction.listingId}`} className="underline">
          {transaction.listing.title}
        </Link>
      </h1>

      <div className="card mt-4 flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Status</span>
          <span className="font-medium">{transaction.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Item subtotal</span>
          <span>{formatCurrency(transaction.itemSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Shipping</span>
          <span>{formatCurrency(transaction.shippingFee)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total {isBuyer ? "paid" : "buyer paid"}</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </div>
        {!isBuyer && (
          <div className="flex justify-between text-emerald-700">
            <span>Your payout (after commission)</span>
            <span>{formatCurrency(transaction.sellerPayoutAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-600">Fulfillment</span>
          <span>{transaction.fulfillmentMethod === "LOCAL_PICKUP" ? "Local pickup" : "Shipping"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Placed</span>
          <span>{formatDate(transaction.createdAt)}</span>
        </div>
        {transaction.fundsReleaseDueAt && (
          <div className="flex justify-between">
            <span className="text-slate-600">Auto-release by</span>
            <span>{formatDate(transaction.fundsReleaseDueAt)}</span>
          </div>
        )}
      </div>

      {isBuyer && transaction.status === "FUNDS_HELD" && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            Let the seller know you got the material, or flag an issue before the hold window ends.
          </p>
          <ConfirmReceiptButton transactionId={transaction.id} />
          <DisputeForm transactionId={transaction.id} />
        </div>
      )}

      {transaction.status === "DISPUTED" && (
        <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          This order is under review by an admin. Payment release is paused.
        </div>
      )}

      {transaction.status === "RELEASED" && (
        <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          {isBuyer
            ? "Payment has been released to the seller."
            : "You've been paid out for this order."}
        </div>
      )}
    </div>
  );
}

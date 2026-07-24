import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Payment pending",
  FUNDS_HELD: "Funds held",
  DISPUTED: "Disputed",
  RELEASED: "Completed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage() {
  const session = await requireUser();

  const [purchases, sales] = await Promise.all([
    prisma.transaction.findMany({
      where: { buyerId: session.user.id, status: { not: "PENDING_PAYMENT" } },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { sellerId: session.user.id, status: { not: "PENDING_PAYMENT" } },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <h2 className="mt-6 text-lg font-medium">Purchases</h2>
      <div className="mt-2 flex flex-col gap-2">
        {purchases.map((t) => (
          <Link key={t.id} href={`/account/orders/${t.id}`} className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{t.listing.title}</p>
              <p className="text-xs text-slate-500">
                {formatCurrency(t.totalAmount)} · {formatDate(t.createdAt)}
              </p>
            </div>
            <span className="badge bg-slate-100 text-slate-700">{statusLabels[t.status] ?? t.status}</span>
          </Link>
        ))}
        {purchases.length === 0 && <p className="text-sm text-slate-500">No purchases yet.</p>}
      </div>

      <h2 className="mt-8 text-lg font-medium">Sales</h2>
      <div className="mt-2 flex flex-col gap-2">
        {sales.map((t) => (
          <Link key={t.id} href={`/account/orders/${t.id}`} className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{t.listing.title}</p>
              <p className="text-xs text-slate-500">
                You&apos;ll receive {formatCurrency(t.sellerPayoutAmount)} · {formatDate(t.createdAt)}
              </p>
            </div>
            <span className="badge bg-slate-100 text-slate-700">{statusLabels[t.status] ?? t.status}</span>
          </Link>
        ))}
        {sales.length === 0 && <p className="text-sm text-slate-500">No sales yet.</p>}
      </div>
    </div>
  );
}

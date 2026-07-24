import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OfferThreadCard, type ThreadView } from "@/components/checkout/offer-thread-card";
import type { Offer } from "@prisma/client";

function toThreadView(
  thread: Offer & { listing: { title: string }; responses: Offer[]; buyer?: { name: string } }
): ThreadView {
  const latest = thread.responses.length > 0 ? thread.responses[thread.responses.length - 1] : thread;
  return {
    id: thread.id,
    listingId: thread.listingId,
    listingTitle: thread.listing.title,
    buyerName: thread.buyer?.name,
    latest: {
      id: latest.id,
      amount: Number(latest.amount),
      status: latest.status,
      proposedBy: latest.proposedBy,
    },
  };
}

export default async function OffersPage() {
  const session = await requireUser();

  const [sent, received] = await Promise.all([
    prisma.offer.findMany({
      where: { buyerId: session.user.id, respondsToId: null },
      include: {
        listing: { select: { title: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { listing: { sellerId: session.user.id }, respondsToId: null },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { name: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Offers</h1>

      <h2 className="mt-6 text-lg font-medium">Offers you made</h2>
      <div className="mt-2 flex flex-col gap-3">
        {sent.map((thread) => (
          <OfferThreadCard key={thread.id} thread={toThreadView(thread)} viewerRole="buyer" />
        ))}
        {sent.length === 0 && <p className="text-sm text-slate-500">You haven&apos;t made any offers.</p>}
      </div>

      <h2 className="mt-8 text-lg font-medium">Offers you received</h2>
      <div className="mt-2 flex flex-col gap-3">
        {received.map((thread) => (
          <OfferThreadCard key={thread.id} thread={toThreadView(thread)} viewerRole="seller" />
        ))}
        {received.length === 0 && <p className="text-sm text-slate-500">No offers on your listings yet.</p>}
      </div>
    </div>
  );
}

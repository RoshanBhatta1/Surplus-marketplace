"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfferStatus, OfferProposedBy } from "@prisma/client";
import { respondToOffer, withdrawOffer } from "@/app/actions/offers";
import { formatCurrency } from "@/lib/format";

export type ThreadView = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName?: string;
  latest: { id: string; amount: number; status: OfferStatus; proposedBy: OfferProposedBy };
};

export function OfferThreadCard({
  thread,
  viewerRole,
}: {
  thread: ThreadView;
  viewerRole: "buyer" | "seller";
}) {
  const router = useRouter();
  const [counterAmount, setCounterAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = thread.latest;

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong");
      return;
    }
    router.refresh();
  }

  const myTurn =
    latest.status === "PENDING" &&
    ((viewerRole === "seller" && latest.proposedBy === "BUYER") ||
      (viewerRole === "buyer" && latest.proposedBy === "SELLER"));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <Link href={`/listings/${thread.listingId}`} className="text-sm font-medium text-slate-900 underline">
          {thread.listingTitle}
        </Link>
        <span className="badge bg-slate-100 text-slate-700">{latest.status}</span>
      </div>
      {viewerRole === "seller" && thread.buyerName && (
        <p className="mt-1 text-xs text-slate-500">From {thread.buyerName}</p>
      )}
      <p className="mt-1 text-sm text-slate-700">Current amount: {formatCurrency(latest.amount)}</p>

      {latest.status === "ACCEPTED" && viewerRole === "buyer" && (
        <Link href={`/listings/${thread.listingId}/checkout`} className="btn-primary mt-2 inline-block">
          Complete checkout
        </Link>
      )}

      {myTurn && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => run(() => respondToOffer({ offerId: latest.id, action: "ACCEPT" }))}
            >
              Accept
            </button>
            <button
              className="text-sm text-slate-500 underline"
              disabled={busy}
              onClick={() => run(() => respondToOffer({ offerId: latest.id, action: "DECLINE" }))}
            >
              Decline
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              className="input flex-1"
              placeholder="Counter amount ($)"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
            />
            <button
              className="btn-secondary"
              disabled={busy || !counterAmount}
              onClick={() =>
                run(() =>
                  respondToOffer({
                    offerId: latest.id,
                    action: "COUNTER",
                    counterAmount: Number(counterAmount),
                  })
                )
              }
            >
              Counter
            </button>
          </div>
        </div>
      )}

      {viewerRole === "buyer" && latest.status === "PENDING" && latest.proposedBy === "BUYER" && (
        <button
          className="mt-2 text-sm text-slate-500 underline"
          disabled={busy}
          onClick={() => run(() => withdrawOffer(latest.id))}
        >
          Withdraw offer
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

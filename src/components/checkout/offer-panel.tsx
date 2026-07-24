"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfferStatus, OfferProposedBy } from "@prisma/client";
import { createOffer, respondToOffer, withdrawOffer } from "@/app/actions/offers";
import { formatCurrency } from "@/lib/format";

type MyOffer = {
  id: string;
  amount: number;
  status: OfferStatus;
  proposedBy: OfferProposedBy;
} | null;

export function OfferPanel({ listingId, myOffer }: { listingId: string; myOffer: MyOffer }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!myOffer || isClosed(myOffer.status)) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700">Make an offer</p>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            className="input flex-1"
            placeholder="Your offer ($)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            className="btn-secondary"
            disabled={busy || !amount}
            onClick={() => run(() => createOffer({ listingId, amount: Number(amount) }))}
          >
            Submit
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (myOffer.status === "ACCEPTED") {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <p className="text-emerald-800">Your offer of {formatCurrency(myOffer.amount)} was accepted.</p>
        <Link href={`/listings/${listingId}/checkout`} className="btn-primary mt-2 inline-block">
          Complete checkout
        </Link>
      </div>
    );
  }

  const waitingOnSeller = myOffer.status === "PENDING" && myOffer.proposedBy === "BUYER";

  if (waitingOnSeller) {
    return (
      <div className="rounded-md border border-slate-200 p-3 text-sm">
        <p>Your offer of {formatCurrency(myOffer.amount)} is pending seller response.</p>
        {error && <p className="mt-1 text-red-600">{error}</p>}
        <button
          className="mt-2 text-sm text-slate-500 underline"
          disabled={busy}
          onClick={() => run(() => withdrawOffer(myOffer.id))}
        >
          Withdraw offer
        </button>
      </div>
    );
  }

  // Seller countered — buyer's turn.
  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 text-sm">
      <p>Seller countered with {formatCurrency(myOffer.amount)}.</p>
      <div className="flex gap-2">
        <button
          className="btn-secondary"
          disabled={busy}
          onClick={() => run(() => respondToOffer({ offerId: myOffer.id, action: "ACCEPT" }))}
        >
          Accept
        </button>
        <button
          className="text-slate-500 underline"
          disabled={busy}
          onClick={() => run(() => respondToOffer({ offerId: myOffer.id, action: "DECLINE" }))}
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
              respondToOffer({ offerId: myOffer.id, action: "COUNTER", counterAmount: Number(counterAmount) })
            )
          }
        >
          Counter
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

function isClosed(status: OfferStatus) {
  return status === "DECLINED" || status === "EXPIRED" || status === "WITHDRAWN";
}

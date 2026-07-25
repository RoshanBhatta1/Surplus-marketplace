"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

export function DemoBuyBox({
  totalPrice,
  isBestOffer,
}: {
  totalPrice: number;
  isBestOffer: boolean;
}) {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button className="btn-primary" onClick={() => setShowNotice(true)}>
        Buy now — {formatCurrency(totalPrice)}
      </button>
      {isBestOffer && (
        <button className="btn-secondary" onClick={() => setShowNotice(true)}>
          Make an offer
        </button>
      )}
      {showNotice && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          This is a UI preview — checkout isn&apos;t connected to a backend, so no payment is processed.
        </p>
      )}
    </div>
  );
}

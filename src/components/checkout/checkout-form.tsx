"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/app/actions/checkout";
import { formatCurrency } from "@/lib/format";

export function CheckoutForm({
  listingId,
  offerId,
  itemSubtotal,
  fulfillmentOption,
  flatShippingFee,
}: {
  listingId: string;
  offerId?: string;
  itemSubtotal: number;
  fulfillmentOption: "LOCAL_PICKUP" | "SELLER_SHIPPING" | "BOTH";
  flatShippingFee: number | null;
}) {
  const [method, setMethod] = useState<"LOCAL_PICKUP" | "SELLER_SHIPPING">(
    fulfillmentOption === "SELLER_SHIPPING" ? "SELLER_SHIPPING" : "LOCAL_PICKUP"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingFee = method === "SELLER_SHIPPING" ? flatShippingFee ?? 0 : 0;
  const total = itemSubtotal + shippingFee;

  return (
    <div className="card flex flex-col gap-4">
      {fulfillmentOption === "BOTH" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-700">Fulfillment</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={method === "LOCAL_PICKUP"}
              onChange={() => setMethod("LOCAL_PICKUP")}
            />
            Local pickup
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={method === "SELLER_SHIPPING"}
              onChange={() => setMethod("SELLER_SHIPPING")}
            />
            Seller-arranged shipping ({formatCurrency(flatShippingFee ?? 0)})
          </label>
        </div>
      )}

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Item subtotal</span>
          <span>{formatCurrency(itemSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Shipping</span>
          <span>{shippingFee > 0 ? formatCurrency(shippingFee) : "Free (pickup)"}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1 font-medium text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Payment is held until you confirm you received the material, or released automatically after
        the hold window.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        className="btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await createCheckoutSession({
            listingId,
            fulfillmentMethod: method,
            offerId,
          });
          if (!result.ok) {
            setError(result.error);
            setBusy(false);
            return;
          }
          window.location.href = result.url;
        }}
      >
        {busy ? "Redirecting to payment…" : `Pay ${formatCurrency(total)}`}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmReceipt } from "@/app/actions/order";

export function ConfirmReceiptButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-primary"
        disabled={busy}
        onClick={async () => {
          if (!confirm("Confirm you received the material? This releases payment to the seller.")) return;
          setBusy(true);
          setError(null);
          const result = await confirmReceipt(transactionId);
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        {busy ? "Releasing payment…" : "Confirm receipt & release payment"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

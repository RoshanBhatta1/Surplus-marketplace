"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fileDispute } from "@/app/actions/order";

export function DisputeForm({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="text-sm text-slate-500 underline" onClick={() => setOpen(true)}>
        Report an issue with this order
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
      <p className="text-sm text-slate-600">
        This pauses payment release and routes the order to an admin for review.
      </p>
      <input
        className="input"
        placeholder="Reason (e.g. wrong dye lot, item not received)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <textarea
        className="input"
        placeholder="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          className="btn-secondary"
          disabled={busy || !reason || !details}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const result = await fileDispute({ transactionId, reason, details });
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          }}
        >
          Submit dispute
        </button>
        <button className="text-sm text-slate-500" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

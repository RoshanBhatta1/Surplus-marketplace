"use client";

import { useState } from "react";
import { fileReport } from "@/app/actions/trust";

export function ReportButton({
  targetType,
  listingId,
  reportedUserId,
}: {
  targetType: "LISTING" | "USER";
  listingId?: string;
  reportedUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <p className="text-sm text-slate-500">Report submitted — thanks.</p>;

  if (!open) {
    return (
      <button className="text-sm text-slate-500 underline" onClick={() => setOpen(true)}>
        {targetType === "LISTING" ? "Report listing" : "Report user"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
      <input
        className="input"
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <textarea
        className="input"
        placeholder="Details (optional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn-secondary"
          disabled={busy || !reason}
          onClick={async () => {
            setBusy(true);
            await fileReport({ targetType, listingId, reportedUserId, reason, details });
            setBusy(false);
            setDone(true);
          }}
        >
          Submit report
        </button>
        <button className="text-sm text-slate-500" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

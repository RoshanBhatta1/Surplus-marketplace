"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePlatformConfig } from "@/app/actions/admin";

export function ConfigForm({
  commissionPercent,
  fundReleaseWindowDays,
}: {
  commissionPercent: number;
  fundReleaseWindowDays: number;
}) {
  const router = useRouter();
  const [commission, setCommission] = useState(String(commissionPercent));
  const [releaseWindow, setReleaseWindow] = useState(String(fundReleaseWindowDays));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <div className="card flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Platform commission (%)</span>
        <input
          type="number"
          step="0.1"
          className="input"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Fund release window (days)</span>
        <input
          type="number"
          className="input"
          value={releaseWindow}
          onChange={(e) => setReleaseWindow(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        className="btn-primary self-start"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          setSaved(false);
          const result = await updatePlatformConfig({
            commissionPercent: Number(commission),
            fundReleaseWindowDays: Number(releaseWindow),
          });
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSaved(true);
          router.refresh();
        }}
      >
        {busy ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

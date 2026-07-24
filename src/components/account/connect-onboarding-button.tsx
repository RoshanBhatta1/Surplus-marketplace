"use client";

import { useState } from "react";
import { createConnectOnboardingLink } from "@/app/actions/stripe-connect";

export function ConnectOnboardingButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await createConnectOnboardingLink();
          if (!result.ok) {
            setError(result.error);
            setBusy(false);
            return;
          }
          window.location.href = result.url;
        }}
      >
        {busy ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminActionButton({
  label,
  variant = "secondary",
  confirmText,
  onRun,
}: {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  confirmText?: string;
  onRun: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const className =
    variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-secondary text-red-600" : "btn-secondary";

  return (
    <span className="inline-flex flex-col">
      <button
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirmText && !confirm(confirmText)) return;
          setBusy(true);
          setError(null);
          const result = await onRun();
          setBusy(false);
          if (!result.ok) {
            setError(result.error ?? "Failed");
            return;
          }
          router.refresh();
        }}
      >
        {busy ? "…" : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}

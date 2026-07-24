"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-client";
import { submitBusinessVerification } from "@/app/actions/account";

export function BusinessVerification({
  businessName,
  businessNumber,
  verifiedAt,
}: {
  businessName: string | null;
  businessNumber: string | null;
  verifiedAt: Date | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(businessName ?? "");
  const [number, setNumber] = useState(businessNumber ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (verifiedAt) {
    return (
      <div className="flex items-center gap-2">
        <span className="badge bg-emerald-100 text-emerald-800">Verified Business</span>
        <span className="text-sm text-slate-600">{businessName}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        Upload your business info and an insurance/WSIB document to earn the Verified Business badge.
        This is a trust signal — you can already buy and sell without it.
      </p>
      <input
        className="input"
        placeholder="Business name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input"
        placeholder="Business number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
      />
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        className="btn-secondary self-start"
        disabled={busy || !file || !name || !number}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const url = await uploadFile(file, "verification");
            const result = await submitBusinessVerification({
              businessName: name,
              businessNumber: number,
              insuranceDocumentUrl: url,
            });
            if (!result.ok) throw new Error(result.error);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Submitting…" : "Submit for verification"}
      </button>
    </div>
  );
}

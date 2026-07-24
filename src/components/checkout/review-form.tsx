"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/actions/review";

export function ReviewForm({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-700">Rate this seller</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl leading-none ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input"
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        className="btn-secondary self-start"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await submitReview({ transactionId, rating, comment });
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        Submit review
      </button>
    </div>
  );
}

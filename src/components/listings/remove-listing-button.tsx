"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeListing } from "@/app/actions/listings";

export function RemoveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="btn-secondary"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Remove this listing? It will no longer be visible to buyers.")) return;
        setBusy(true);
        await removeListing(listingId);
        router.push("/account/listings");
      }}
    >
      {busy ? "Removing…" : "Remove listing"}
    </button>
  );
}

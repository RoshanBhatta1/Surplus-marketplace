"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/account";

export function ProfileForm({
  name,
  city,
  region,
  postalCode,
}: {
  name: string;
  city: string | null;
  region: string | null;
  postalCode: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    name,
    city: city ?? "",
    region: region ?? "",
    postalCode: postalCode ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Name</span>
        <input
          className="input"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">City</span>
          <input
            className="input"
            value={values.city}
            onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Province</span>
          <input
            className="input"
            value={values.region}
            onChange={(e) => setValues((v) => ({ ...v, region: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Postal code</span>
          <input
            className="input"
            value={values.postalCode}
            onChange={(e) => setValues((v) => ({ ...v, postalCode: e.target.value }))}
          />
        </label>
      </div>
      <button
        className="btn-secondary self-start"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setSaved(false);
          await updateProfile(values);
          setBusy(false);
          setSaved(true);
          router.refresh();
        }}
      >
        {busy ? "Saving…" : saved ? "Saved" : "Save changes"}
      </button>
    </div>
  );
}

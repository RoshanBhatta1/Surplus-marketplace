"use client";

import { useState } from "react";

export function DemoReportButton({ label }: { label: string }) {
  const [shown, setShown] = useState(false);

  if (shown) return <p className="text-sm text-slate-500">Reporting requires sign-in (demo only).</p>;

  return (
    <button className="text-sm text-slate-500 underline" onClick={() => setShown(true)}>
      {label}
    </button>
  );
}

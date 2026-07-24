"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/app/actions/auth";

export function ResendVerificationButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  return (
    <button
      className="btn-secondary"
      disabled={state !== "idle"}
      onClick={async () => {
        setState("sending");
        await resendVerificationEmail();
        setState("sent");
      }}
    >
      {state === "sent" ? "Email sent" : state === "sending" ? "Sending…" : "Resend verification email"}
    </button>
  );
}

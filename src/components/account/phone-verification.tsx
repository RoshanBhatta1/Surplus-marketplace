"use client";

import { useState } from "react";
import { sendPhoneVerificationCode, confirmPhoneVerificationCode } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export function PhoneVerification({
  phone,
  verified,
}: {
  phone: string | null;
  verified: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "code-sent">("idle");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (verified) {
    return (
      <p className="text-sm text-slate-600">
        Phone verified: <span className="font-medium text-slate-900">{phone}</span>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {step === "idle" ? (
        <div className="flex gap-2">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Phone number"
            className="input flex-1"
          />
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              const result = await sendPhoneVerificationCode(phoneInput);
              setBusy(false);
              if (!result.ok) return setError(result.error);
              setStep("code-sent");
            }}
          >
            Send code
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="input flex-1"
          />
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              const result = await confirmPhoneVerificationCode(code);
              setBusy(false);
              if (!result.ok) return setError(result.error);
              router.refresh();
            }}
          >
            Confirm
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

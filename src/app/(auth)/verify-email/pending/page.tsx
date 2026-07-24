import { requireUser } from "@/lib/auth-helpers";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

export default async function VerifyEmailPendingPage() {
  await requireUser();

  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-sm text-slate-600">
        We sent a verification link to your email address. You need to verify before you can list or
        buy items.
      </p>
      <div className="mt-4">
        <ResendVerificationButton />
      </div>
    </div>
  );
}

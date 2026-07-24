import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { ConnectOnboardingButton } from "@/components/account/connect-onboarding-button";

export default async function PayoutsPage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Payouts</h1>
      <div className="card mt-6">
        {!isStripeConfigured() ? (
          <p className="text-sm text-slate-600">Payments are not configured on this deployment yet.</p>
        ) : user.stripeConnectPayoutsEnabled ? (
          <div>
            <span className="badge bg-emerald-100 text-emerald-800">Payouts enabled</span>
            <p className="mt-2 text-sm text-slate-600">
              You're set up to receive payouts when a sale's hold period ends.
            </p>
            <div className="mt-4">
              <ConnectOnboardingButton label="Update payout details" />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600">
              Connect a payout account with Stripe before you can sell. You'll be paid out (minus
              platform commission) once a buyer confirms receipt or the hold window ends.
            </p>
            <div className="mt-4">
              <ConnectOnboardingButton label={user.stripeConnectAccountId ? "Finish payout setup" : "Set up payouts"} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

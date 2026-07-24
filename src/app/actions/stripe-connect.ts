"use server";

import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth-helpers";

type ActionResult = { ok: true; url: string } | { ok: false; error: string };

export async function createConnectOnboardingLink(): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  if (!isStripeConfigured()) {
    return { ok: false, error: "Payments are not configured on this deployment yet." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  try {
    let accountId = user.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: user.accountType === "BUSINESS" ? "company" : "individual",
      });
      accountId = account.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeConnectAccountId: accountId } });
    }

    const baseUrl = process.env.APP_BASE_URL;
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/account/payouts`,
      return_url: `${baseUrl}/account/payouts`,
      type: "account_onboarding",
    });

    return { ok: true, url: link.url };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : "Could not start payout setup";
    return { ok: false, error: message };
  }
}

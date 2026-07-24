import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(secretKey || "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

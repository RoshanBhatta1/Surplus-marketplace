import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "Surplus Flooring Marketplace <no-reply@example.com>";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!resend) {
    // Dev fallback: no RESEND_API_KEY configured, so log instead of sending.
    console.log(`[email:dev] to=${opts.to} subject="${opts.subject}"\n${opts.html}`);
    return;
  }
  await resend.emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.APP_BASE_URL}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: "Verify your email — Surplus Flooring Marketplace",
    html: `<p>Confirm your email to start buying and selling.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: "Reset your password — Surplus Flooring Marketplace",
    html: `<p>Reset your password.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
}

export async function sendTransactionEmail(to: string, subject: string, message: string) {
  await sendEmail({
    to,
    subject,
    html: `<p>${message}</p><p><a href="${process.env.APP_BASE_URL}/account/orders">View your orders</a></p>`,
  });
}

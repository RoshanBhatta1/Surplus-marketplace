import Link from "next/link";
import { verifyEmail } from "@/app/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <p className="text-sm text-red-600">Missing verification token.</p>;
  }

  const result = await verifyEmail(token);

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Verification failed</h1>
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
        <Link href="/verify-email/pending" className="mt-4 inline-block text-sm underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Email verified</h1>
      <p className="mt-2 text-sm text-slate-600">You can now buy and sell on the marketplace.</p>
      <Link href="/login" className="mt-4 inline-block text-sm underline">
        Log in
      </Link>
    </div>
  );
}

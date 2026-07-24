import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { PhoneVerification } from "@/components/account/phone-verification";
import { BusinessVerification } from "@/components/account/business-verification";

export default async function AccountPage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Your account</h1>

      <section className="card mt-6">
        <h2 className="text-lg font-medium">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        {!user.emailVerifiedAt && (
          <p className="mt-2 text-sm text-amber-700">
            Email not verified.{" "}
            <Link href="/verify-email/pending" className="underline">
              Verify now
            </Link>
          </p>
        )}
        <div className="mt-4">
          <ProfileForm
            name={user.name}
            city={user.city}
            region={user.region}
            postalCode={user.postalCode}
          />
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-lg font-medium">Phone verification</h2>
        <div className="mt-3">
          <PhoneVerification phone={user.phone} verified={user.phoneVerifiedAt !== null} />
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-lg font-medium">Business verification</h2>
        <div className="mt-3">
          <BusinessVerification
            businessName={user.businessName}
            businessNumber={user.businessNumber}
            verifiedAt={user.businessVerifiedAt}
          />
        </div>
      </section>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/account/listings" className="underline">
          My listings
        </Link>
        <Link href="/account/orders" className="underline">
          My orders
        </Link>
      </div>
    </div>
  );
}

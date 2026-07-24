import { requireVerifiedUser } from "@/lib/auth-helpers";
import { ListingForm } from "@/components/listings/listing-form";

export default async function NewListingPage() {
  const session = await requireVerifiedUser();

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">List surplus material</h1>
        <p className="mt-1 text-sm text-slate-600">
          Selling as {session.user.accountType === "BUSINESS" ? "a business account" : "an individual"}.
        </p>
      </div>
      <div className="mt-6">
        <ListingForm mode="create" />
      </div>
    </div>
  );
}

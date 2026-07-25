import { ListingForm } from "@/components/listings/listing-form";

export default function NewListingPage() {
  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">List surplus material</h1>
        <p className="mt-1 text-sm text-slate-600">
          UI preview — this form isn&apos;t connected to a backend, so submitting won&apos;t create a real
          listing.
        </p>
      </div>
      <div className="mt-6">
        <ListingForm />
      </div>
    </div>
  );
}

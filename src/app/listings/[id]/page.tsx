import Image from "next/image";
import { notFound } from "next/navigation";
import { getDemoListing } from "@/lib/demo/data";
import { formatCurrency } from "@/lib/format";
import {
  materialTypeLabels,
  listingConditionLabels,
  unitOfMeasureLabels,
  listingTypeLabels,
  fulfillmentOptionLabels,
} from "@/lib/validation/listing";
import { DemoBuyBox } from "@/components/demo/demo-buy-box";
import { DemoReportButton } from "@/components/demo/demo-report-button";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getDemoListing(id);

  if (!listing) notFound();

  const photos = listing.images.filter((i) => i.kind === "PHOTO");
  const dyeLotPhoto = listing.images.find((i) => i.kind === "DYE_LOT_LABEL");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-2">
            {photos.map((img) => (
              <div
                key={img.url}
                className="relative aspect-square overflow-hidden rounded-lg border border-slate-200"
              >
                <Image src={img.url} alt={listing.title} fill unoptimized className="object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-900">Dye lot / provenance</h3>
            {listing.dyeLotNumber ? (
              <p className="mt-1 text-sm text-slate-700">Dye lot / run number: {listing.dyeLotNumber}</p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">No dye lot on file for this listing.</p>
            )}
            {dyeLotPhoto ? (
              <div className="relative mt-3 aspect-video w-full max-w-sm overflow-hidden rounded-md border border-slate-200">
                <Image src={dyeLotPhoto.url} alt="Box label / dye lot" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No box-label photo provided.</p>
            )}
          </div>

          {listing.description && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-900">Description</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{listing.description}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-slate-100 text-slate-700">{materialTypeLabels[listing.materialType]}</span>
            <span className="badge bg-slate-100 text-slate-700">{listingConditionLabels[listing.condition]}</span>
            <span className="badge bg-slate-100 text-slate-700">{listingTypeLabels[listing.listingType]}</span>
            {listing.status === "SOLD" && <span className="badge bg-red-100 text-red-700">Sold</span>}
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{listing.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {listing.manufacturer} · {listing.productLine} · {listing.colorName} ({listing.colorNumber})
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {listing.city}, {listing.region}
          </p>

          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(listing.pricePerUnit)}{" "}
              <span className="text-sm font-normal text-slate-500">/ {unitOfMeasureLabels[listing.unitOfMeasure]}</span>
            </p>
            <p className="text-sm text-slate-600">
              {listing.quantity.toLocaleString("en-CA")} {unitOfMeasureLabels[listing.unitOfMeasure]} available ·
              total {formatCurrency(listing.totalPrice)}
            </p>
            <p className="mt-2 text-sm text-slate-600">{fulfillmentOptionLabels[listing.fulfillmentOption]}</p>
            {listing.flatShippingFee && (
              <p className="text-sm text-slate-600">Flat shipping: {formatCurrency(listing.flatShippingFee)}</p>
            )}

            <div className="mt-4">
              {listing.status === "SOLD" ? (
                <p className="text-sm text-slate-500">This listing has sold.</p>
              ) : (
                <DemoBuyBox totalPrice={listing.totalPrice} isBestOffer={listing.listingType === "BEST_OFFER"} />
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-900">Seller</h3>
            <p className="mt-1 text-sm text-slate-700">{listing.seller.name}</p>
            {listing.rating.count > 0 ? (
              <p className="mt-1 text-sm text-amber-600">
                {"★".repeat(Math.round(listing.rating.avg))}
                <span className="ml-1 text-slate-500">
                  {listing.rating.avg.toFixed(1)} ({listing.rating.count} review
                  {listing.rating.count === 1 ? "" : "s"})
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No reviews yet</p>
            )}
            {listing.seller.accountType === "BUSINESS" && listing.seller.businessVerifiedAt && (
              <span className="badge mt-1 bg-emerald-100 text-emerald-800">
                Verified Business{listing.seller.businessName ? ` — ${listing.seller.businessName}` : ""}
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-3">
            <DemoReportButton label="Report listing" />
            <DemoReportButton label="Report user" />
          </div>
        </div>
      </div>
    </div>
  );
}

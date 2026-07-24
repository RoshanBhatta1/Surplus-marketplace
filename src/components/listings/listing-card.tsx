import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import {
  materialTypeLabels,
  listingConditionLabels,
  unitOfMeasureLabels,
  type materialTypes,
  type listingConditions,
  type unitsOfMeasure,
} from "@/lib/validation/listing";

export type ListingCardData = {
  id: string;
  title: string;
  manufacturer: string;
  colorName: string;
  colorNumber: string;
  materialType: (typeof materialTypes)[number];
  condition: (typeof listingConditions)[number];
  unitOfMeasure: (typeof unitsOfMeasure)[number];
  pricePerUnit: number | string;
  city: string;
  region: string;
  status: string;
  coverImageUrl?: string | null;
  distanceKm?: number | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card flex flex-col gap-2 transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-slate-100">
        {listing.coverImageUrl ? (
          <Image src={listing.coverImageUrl} alt={listing.title} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
        )}
        {listing.status === "SOLD" && (
          <span className="badge absolute left-2 top-2 bg-red-600 text-white">Sold</span>
        )}
      </div>
      <div>
        <p className="line-clamp-1 text-sm font-medium text-slate-900">{listing.title}</p>
        <p className="text-xs text-slate-500">
          {listing.manufacturer} · {listing.colorName} ({listing.colorNumber})
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="badge bg-slate-100 text-slate-600">{materialTypeLabels[listing.materialType]}</span>
        <span className="badge bg-slate-100 text-slate-600">{listingConditionLabels[listing.condition]}</span>
      </div>
      <p className="text-base font-semibold text-slate-900">
        {formatCurrency(listing.pricePerUnit)}{" "}
        <span className="text-xs font-normal text-slate-500">/ {unitOfMeasureLabels[listing.unitOfMeasure]}</span>
      </p>
      <p className="text-xs text-slate-500">
        {listing.city}, {listing.region}
        {typeof listing.distanceKm === "number" && ` · ${listing.distanceKm.toFixed(0)} km away`}
      </p>
    </Link>
  );
}

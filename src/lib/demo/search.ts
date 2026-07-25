import { demoListings, getDemoManufacturers, type DemoListing } from "./data";
import { geocode, haversineDistanceKm } from "@/lib/geocoding";

export type ListingSort = "newest" | "price_asc" | "price_desc" | "distance";

export type ListingSearchParams = {
  q?: string;
  manufacturer?: string;
  materialType?: string;
  condition?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  near?: string;
  maxDistanceKm?: number;
  sort?: ListingSort;
  page?: number;
};

const PAGE_SIZE = 24;

export async function searchListings(params: ListingSearchParams) {
  const page = Math.max(1, params.page ?? 1);

  let origin: { latitude: number; longitude: number } | null = null;
  if (params.near && params.near.trim().length > 0) {
    origin = await geocode(params.near.trim(), "", "");
  }

  const sort: ListingSort = params.sort ?? (origin ? "distance" : "newest");
  const q = params.q?.trim().toLowerCase();

  let results = demoListings.filter((l) => l.status === "ACTIVE");

  if (q) {
    results = results.filter((l) =>
      [l.manufacturer, l.productLine, l.colorName, l.colorNumber].some((f) => f.toLowerCase().includes(q))
    );
  }
  if (params.manufacturer) {
    const m = params.manufacturer.toLowerCase();
    results = results.filter((l) => l.manufacturer.toLowerCase().includes(m));
  }
  if (params.materialType) {
    results = results.filter((l) => l.materialType === params.materialType);
  }
  if (params.condition) {
    results = results.filter((l) => l.condition === params.condition);
  }
  if (params.listingType) {
    results = results.filter((l) => l.listingType === params.listingType);
  }
  if (typeof params.minPrice === "number") {
    results = results.filter((l) => l.pricePerUnit >= params.minPrice!);
  }
  if (typeof params.maxPrice === "number") {
    results = results.filter((l) => l.pricePerUnit <= params.maxPrice!);
  }
  if (typeof params.minQuantity === "number") {
    results = results.filter((l) => l.quantity >= params.minQuantity!);
  }

  const withDistance = results.map((l) => ({
    listing: l,
    distanceKm: origin ? haversineDistanceKm(origin, l) : null,
  }));

  const filtered =
    origin && typeof params.maxDistanceKm === "number"
      ? withDistance.filter((r) => (r.distanceKm ?? Infinity) <= params.maxDistanceKm!)
      : withDistance;

  filtered.sort((a, b) => {
    if (sort === "price_asc") return a.listing.pricePerUnit - b.listing.pricePerUnit;
    if (sort === "price_desc") return b.listing.pricePerUnit - a.listing.pricePerUnit;
    if (sort === "distance" && origin) return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    return new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime();
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    results: pageItems.map(({ listing: l, distanceKm }) => ({
      id: l.id,
      title: l.title,
      manufacturer: l.manufacturer,
      colorName: l.colorName,
      colorNumber: l.colorNumber,
      materialType: l.materialType,
      condition: l.condition,
      unitOfMeasure: l.unitOfMeasure,
      pricePerUnit: l.pricePerUnit,
      city: l.city,
      region: l.region,
      status: l.status,
      coverImageUrl: l.images.find((img) => img.kind === "PHOTO")?.url ?? null,
      distanceKm,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    manufacturers: getDemoManufacturers(),
    origin,
  };
}

export function allDemoListings(): DemoListing[] {
  return demoListings;
}

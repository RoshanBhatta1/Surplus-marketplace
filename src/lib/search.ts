import { Prisma } from "@prisma/client";
import type { MaterialType, ListingCondition, UnitOfMeasure } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/geocoding";

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
  near?: string; // free-text city / postal code to geocode as the search origin
  maxDistanceKm?: number;
  sort?: ListingSort;
  page?: number;
};

const PAGE_SIZE = 24;

export type ListingSearchResult = {
  id: string;
  title: string;
  manufacturer: string;
  colorName: string;
  colorNumber: string;
  materialType: MaterialType;
  condition: ListingCondition;
  unitOfMeasure: UnitOfMeasure;
  pricePerUnit: Prisma.Decimal;
  city: string;
  region: string;
  status: string;
  coverImageUrl: string | null;
  distanceKm: number | null;
};

export async function searchListings(params: ListingSearchParams) {
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  let origin: { latitude: number; longitude: number } | null = null;
  if (params.near && params.near.trim().length > 0) {
    origin = await geocode(params.near.trim(), "", "");
  }

  const sort: ListingSort = params.sort ?? (origin ? "distance" : "newest");

  const conditions: Prisma.Sql[] = [Prisma.sql`l.status = 'ACTIVE'`];

  if (params.q && params.q.trim().length > 0) {
    conditions.push(
      Prisma.sql`to_tsvector('english', l.manufacturer || ' ' || l."productLine" || ' ' || l."colorName" || ' ' || l."colorNumber") @@ plainto_tsquery('english', ${params.q.trim()})`
    );
  }
  if (params.manufacturer) {
    conditions.push(Prisma.sql`l.manufacturer ILIKE ${`%${params.manufacturer}%`}`);
  }
  if (params.materialType) {
    conditions.push(Prisma.sql`l."materialType" = ${params.materialType}::"MaterialType"`);
  }
  if (params.condition) {
    conditions.push(Prisma.sql`l.condition = ${params.condition}::"ListingCondition"`);
  }
  if (params.listingType) {
    conditions.push(Prisma.sql`l."listingType" = ${params.listingType}::"ListingType"`);
  }
  if (typeof params.minPrice === "number") {
    conditions.push(Prisma.sql`l."pricePerUnit" >= ${params.minPrice}`);
  }
  if (typeof params.maxPrice === "number") {
    conditions.push(Prisma.sql`l."pricePerUnit" <= ${params.maxPrice}`);
  }
  if (typeof params.minQuantity === "number") {
    conditions.push(Prisma.sql`l.quantity >= ${params.minQuantity}`);
  }
  if (origin && typeof params.maxDistanceKm === "number") {
    conditions.push(
      Prisma.sql`(6371 * acos(least(1.0, greatest(-1.0,
        cos(radians(${origin.latitude})) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians(${origin.longitude})) +
        sin(radians(${origin.latitude})) * sin(radians(l.latitude))
      )))) <= ${params.maxDistanceKm}`
    );
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

  const distanceExpr = origin
    ? Prisma.sql`(6371 * acos(least(1.0, greatest(-1.0,
        cos(radians(${origin.latitude})) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians(${origin.longitude})) +
        sin(radians(${origin.latitude})) * sin(radians(l.latitude))
      ))))`
    : Prisma.sql`NULL`;

  const orderBy =
    sort === "price_asc"
      ? Prisma.sql`l."pricePerUnit" ASC`
      : sort === "price_desc"
        ? Prisma.sql`l."pricePerUnit" DESC`
        : sort === "distance" && origin
          ? Prisma.sql`distance_km ASC NULLS LAST`
          : Prisma.sql`l."createdAt" DESC`;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      manufacturer: string;
      colorName: string;
      colorNumber: string;
      materialType: MaterialType;
      condition: ListingCondition;
      unitOfMeasure: UnitOfMeasure;
      pricePerUnit: Prisma.Decimal;
      city: string;
      region: string;
      status: string;
      coverImageUrl: string | null;
      distance_km: number | null;
    }>
  >`
    SELECT
      l.id, l.title, l.manufacturer, l."colorName", l."colorNumber",
      l."materialType", l.condition, l."unitOfMeasure", l."pricePerUnit",
      l.city, l.region, l.status,
      (SELECT url FROM "ListingImage" WHERE "listingId" = l.id AND kind = 'PHOTO' ORDER BY position ASC LIMIT 1) AS "coverImageUrl",
      ${distanceExpr} AS distance_km
    FROM "Listing" l
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM "Listing" l ${whereClause}
  `;
  const total = Number(countRows[0]?.count ?? 0);

  const manufacturers = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: { manufacturer: true },
    distinct: ["manufacturer"],
    orderBy: { manufacturer: "asc" },
    take: 200,
  });

  return {
    results: rows.map((r) => ({ ...r, distanceKm: r.distance_km })) as ListingSearchResult[],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    manufacturers: manufacturers.map((m) => m.manufacturer),
    origin,
  };
}

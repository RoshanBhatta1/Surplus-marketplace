import Link from "next/link";
import { Suspense } from "react";
import { searchListings } from "@/lib/demo/search";
import { ListingCard } from "@/components/listings/listing-card";
import { SearchFilters } from "@/components/listings/search-filters";
import { SortSelect } from "@/components/listings/sort-select";

type RawSearchParams = Record<string, string | string[] | undefined>;

function str(params: RawSearchParams, key: string) {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function num(params: RawSearchParams, key: string) {
  const v = str(params, key);
  const n = v ? Number(v) : undefined;
  return typeof n === "number" && !Number.isNaN(n) ? n : undefined;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;

  const query = {
    q: str(params, "q"),
    manufacturer: str(params, "manufacturer"),
    materialType: str(params, "materialType"),
    condition: str(params, "condition"),
    minPrice: num(params, "minPrice"),
    maxPrice: num(params, "maxPrice"),
    minQuantity: num(params, "minQuantity"),
    near: str(params, "near"),
    maxDistanceKm: num(params, "maxDistanceKm"),
    sort: str(params, "sort") as "newest" | "price_asc" | "price_desc" | "distance" | undefined,
    page: num(params, "page"),
  };

  const { results, total, page, totalPages, manufacturers } = await searchListings(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Browse listings</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <aside>
          <Suspense fallback={null}>
            <SearchFilters
              manufacturers={manufacturers}
              initial={{
                q: query.q ?? "",
                manufacturer: query.manufacturer ?? "",
                materialType: query.materialType ?? "",
                condition: query.condition ?? "",
                minPrice: query.minPrice?.toString() ?? "",
                maxPrice: query.maxPrice?.toString() ?? "",
                minQuantity: query.minQuantity?.toString() ?? "",
                near: query.near ?? "",
                maxDistanceKm: query.maxDistanceKm?.toString() ?? "",
                sort: query.sort ?? "newest",
              }}
            />
          </Suspense>
        </aside>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{total} result{total === 1 ? "" : "s"}</p>
            <Suspense fallback={null}>
              <SortSelect current={query.sort ?? "newest"} />
            </Suspense>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {results.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  pricePerUnit: Number(listing.pricePerUnit),
                  distanceKm: listing.distanceKm,
                }}
              />
            ))}
          </div>

          {results.length === 0 && (
            <p className="mt-8 text-sm text-slate-500">No listings match those filters.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const pageParams = new URLSearchParams(
                  Object.entries(params).flatMap(([k, v]) =>
                    v ? [[k, Array.isArray(v) ? v[0] : v]] : []
                  ) as [string, string][]
                );
                pageParams.set("page", String(p));
                return (
                  <Link
                    key={p}
                    href={`/listings?${pageParams.toString()}`}
                    className={`rounded-md px-3 py-1 text-sm ${
                      p === page ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

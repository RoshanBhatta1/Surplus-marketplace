"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  materialTypes,
  materialTypeLabels,
  listingConditions,
  listingConditionLabels,
} from "@/lib/validation/listing";

export type SearchFilterValues = {
  q: string;
  manufacturer: string;
  materialType: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  minQuantity: string;
  near: string;
  maxDistanceKm: string;
  sort: string;
};

export function SearchFilters({
  initial,
  manufacturers,
}: {
  initial: SearchFilterValues;
  manufacturers: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);

  function set<K extends keyof SearchFilterValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function apply(overrides: Partial<SearchFilterValues> = {}) {
    const merged = { ...values, ...overrides };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="flex flex-col gap-3"
      >
        <input
          className="input"
          placeholder="Search manufacturer, product line, color…"
          value={values.q}
          onChange={(e) => set("q", e.target.value)}
        />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Manufacturer</span>
          <select
            className="input"
            value={values.manufacturer}
            onChange={(e) => apply({ manufacturer: e.target.value })}
          >
            <option value="">Any</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Material type</span>
          <select
            className="input"
            value={values.materialType}
            onChange={(e) => apply({ materialType: e.target.value })}
          >
            <option value="">Any</option>
            {materialTypes.map((m) => (
              <option key={m} value={m}>
                {materialTypeLabels[m]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Condition</span>
          <select
            className="input"
            value={values.condition}
            onChange={(e) => apply({ condition: e.target.value })}
          >
            <option value="">Any</option>
            {listingConditions.map((c) => (
              <option key={c} value={c}>
                {listingConditionLabels[c]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Min price</span>
            <input
              type="number"
              className="input"
              value={values.minPrice}
              onChange={(e) => set("minPrice", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Max price</span>
            <input
              type="number"
              className="input"
              value={values.maxPrice}
              onChange={(e) => set("maxPrice", e.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Min quantity available</span>
          <input
            type="number"
            className="input"
            value={values.minQuantity}
            onChange={(e) => set("minQuantity", e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Near (city or postal code)</span>
          <input
            className="input"
            placeholder="e.g. Toronto, ON"
            value={values.near}
            onChange={(e) => set("near", e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Max distance (km)</span>
          <input
            type="number"
            className="input"
            value={values.maxDistanceKm}
            onChange={(e) => set("maxDistanceKm", e.target.value)}
          />
        </label>

        <button type="submit" className="btn-primary">
          Apply filters
        </button>
        <button
          type="button"
          className="text-sm text-slate-500 underline"
          onClick={() => router.push("/listings")}
        >
          Clear all
        </button>
      </form>
    </div>
  );
}

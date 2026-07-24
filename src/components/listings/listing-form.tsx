"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createListingSchema,
  type CreateListingInput,
  type CreateListingFormInput,
  materialTypes,
  materialTypeLabels,
  listingConditions,
  listingConditionLabels,
  unitsOfMeasure,
  unitOfMeasureLabels,
  listingTypes,
  listingTypeLabels,
  fulfillmentOptions,
  fulfillmentOptionLabels,
} from "@/lib/validation/listing";
import { createListing, updateListing } from "@/app/actions/listings";
import { ImageUploader, type ListingImageInput } from "@/components/listings/image-uploader";

type Props = {
  mode: "create" | "edit";
  listingId?: string;
  defaultValues?: Partial<CreateListingFormInput>;
};

export function ListingForm({ mode, listingId, defaultValues }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingFormInput, unknown, CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      currency: "CAD",
      listingType: "FIXED_PRICE",
      fulfillmentOption: "LOCAL_PICKUP",
      images: [],
      ...defaultValues,
    },
  });

  const listingType = watch("listingType");
  const fulfillmentOption = watch("fulfillmentOption");
  const quantity = watch("quantity");
  const pricePerUnit = watch("pricePerUnit");
  const unitOfMeasure = watch("unitOfMeasure");

  async function onSubmit(values: CreateListingInput) {
    setServerError(null);
    const result =
      mode === "create" ? await createListing(values) : await updateListing(listingId!, values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(`/listings/${result.id}`);
  }

  const total =
    quantity && pricePerUnit ? (Number(quantity) * Number(pricePerUnit)).toFixed(2) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-2xl flex-col gap-6 pb-16">
      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Listing basics</h2>
        <Field label="Title" error={errors.title?.message}>
          <input {...register("title")} className="input" placeholder="e.g. Shaw carpet tile — 40 boxes, one dye lot" />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <textarea {...register("description")} className="input min-h-24" />
        </Field>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Manufacturer &amp; color match</h2>
        <p className="text-xs text-slate-500">
          Precision here is the whole point — buyers matching a repair job depend on these fields.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Manufacturer" error={errors.manufacturer?.message}>
            <input {...register("manufacturer")} className="input" />
          </Field>
          <Field label="Product line / style" error={errors.productLine?.message}>
            <input {...register("productLine")} className="input" />
          </Field>
          <Field label="Color name" error={errors.colorName?.message}>
            <input {...register("colorName")} className="input" />
          </Field>
          <Field label="Color number" error={errors.colorNumber?.message}>
            <input {...register("colorNumber")} className="input" />
          </Field>
        </div>
        <Field
          label="Dye lot / run number (optional)"
          error={errors.dyeLotNumber?.message}
          hint="Leave blank if unknown — buyers will see 'no dye lot on file'."
        >
          <input {...register("dyeLotNumber")} className="input" />
        </Field>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Material &amp; condition</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Material type" error={errors.materialType?.message}>
            <select {...register("materialType")} className="input">
              <option value="">Select…</option>
              {materialTypes.map((m) => (
                <option key={m} value={m}>
                  {materialTypeLabels[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Condition" error={errors.condition?.message}>
            <select {...register("condition")} className="input">
              <option value="">Select…</option>
              {listingConditions.map((c) => (
                <option key={c} value={c}>
                  {listingConditionLabels[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Quantity &amp; pricing (CAD)</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit of measure" error={errors.unitOfMeasure?.message}>
            <select {...register("unitOfMeasure")} className="input">
              <option value="">Select…</option>
              {unitsOfMeasure.map((u) => (
                <option key={u} value={u}>
                  {unitOfMeasureLabels[u]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity" error={errors.quantity?.message}>
            <input type="number" step="any" {...register("quantity")} className="input" />
          </Field>
          <Field
            label={`Price per ${unitOfMeasure ? unitOfMeasureLabels[unitOfMeasure] : "unit"} ($)`}
            error={errors.pricePerUnit?.message}
          >
            <input type="number" step="0.01" {...register("pricePerUnit")} className="input" />
          </Field>
          <Field label="Listing type" error={errors.listingType?.message}>
            <select {...register("listingType")} className="input">
              {listingTypes.map((t) => (
                <option key={t} value={t}>
                  {listingTypeLabels[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {total && (
          <p className="text-sm text-slate-600">
            Total lot price: <span className="font-medium text-slate-900">${total} CAD</span>
          </p>
        )}
        {listingType === "BEST_OFFER" && (
          <Field label="Minimum offer you'll consider ($)" error={errors.minOfferPrice?.message}>
            <input type="number" step="0.01" {...register("minOfferPrice")} className="input" />
          </Field>
        )}
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Fulfillment</h2>
        <Field label="Fulfillment option" error={errors.fulfillmentOption?.message}>
          <select {...register("fulfillmentOption")} className="input">
            {fulfillmentOptions.map((f) => (
              <option key={f} value={f}>
                {fulfillmentOptionLabels[f]}
              </option>
            ))}
          </select>
        </Field>
        {fulfillmentOption !== "LOCAL_PICKUP" && (
          <Field label="Flat shipping fee ($)" error={errors.flatShippingFee?.message}>
            <input type="number" step="0.01" {...register("flatShippingFee")} className="input" />
          </Field>
        )}
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Pickup location</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="City" error={errors.city?.message}>
            <input {...register("city")} className="input" />
          </Field>
          <Field label="Province" error={errors.region?.message}>
            <input {...register("region")} className="input" placeholder="ON" />
          </Field>
          <Field label="Postal code" error={errors.postalCode?.message}>
            <input {...register("postalCode")} className="input" />
          </Field>
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="font-medium text-slate-900">Photos</h2>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader
              images={(field.value ?? []) as ListingImageInput[]}
              onChange={field.onChange}
            />
          )}
        />
        {errors.images && (
          <p className="text-sm text-red-600">{(errors.images as { message?: string }).message}</p>
        )}
      </section>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Saving…" : mode === "create" ? "Publish listing" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-red-600">{error}</span>}
    </label>
  );
}

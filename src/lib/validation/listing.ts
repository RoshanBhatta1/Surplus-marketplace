import { z } from "zod";

export const materialTypes = [
  "CARPET_TILE",
  "BROADLOOM_CARPET",
  "LVT_LVP",
  "HARDWOOD",
  "LAMINATE",
  "CERAMIC_PORCELAIN_TILE",
  "RESILIENT_SHEET",
  "RUBBER_FLOORING",
  "TRIM_TRANSITION_PROFILE",
  "ADHESIVE_LEVELING_COMPOUND",
  "UNDERLAYMENT",
  "OTHER",
] as const;

export const materialTypeLabels: Record<(typeof materialTypes)[number], string> = {
  CARPET_TILE: "Carpet tile",
  BROADLOOM_CARPET: "Broadloom carpet",
  LVT_LVP: "LVT / LVP",
  HARDWOOD: "Hardwood",
  LAMINATE: "Laminate",
  CERAMIC_PORCELAIN_TILE: "Ceramic / porcelain tile",
  RESILIENT_SHEET: "Resilient sheet",
  RUBBER_FLOORING: "Rubber flooring",
  TRIM_TRANSITION_PROFILE: "Trim / transition profile",
  ADHESIVE_LEVELING_COMPOUND: "Adhesive / leveling compound",
  UNDERLAYMENT: "Underlayment",
  OTHER: "Other",
};

export const listingConditions = ["NEW_SEALED_BOX", "OPEN_BOX_SURPLUS", "TAKE_UP_USED"] as const;

export const listingConditionLabels: Record<(typeof listingConditions)[number], string> = {
  NEW_SEALED_BOX: "New, sealed box",
  OPEN_BOX_SURPLUS: "Open box surplus",
  TAKE_UP_USED: "Take-up (used)",
};

export const unitsOfMeasure = ["SQ_FT", "BOXES", "ROLLS", "SHEETS", "PALLETS", "LINEAR_FT"] as const;

export const unitOfMeasureLabels: Record<(typeof unitsOfMeasure)[number], string> = {
  SQ_FT: "sq ft",
  BOXES: "boxes",
  ROLLS: "rolls",
  SHEETS: "sheets",
  PALLETS: "pallets",
  LINEAR_FT: "linear ft",
};

export const listingTypes = ["FIXED_PRICE", "BEST_OFFER", "BULK_LOT"] as const;

export const listingTypeLabels: Record<(typeof listingTypes)[number], string> = {
  FIXED_PRICE: "Fixed price",
  BEST_OFFER: "Best offer",
  BULK_LOT: "Bulk lot",
};

export const fulfillmentOptions = ["LOCAL_PICKUP", "SELLER_SHIPPING", "BOTH"] as const;

export const fulfillmentOptionLabels: Record<(typeof fulfillmentOptions)[number], string> = {
  LOCAL_PICKUP: "Local pickup only",
  SELLER_SHIPPING: "Seller-arranged shipping only",
  BOTH: "Local pickup or shipping",
};

export const listingImageSchema = z.object({
  url: z.url(),
  kind: z.enum(["PHOTO", "DYE_LOT_LABEL"]),
});

export const createListingSchema = z
  .object({
    title: z.string().trim().min(5, "Title is too short").max(150),
    manufacturer: z.string().trim().min(1, "Manufacturer is required").max(150),
    productLine: z.string().trim().min(1, "Product line is required").max(150),
    colorName: z.string().trim().min(1, "Color name is required").max(150),
    colorNumber: z.string().trim().min(1, "Color number is required").max(50),
    dyeLotNumber: z.string().trim().max(50).optional().or(z.literal("")),

    materialType: z.enum(materialTypes),
    condition: z.enum(listingConditions),

    unitOfMeasure: z.enum(unitsOfMeasure),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),

    pricePerUnit: z.coerce.number().nonnegative(),
    currency: z.literal("CAD").default("CAD"),

    listingType: z.enum(listingTypes).default("FIXED_PRICE"),
    minOfferPrice: z.coerce.number().nonnegative().optional(),

    fulfillmentOption: z.enum(fulfillmentOptions).default("LOCAL_PICKUP"),
    flatShippingFee: z.coerce.number().nonnegative().optional(),

    city: z.string().trim().min(1, "City is required").max(100),
    region: z.string().trim().min(1, "Province is required").max(100),
    postalCode: z.string().trim().min(3, "Postal code is required").max(20),

    description: z.string().trim().max(5000).optional().or(z.literal("")),

    images: z.array(listingImageSchema).min(1, "Add at least one photo"),
  })
  .refine(
    (data) => data.fulfillmentOption === "LOCAL_PICKUP" || data.flatShippingFee !== undefined,
    { message: "Set a flat shipping fee when offering shipping", path: ["flatShippingFee"] }
  )
  .refine(
    (data) => data.listingType !== "BEST_OFFER" || data.minOfferPrice !== undefined,
    { message: "Set a minimum offer price for best-offer listings", path: ["minOfferPrice"] }
  );

// z.coerce fields make the raw form input type (strings from <input>) differ
// from the parsed output type (numbers) — react-hook-form needs both.
export type CreateListingFormInput = z.input<typeof createListingSchema>;
export type CreateListingInput = z.output<typeof createListingSchema>;

export const updateListingSchema = createListingSchema;

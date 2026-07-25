import { placeholderPhoto, placeholderDyeLotPhoto } from "./placeholder";
import type {
  materialTypes,
  listingConditions,
  unitsOfMeasure,
  listingTypes,
  fulfillmentOptions,
} from "@/lib/validation/listing";

export type DemoImage = { url: string; kind: "PHOTO" | "DYE_LOT_LABEL" };

export type DemoListing = {
  id: string;
  title: string;
  manufacturer: string;
  productLine: string;
  colorName: string;
  colorNumber: string;
  dyeLotNumber: string | null;
  materialType: (typeof materialTypes)[number];
  condition: (typeof listingConditions)[number];
  unitOfMeasure: (typeof unitsOfMeasure)[number];
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  currency: "CAD";
  listingType: (typeof listingTypes)[number];
  minOfferPrice: number | null;
  fulfillmentOption: (typeof fulfillmentOptions)[number];
  flatShippingFee: number | null;
  city: string;
  region: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  description: string | null;
  status: "ACTIVE" | "SOLD";
  createdAt: string;
  images: DemoImage[];
  seller: {
    id: string;
    name: string;
    accountType: "INDIVIDUAL" | "BUSINESS";
    businessName: string | null;
    businessVerifiedAt: string | null;
  };
  rating: { avg: number; count: number };
};

function listing(l: Omit<DemoListing, "totalPrice" | "images" | "rating"> & {
  rating?: { avg: number; count: number };
}): DemoListing {
  return {
    ...l,
    totalPrice: Math.round(l.pricePerUnit * l.quantity * 100) / 100,
    rating: l.rating ?? { avg: 0, count: 0 },
    images: [
      { url: placeholderPhoto(l.materialType, `${l.manufacturer} ${l.colorName}`), kind: "PHOTO" },
      { url: placeholderPhoto(l.materialType, l.productLine), kind: "PHOTO" },
      ...(l.dyeLotNumber
        ? ([{ url: placeholderDyeLotPhoto(l.dyeLotNumber), kind: "DYE_LOT_LABEL" }] as DemoImage[])
        : []),
    ],
  };
}

export const demoListings: DemoListing[] = [
  listing({
    id: "demo-1",
    title: "Shaw carpet tile — 40 boxes, single dye lot",
    manufacturer: "Shaw",
    productLine: "Diffuse Tile",
    colorName: "Slate Grey",
    colorNumber: "SG-204",
    dyeLotNumber: "DL-99231",
    materialType: "CARPET_TILE",
    condition: "NEW_SEALED_BOX",
    unitOfMeasure: "BOXES",
    quantity: 40,
    pricePerUnit: 25.5,
    currency: "CAD",
    listingType: "FIXED_PRICE",
    minOfferPrice: null,
    fulfillmentOption: "LOCAL_PICKUP",
    flatShippingFee: null,
    city: "Toronto",
    region: "ON",
    postalCode: "M5V 2T6",
    latitude: 43.6532,
    longitude: -79.3832,
    description:
      "Leftover from a corporate office fit-out. All 40 boxes from the same dye lot — exact match guaranteed. Stored indoors, never opened.",
    status: "ACTIVE",
    createdAt: "2026-07-18T14:00:00.000Z",
    seller: {
      id: "seller-1",
      name: "Ontario Flooring Supply",
      accountType: "BUSINESS",
      businessName: "Ontario Flooring Supply Co.",
      businessVerifiedAt: "2026-05-01T00:00:00.000Z",
    },
    rating: { avg: 4.8, count: 23 },
  }),
  listing({
    id: "demo-2",
    title: "Mohawk SolidTech LVT — 300 sq ft, open box",
    manufacturer: "Mohawk",
    productLine: "SolidTech",
    colorName: "Weathered Oak",
    colorNumber: "WO-12",
    dyeLotNumber: null,
    materialType: "LVT_LVP",
    condition: "OPEN_BOX_SURPLUS",
    unitOfMeasure: "SQ_FT",
    quantity: 300,
    pricePerUnit: 3.5,
    currency: "CAD",
    listingType: "BEST_OFFER",
    minOfferPrice: 800,
    fulfillmentOption: "BOTH",
    flatShippingFee: 65,
    city: "Mississauga",
    region: "ON",
    postalCode: "L5B 1M2",
    latitude: 43.589,
    longitude: -79.6441,
    description:
      "Overstock from a condo renovation. A few boxes were opened to check the pattern but everything is unused. Great for a mid-size basement or rec room.",
    status: "ACTIVE",
    createdAt: "2026-07-15T09:30:00.000Z",
    seller: {
      id: "seller-2",
      name: "Priya Nair",
      accountType: "INDIVIDUAL",
      businessName: null,
      businessVerifiedAt: null,
    },
    rating: { avg: 5, count: 4 },
  }),
  listing({
    id: "demo-3",
    title: "Armstrong Rejuvenate laminate — 12 boxes",
    manufacturer: "Armstrong",
    productLine: "Rejuvenate",
    colorName: "Warm Ash",
    colorNumber: "WA-7",
    dyeLotNumber: "RJ-4471",
    materialType: "LAMINATE",
    condition: "NEW_SEALED_BOX",
    unitOfMeasure: "BOXES",
    quantity: 12,
    pricePerUnit: 18,
    currency: "CAD",
    listingType: "FIXED_PRICE",
    minOfferPrice: null,
    fulfillmentOption: "SELLER_SHIPPING",
    flatShippingFee: 40,
    city: "Ottawa",
    region: "ON",
    postalCode: "K1A 0B1",
    latitude: 45.4215,
    longitude: -75.6972,
    description: "Cancelled order from a client who switched to hardwood. Never left the warehouse.",
    status: "ACTIVE",
    createdAt: "2026-07-20T11:15:00.000Z",
    seller: {
      id: "seller-3",
      name: "Capital Reno Supply",
      accountType: "BUSINESS",
      businessName: "Capital Reno Supply",
      businessVerifiedAt: null,
    },
    rating: { avg: 4.2, count: 9 },
  }),
  listing({
    id: "demo-4",
    title: "Take-up red oak hardwood — 180 sq ft",
    manufacturer: "Mercier",
    productLine: "Nature",
    colorName: "Natural Red Oak",
    colorNumber: "RO-1",
    dyeLotNumber: null,
    materialType: "HARDWOOD",
    condition: "TAKE_UP_USED",
    unitOfMeasure: "SQ_FT",
    quantity: 180,
    pricePerUnit: 2.25,
    currency: "CAD",
    listingType: "FIXED_PRICE",
    minOfferPrice: null,
    fulfillmentOption: "LOCAL_PICKUP",
    flatShippingFee: null,
    city: "Hamilton",
    region: "ON",
    postalCode: "L8P 4Y1",
    latitude: 43.2557,
    longitude: -79.8711,
    description:
      "Removed carefully during a refinishing job — most boards are full length, no major damage. Priced to move, cash and carry only.",
    status: "ACTIVE",
    createdAt: "2026-07-10T16:45:00.000Z",
    seller: {
      id: "seller-4",
      name: "Dave Kowalski",
      accountType: "INDIVIDUAL",
      businessName: null,
      businessVerifiedAt: null,
    },
    rating: { avg: 4.5, count: 6 },
  }),
  listing({
    id: "demo-5",
    title: "Daltile porcelain tile — 6 pallets, close-out run",
    manufacturer: "Daltile",
    productLine: "Emerson Wood",
    colorName: "Gunstock",
    colorNumber: "EW-16",
    dyeLotNumber: "EW16-2026-03",
    materialType: "CERAMIC_PORCELAIN_TILE",
    condition: "NEW_SEALED_BOX",
    unitOfMeasure: "PALLETS",
    quantity: 6,
    pricePerUnit: 640,
    currency: "CAD",
    listingType: "BULK_LOT",
    minOfferPrice: null,
    fulfillmentOption: "SELLER_SHIPPING",
    flatShippingFee: 250,
    city: "Vaughan",
    region: "ON",
    postalCode: "L4K 1B1",
    latitude: 43.8361,
    longitude: -79.4985,
    description:
      "Discontinued color, distributor close-out. Sold as a single lot only — great for a contractor with a large job matching this run.",
    status: "ACTIVE",
    createdAt: "2026-07-05T08:00:00.000Z",
    seller: {
      id: "seller-1",
      name: "Ontario Flooring Supply",
      accountType: "BUSINESS",
      businessName: "Ontario Flooring Supply Co.",
      businessVerifiedAt: "2026-05-01T00:00:00.000Z",
    },
    rating: { avg: 4.8, count: 23 },
  }),
  listing({
    id: "demo-6",
    title: "Vinyl transition strips — 25 pieces, mixed finishes",
    manufacturer: "Schluter",
    productLine: "Reno-U",
    colorName: "Satin Nickel",
    colorNumber: "SN-9",
    dyeLotNumber: null,
    materialType: "TRIM_TRANSITION_PROFILE",
    condition: "NEW_SEALED_BOX",
    unitOfMeasure: "LINEAR_FT",
    quantity: 200,
    pricePerUnit: 1.75,
    currency: "CAD",
    listingType: "FIXED_PRICE",
    minOfferPrice: null,
    fulfillmentOption: "SELLER_SHIPPING",
    flatShippingFee: 15,
    city: "Barrie",
    region: "ON",
    postalCode: "L4M 1A1",
    latitude: 44.3894,
    longitude: -79.6903,
    description: "Extra stock from several small jobs. Mixed 4' and 8' lengths, all unused.",
    status: "SOLD",
    createdAt: "2026-06-28T13:20:00.000Z",
    seller: {
      id: "seller-5",
      name: "Trim & Transition Co.",
      accountType: "BUSINESS",
      businessName: "Trim & Transition Co.",
      businessVerifiedAt: null,
    },
    rating: { avg: 4, count: 2 },
  }),
];

export function getDemoListing(id: string) {
  return demoListings.find((l) => l.id === id) ?? null;
}

export function getDemoManufacturers() {
  return Array.from(new Set(demoListings.map((l) => l.manufacturer))).sort();
}

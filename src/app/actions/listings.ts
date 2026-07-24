"use server";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth-helpers";
import { createListingSchema, updateListingSchema } from "@/lib/validation/listing";
import { geocode } from "@/lib/geocoding";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createListing(input: unknown): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const { latitude, longitude } = await geocode(data.city, data.region, data.postalCode);

  const listing = await prisma.listing.create({
    data: {
      sellerId: session.user.id,
      title: data.title,
      manufacturer: data.manufacturer,
      productLine: data.productLine,
      colorName: data.colorName,
      colorNumber: data.colorNumber,
      dyeLotNumber: data.dyeLotNumber || null,
      materialType: data.materialType,
      condition: data.condition,
      unitOfMeasure: data.unitOfMeasure,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      totalPrice: data.pricePerUnit * data.quantity,
      currency: "CAD",
      listingType: data.listingType,
      minOfferPrice: data.listingType === "BEST_OFFER" ? data.minOfferPrice : null,
      fulfillmentOption: data.fulfillmentOption,
      flatShippingFee: data.fulfillmentOption === "LOCAL_PICKUP" ? null : data.flatShippingFee,
      city: data.city,
      region: data.region,
      postalCode: data.postalCode,
      latitude,
      longitude,
      description: data.description || null,
      status: "ACTIVE",
      images: {
        create: data.images.map((img, i) => ({ url: img.url, kind: img.kind, position: i })),
      },
    },
  });

  revalidatePath("/listings");
  revalidatePath("/account/listings");
  return { ok: true, id: listing.id };
}

export async function updateListing(listingId: string, input: unknown): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing || existing.sellerId !== session.user.id) {
    return { ok: false, error: "Listing not found" };
  }
  if (existing.status === "SOLD") {
    return { ok: false, error: "Cannot edit a sold listing" };
  }

  const parsed = updateListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const { latitude, longitude } = await geocode(data.city, data.region, data.postalCode);

  await prisma.$transaction([
    prisma.listingImage.deleteMany({ where: { listingId } }),
    prisma.listing.update({
      where: { id: listingId },
      data: {
        title: data.title,
        manufacturer: data.manufacturer,
        productLine: data.productLine,
        colorName: data.colorName,
        colorNumber: data.colorNumber,
        dyeLotNumber: data.dyeLotNumber || null,
        materialType: data.materialType,
        condition: data.condition,
        unitOfMeasure: data.unitOfMeasure,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalPrice: data.pricePerUnit * data.quantity,
        listingType: data.listingType,
        minOfferPrice: data.listingType === "BEST_OFFER" ? data.minOfferPrice : null,
        fulfillmentOption: data.fulfillmentOption,
        flatShippingFee: data.fulfillmentOption === "LOCAL_PICKUP" ? null : data.flatShippingFee,
        city: data.city,
        region: data.region,
        postalCode: data.postalCode,
        latitude,
        longitude,
        description: data.description || null,
        images: { create: data.images.map((img, i) => ({ url: img.url, kind: img.kind, position: i })) },
      },
    }),
  ]);

  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/account/listings");
  return { ok: true, id: listingId };
}

export async function removeListing(listingId: string): Promise<ActionResult> {
  const session = await requireVerifiedUser();
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing || existing.sellerId !== session.user.id) {
    return { ok: false, error: "Listing not found" };
  }
  await prisma.listing.update({ where: { id: listingId }, data: { status: "REMOVED" } });
  revalidatePath("/listings");
  revalidatePath("/account/listings");
  return { ok: true, id: listingId };
}

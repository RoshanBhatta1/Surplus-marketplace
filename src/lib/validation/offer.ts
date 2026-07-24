import { z } from "zod";

export const createOfferSchema = z.object({
  listingId: z.string().min(1),
  amount: z.coerce.number().positive("Offer must be greater than 0"),
});

export const respondOfferSchema = z.object({
  offerId: z.string().min(1),
  action: z.enum(["ACCEPT", "DECLINE", "COUNTER"]),
  counterAmount: z.coerce.number().positive().optional(),
});

import { z } from "zod";

export const startCheckoutSchema = z.object({
  listingId: z.string().min(1),
  fulfillmentMethod: z.enum(["LOCAL_PICKUP", "SELLER_SHIPPING"]),
  offerId: z.string().optional(),
});

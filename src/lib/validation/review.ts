import { z } from "zod";

export const submitReviewSchema = z.object({
  transactionId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

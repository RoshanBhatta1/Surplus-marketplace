import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(100),
    email: z.email("Enter a valid email").trim().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    accountType: z.enum(["INDIVIDUAL", "BUSINESS"]),
    phone: z.string().trim().min(7).max(20).optional().or(z.literal("")),
    businessName: z.string().trim().min(2).max(200).optional().or(z.literal("")),
    businessNumber: z.string().trim().min(3).max(50).optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.accountType !== "BUSINESS" ||
      (data.businessName && data.businessName.length > 0 && data.businessNumber && data.businessNumber.length > 0),
    {
      message: "Business name and business number are required for business accounts",
      path: ["businessName"],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

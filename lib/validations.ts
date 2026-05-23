import { z } from "zod";

const phonePattern = /^\+?[0-9\s()-]{8,20}$/;

export const quoteSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().regex(phonePattern, "Enter a valid phone number"),
  whatsapp: z.string().regex(phonePattern, "Enter a valid WhatsApp number").optional().or(z.literal("")),
  firm: z.string().optional(),
  city: z.string().min(2, "City is required"),
  productCode: z.string().optional(),
  quantity: z.string().optional(),
  message: z.string().optional()
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

export const productsQuerySchema = z.object({
  category: z.string().optional(),
  collection: z.string().optional(),
  finish: z.string().optional(),
  color_tone: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12)
});

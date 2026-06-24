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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Project brief / lead-gen capture. Only contact details are required so the
// strip stays low-friction; everything else helps us suggest materials.
export const projectBriefSchema = z.object({
  projectType: z.string().optional(),
  city: z.string().optional(),
  requiredMaterials: z.string().optional(),
  finishMood: z.string().optional(),
  timeline: z.string().optional(),
  phone: z.string().regex(phonePattern, "Enter a valid phone number"),
  email: z.string().regex(emailPattern, "Enter a valid email")
});

export type ProjectBriefValues = z.infer<typeof projectBriefSchema>;

export const productsQuerySchema = z.object({
  category: z.string().optional(),
  collection: z.string().optional(),
  finish: z.string().optional(),
  color_tone: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12)
});

import { z } from "zod";
import { MAX_QTY_PER_LINE } from "@/lib/site-config";
import { NIGERIAN_STATE_SET } from "@/lib/nigeria";

export const cartItemsSchema = z
  .array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
    }),
  )
  .min(1)
  .max(50);

const code = z
  .string()
  .trim()
  .max(40)
  .regex(/^[A-Za-z0-9_-]*$/, "Use letters, numbers, - or _ only.");

export const quoteSchema = z.object({
  items: cartItemsSchema,
  state: z.string().trim().max(40).optional(),
  code: code.optional(),
});

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2, "Enter the recipient's name.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a Nigerian mobile number, like 08031234567."),
  line1: z.string().trim().min(5, "Enter the street address.").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city or town.").max(60),
  state: z.string().trim().refine((state) => NIGERIAN_STATE_SET.has(state), "Choose a valid Nigerian state."),
});

export const placeOrderSchema = z.object({
  items: cartItemsSchema,
  address: addressSchema,
  discountCode: code.optional(),
  notes: z.string().trim().max(500).optional(),
  saveAddress: z.boolean(),
  idempotencyKey: z.string().uuid(),
});

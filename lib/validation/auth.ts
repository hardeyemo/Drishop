import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

// 72 is bcrypt's input limit, which Supabase uses.
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(80),
    email,
    password,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

export const forgotSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

// Nigerian mobile numbers: 0803..., 0703..., +234803...
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a Nigerian mobile number, like 08031234567.")
    .or(z.literal("")),
});

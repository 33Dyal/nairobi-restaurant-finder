import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const nameSchema = z.string().trim().min(2, "Enter your name.").max(80, "Use at most 80 characters.");

export const registerSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });

// Browser form adds a confirmation field that the API doesn't need.
export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(72) });
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resendVerificationSchema = z.object({ email: emailSchema });
export const tokenSchema = z.object({ token: z.string().min(20).max(200) });

export const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const resetPasswordFormSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Reset your password</h1>
      <p className="mb-6 mt-2 text-sm text-neutral-600">Enter your email and we&apos;ll send you a reset link.</p>
      <ForgotForm />
    </>
  );
}

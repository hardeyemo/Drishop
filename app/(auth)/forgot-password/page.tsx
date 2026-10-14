import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="break-words font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Reset your password</h1>
      <p className="mb-6 mt-2 text-sm text-neutral-600">Enter your email and we&apos;ll send you a reset link.</p>
      <ForgotForm />
    </>
  );
}

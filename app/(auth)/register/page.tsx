import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mb-6 mt-2 text-sm text-neutral-600">Save favourites and track your orders.</p>
      <RegisterForm next={safeNext(sp.next, "/")} />
    </>
  );
}

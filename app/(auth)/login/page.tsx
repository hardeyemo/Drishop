import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Sign in</h1>
      <p className="mb-6 mt-2 text-sm text-neutral-600">Welcome back. Sign in to see your wishlist and orders.</p>
      {sp.error === "callback" ? (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          That link has expired or was already used. Request a new one and try again.
        </p>
      ) : null}
      <LoginForm next={safeNext(sp.next)} />
    </>
  );
}

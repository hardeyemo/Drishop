import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { AccountNav } from "@/components/account/account-nav";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: { default: "My account", template: "%s | Shopora" } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser(); // defence in depth: middleware already redirects guests
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">My account</h1>
          {profile ? <p className="mt-1 text-sm text-neutral-600">{profile.fullName || profile.email}</p> : null}
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      </div>
      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}

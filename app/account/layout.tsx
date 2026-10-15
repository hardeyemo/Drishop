import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { AccountNav } from "@/components/account/account-nav";
import { Button } from "@/components/ui/button";
import { getUnreadNotificationCount } from "@/lib/data/account";

export const metadata: Metadata = { title: { default: "My account", template: "%s | Drishop" } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(); // defence in depth: middleware already redirects guests
  const [profile, unreadCount] = await Promise.all([getProfile(), getUnreadNotificationCount(user.id)]);

  return (
    <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-9 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">My account</h1>
          {profile ? <p className="mt-1 text-sm text-neutral-600">{profile.fullName || profile.email}</p> : null}
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      </div>
      <div className="grid min-w-0 gap-5 sm:gap-8 md:grid-cols-[180px_minmax(0,1fr)]">
        <AccountNav unreadCount={unreadCount} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function AccountPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/account");
  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-5 font-display text-xl font-bold">Profile</h2>
      <ProfileForm email={profile.email} fullName={profile.fullName} phone={profile.phone} />
    </section>
  );
}

import type { Metadata } from "next";
import { PasswordForm } from "@/components/account/password-form";

export const metadata: Metadata = { title: "Password" };

export default function SecurityPage() {
  return (
    <section aria-labelledby="pw-heading">
      <h2 id="pw-heading" className="mb-5 font-display text-xl font-bold">Change password</h2>
      <PasswordForm />
    </section>
  );
}

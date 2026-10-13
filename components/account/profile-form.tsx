"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";
import type { ActionState } from "@/lib/action-state";
import { Field } from "@/components/form/field";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";

export function ProfileForm({ email, fullName, phone }: { email: string; fullName: string; phone: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfile, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <FormMessage state={state} />
      <Field id="email" label="Email" value={email} readOnly disabled hint="Your sign-in email can't be changed here." />
      <Field id="fullName" name="fullName" label="Full name" autoComplete="name" required
        defaultValue={state.values?.fullName ?? fullName} error={e.fullName?.[0]} />
      <Field id="phone" name="phone" type="tel" label="Phone number" autoComplete="tel" inputMode="tel"
        defaultValue={state.values?.phone ?? phone} hint="Used for delivery updates. Optional." error={e.phone?.[0]} />
      <SubmitButton variant="primary" pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}

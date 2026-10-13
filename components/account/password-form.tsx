"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import type { ActionState } from "@/lib/action-state";
import { Field } from "@/components/form/field";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";

export function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(updatePassword, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <FormMessage state={state} />
      <Field id="password" name="password" type="password" label="New password" autoComplete="new-password" required
        hint="At least 8 characters, with a letter and a number." error={e.password?.[0]} />
      <Field id="confirm" name="confirm" type="password" label="Confirm new password" autoComplete="new-password" required
        error={e.confirm?.[0]} />
      <SubmitButton variant="primary" pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}

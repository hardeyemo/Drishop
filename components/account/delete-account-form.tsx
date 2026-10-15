"use client";

import { useActionState, useEffect } from "react";
import { deleteAccount } from "@/app/actions/account";
import type { ActionState } from "@/lib/action-state";
import { Field } from "@/components/form/field";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";

export function DeleteAccountForm({ requiresPassword }: { requiresPassword: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(deleteAccount, {});
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if (!state.ok) return;
    try {
      localStorage.removeItem("drishop-cart-v1");
      localStorage.removeItem("shopora-cart-v1");
      localStorage.removeItem("drishop-recently-viewed");
    } finally {
      window.location.replace("/");
    }
  }, [state.ok]);
  return (
    <form action={action} className="mt-5 max-w-md space-y-4" noValidate>
      <FormMessage state={state} />
      {requiresPassword ? (
        <Field id="delete-password" name="password" type="password" label="Current password" autoComplete="current-password" required error={errors.password?.[0]} />
      ) : (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">For security, your identity-provider sign-in must be from the last 10 minutes. Sign out and sign back in if it has expired.</p>
      )}
      <Field id="delete-confirmation" name="confirmation" label={'Type "DELETE MY ACCOUNT" to confirm'} autoComplete="off" required error={errors.confirmation?.[0]} />
      <SubmitButton variant="primary" pendingLabel="Deleting account…" className="bg-red-700 hover:bg-red-800 focus-visible:outline-red-700">
        Permanently delete my account
      </SubmitButton>
    </form>
  );
}

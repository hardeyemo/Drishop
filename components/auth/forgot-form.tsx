"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import type { ActionState } from "@/lib/action-state";
import { Field } from "@/components/form/field";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";

export function ForgotForm() {
  const [state, action] = useActionState<ActionState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field id="email" name="email" type="email" label="Email" autoComplete="email" required
        error={state.fieldErrors?.email?.[0]} />
      <SubmitButton variant="primary" size="lg" className="w-full" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-neutral-600 underline underline-offset-4">Back to sign in</Link>
      </p>
    </form>
  );
}

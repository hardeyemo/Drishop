"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import type { ActionState } from "@/lib/action-state";
import { Field } from "@/components/form/field";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionState, FormData>(register, {});
  const e = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <p className="text-sm text-neutral-600">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <Link href="/register" className="underline underline-offset-4">try again</Link>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field id="fullName" name="fullName" label="Full name" autoComplete="name" required
        defaultValue={state.values?.fullName} error={e.fullName?.[0]} />
      <Field id="email" name="email" type="email" label="Email" autoComplete="email" required
        defaultValue={state.values?.email} error={e.email?.[0]} />
      <Field id="password" name="password" type="password" label="Password" autoComplete="new-password" required
        hint="At least 8 characters, with a letter and a number." error={e.password?.[0]} />
      <Field id="confirm" name="confirm" type="password" label="Confirm password" autoComplete="new-password" required
        error={e.confirm?.[0]} />
      <SubmitButton variant="gold" size="lg" className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

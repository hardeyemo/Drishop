"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import type { ActionState } from "@/lib/action-state";
import { Field } from "@/components/form/field";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionState, FormData>(login, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field id="email" name="email" type="email" label="Email" autoComplete="email" required
        defaultValue={state.values?.email} error={e.email?.[0]} />
      <Field id="password" name="password" type="password" label="Password" autoComplete="current-password" required
        error={e.password?.[0]} />
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm text-gold-deep underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton variant="primary" size="lg" className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm text-neutral-600">
        New to Shopora?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}

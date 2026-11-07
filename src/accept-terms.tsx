"use client";

import * as React from "react";
import { AuthShell } from "./auth-shell";
import { TermsAcceptanceCheckbox } from "./legal-acceptance-checkbox";
import { Button } from "./ui/button";

export interface AcceptTermsFormProps {
  /** Server action (or any form action) that records the acceptance. */
  action: (formData: FormData) => void | Promise<void>;
  /** Already sanitised destination, e.g. via `safeRedirectPath`. Sent as the `next` field. */
  next: string;
  basePath?: string;
  submitLabel?: string;
  className?: string;
}

/** Checkbox plus submit; the button stays disabled until the box is ticked. */
export function AcceptTermsForm({
  action,
  next,
  basePath,
  submitLabel = "Continue",
  className,
}: AcceptTermsFormProps): React.ReactElement {
  const [checked, setChecked] = React.useState(false);
  return (
    <form action={action} className={className ?? "space-y-4"}>
      <input type="hidden" name="next" value={next} />
      <TermsAcceptanceCheckbox checked={checked} onCheckedChange={setChecked} basePath={basePath} />
      <Button type="submit" className="h-11 w-full" disabled={!checked}>
        {submitLabel}
      </Button>
    </form>
  );
}

export interface AcceptTermsPageProps extends AcceptTermsFormProps {
  wordmark?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Body for `app/legal/accept/page.tsx`. The kit's page must not run its own
 * legal gate: this is where the gate redirects to.
 */
export function AcceptTermsPage({
  wordmark,
  title = "Our terms have been updated",
  description = "Please review and accept before continuing.",
  ...form
}: AcceptTermsPageProps): React.ReactElement {
  return (
    <AuthShell wordmark={wordmark} title={title} subtitle={description}>
      <AcceptTermsForm {...form} />
    </AuthShell>
  );
}

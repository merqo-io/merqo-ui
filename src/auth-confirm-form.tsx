"use client";

import * as React from "react";
import { AsyncSubmitButton } from "./async-submit-button";
import type { AuthConfirmType } from "./auth/confirm";

export type AuthConfirmFormProps = {
  tokenHash: string;
  type: AuthConfirmType;
  /** Same-origin path to land on after verifying; the server sanitises it. */
  next?: string | null;
  /** Route that verifies the token on POST. Defaults to "/auth/confirm/verify". */
  action?: string;
  loginHref?: string;
  title?: string;
  body?: string;
  buttonLabel?: string;
  className?: string;
};

export type AuthConfirmInvalidProps = {
  loginHref?: string;
  title?: string;
  body?: string;
  loginLabel?: string;
  className?: string;
};

const COPY: Record<AuthConfirmType, { title: string; button: string }> = {
  recovery: { title: "Reset your password", button: "Continue" },
  signup: { title: "Confirm your email", button: "Confirm email" },
  email: { title: "Confirm your email", button: "Confirm email" },
  invite: { title: "Accept your invite", button: "Accept invite" },
  magiclink: { title: "Sign in", button: "Sign in" },
  email_change: { title: "Confirm your new email", button: "Confirm new email" },
};

const BUTTON_CLASS = "min-h-11 w-full rounded-xl font-semibold";
const LINK_CLASS =
  "inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline";

/**
 * Landing step for an emailed auth link. A plain POST form, so it works
 * without JavaScript; the token is only carried in hidden inputs because
 * email scanners pre-fetch the link and must not consume it.
 */
export function AuthConfirmForm({
  tokenHash,
  type,
  next,
  action = "/auth/confirm/verify",
  title,
  body,
  buttonLabel,
  className,
}: AuthConfirmFormProps) {
  const [pending, setPending] = React.useState(false);
  const copy = COPY[type];

  // A back-forward cache restore would otherwise keep the button disabled.
  React.useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form
      method="post"
      action={action}
      onSubmit={() => setPending(true)}
      className={className ?? "space-y-6 text-center"}
    >
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title ?? copy.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {body ?? "Press the button below to complete this step."}
        </p>
      </div>
      <AsyncSubmitButton pending={pending} className={BUTTON_CLASS}>
        {buttonLabel ?? copy.button}
      </AsyncSubmitButton>
    </form>
  );
}

/** Shown in place of the form for a missing or malformed link. */
export function AuthConfirmInvalid({
  loginHref = "/login",
  title = "This link is invalid or has expired.",
  body = "Request a new one from the sign in page.",
  loginLabel = "Back to sign in",
  className,
}: AuthConfirmInvalidProps) {
  return (
    <div className={className ?? "space-y-4 text-center"}>
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      <a href={loginHref} className={LINK_CLASS}>
        {loginLabel}
      </a>
    </div>
  );
}

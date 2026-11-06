"use client";

import * as React from "react";
import { GoogleMark } from "./google-mark";
import { rawErrorText } from "./auth-form-utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAsyncAction } from "./use-async-action";

export type LoginMode = "signin" | "signup";
export type LoginErrorContext = "signin" | "signup" | "oauth";
export type LoginCredentials = { email: string; password: string };

/** An error message to show, or nothing on success. A callback may also throw. */
type CallbackResult = string | void;

export type LoginFormProps = {
  onPasswordSignIn: (credentials: LoginCredentials) => Promise<CallbackResult>;
  /** Enables the "Create an account" toggle. */
  onPasswordSignUp?: (credentials: LoginCredentials) => Promise<CallbackResult>;
  /** Shows the Google button when given, unless `showGoogle` is false. */
  onGoogleSignIn?: () => Promise<CallbackResult>;
  showGoogle?: boolean;
  defaultMode?: LoginMode;
  onModeChange?: (mode: LoginMode) => void;
  forgotPasswordHref?: string;
  /**
   * Turns a returned error string, or a thrown error's `code` (else its
   * `message`), into copy for the vendor. Raw provider messages can leak
   * account state, so kits should map the codes they know.
   */
  mapError?: (raw: string, context: LoginErrorContext) => string;
  /** Message to show on first render, e.g. one carried back from an auth callback. */
  initialError?: string;
  className?: string;
};

const FALLBACK: Record<LoginErrorContext, string> = {
  signin: "Could not sign in. Try again.",
  signup: "Could not create your account. Try again.",
  oauth: "Could not sign in with Google. Try again.",
};

type Job = { context: LoginErrorContext; run: () => Promise<CallbackResult> };

function GoogleBlock({ pending, onClick }: { pending: boolean; onClick: () => void }) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={onClick}
        className="h-12 w-full gap-2.5 rounded-xl text-[0.95rem] font-medium"
      >
        <GoogleMark />
        Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          or with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

function ModeToggle({
  isSignin,
  pending,
  onClick,
}: {
  isSignin: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {isSignin ? "New here? " : "Already have an account? "}
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
      >
        {isSignin ? "Create an account" : "Sign in"}
      </button>
    </p>
  );
}

export function LoginForm({
  onPasswordSignIn,
  onPasswordSignUp,
  onGoogleSignIn,
  showGoogle = true,
  defaultMode = "signin",
  onModeChange,
  forgotPasswordHref,
  mapError,
  initialError,
  className,
}: LoginFormProps): React.ReactElement {
  const [mode, setMode] = React.useState<LoginMode>(
    onPasswordSignUp ? defaultMode : "signin",
  );
  const [message, setMessage] = React.useState<string | null | undefined>(initialError);
  const [lastContext, setLastContext] = React.useState<LoginErrorContext>("signin");

  const translate = React.useCallback(
    (raw: string | null, context: LoginErrorContext) => {
      if (raw === null) return FALLBACK[context];
      return mapError ? mapError(raw, context) : raw;
    },
    [mapError],
  );

  // Redirects are left to useAsyncAction so `pending` stays true while the
  // page leaves; only a string result is handled here.
  const execute = React.useCallback(
    async (job: Job) => {
      setLastContext(job.context);
      setMessage(null);
      const result = await job.run();
      if (result) setMessage(translate(result, job.context));
    },
    [translate],
  );
  const { pending, error, run } = useAsyncAction(execute);

  const submit = (job: Job) => {
    run(job).catch(() => {});
  };

  const thrown = error === null ? null : translate(rawErrorText(error), lastContext);
  const shown = message ?? thrown;

  const isSignin = mode === "signin";
  let submitLabel = "Create account";
  if (pending) submitLabel = "Please wait";
  else if (isSignin) submitLabel = "Sign in";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    if (isSignin || !onPasswordSignUp) {
      submit({ context: "signin", run: () => onPasswordSignIn(credentials) });
    } else {
      submit({ context: "signup", run: () => onPasswordSignUp(credentials) });
    }
  }

  function switchMode() {
    const next: LoginMode = isSignin ? "signup" : "signin";
    setMode(next);
    setMessage(null);
    onModeChange?.(next);
  }

  const labelClass = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <div className={className}>
      {onGoogleSignIn && showGoogle ? (
        <GoogleBlock
          pending={pending}
          onClick={() => submit({ context: "oauth", run: onGoogleSignIn })}
        />
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email" className={labelClass}>
            Email
          </Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            className="h-11 rounded-xl text-base"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password" className={labelClass}>
              Password
            </Label>
            {isSignin && forgotPasswordHref ? (
              <a
                href={forgotPasswordHref}
                className="inline-flex min-h-11 items-center text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            ) : null}
          </div>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete={isSignin ? "current-password" : "new-password"}
            required
            disabled={pending}
            className="h-11 rounded-xl text-base"
          />
        </div>
        {shown ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {shown}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {submitLabel}
        </Button>
      </form>

      {onPasswordSignUp ? (
        <ModeToggle isSignin={isSignin} pending={pending} onClick={switchMode} />
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import { GoogleMark } from "./google-mark";
import { rawErrorText, runOnce } from "./auth-form-utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAsyncAction } from "./use-async-action";

export type LoginMode = "signin" | "signup";
export type LoginErrorContext = "signin" | "signup" | "oauth" | "reset";
export type LoginCredentials = { email: string; password: string };

/**
 * An error message to show, `{ notice }` for a success message such as
 * "Check your email", or nothing on success. A callback may also throw.
 */
type CallbackResult = string | { notice: string } | void;

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
  /** Sends a reset link for the typed email; renders the forgot-password control as a button when no `forgotPasswordHref` is given. */
  onForgotPassword?: (email: string) => Promise<CallbackResult>;
  /** Renders the forgot-password link; pass `next/link`'s `Link` for client-side navigation. */
  LinkComponent?: React.ComponentType<LoginFormLinkProps>;
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
  reset: "Could not send the reset link. Try again.",
};

const ENTER_EMAIL = "Enter your email first.";

export type LoginFormLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

const ERROR_ID = "login-form-error";

function DefaultLink(props: LoginFormLinkProps) {
  return <a {...props} />;
}

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

function splitResult(result: CallbackResult): { error: string | null; notice: string | null } {
  if (typeof result === "string") return { error: result || null, notice: null };
  if (typeof result === "object") return { error: null, notice: result.notice };
  return { error: null, notice: null };
}

const FORGOT_CLASS =
  "inline-flex min-h-11 items-center text-xs font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

function CredentialFields({
  pending,
  invalid,
  isSignin,
  forgotHref,
  onForgot,
  Link,
  onChange,
}: {
  pending: boolean;
  invalid: boolean;
  isSignin: boolean;
  forgotHref: string | undefined;
  onForgot: (() => void) | undefined;
  Link: React.ComponentType<LoginFormLinkProps>;
  onChange: () => void;
}) {
  const aria = {
    "aria-invalid": invalid ? (true as const) : undefined,
    "aria-describedby": invalid ? ERROR_ID : undefined,
  };
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="login-email" className={LABEL_CLASS}>
          Email
        </Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          {...aria}
          onChange={onChange}
          className="h-11 rounded-xl text-base"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password" className={LABEL_CLASS}>
            Password
          </Label>
          {isSignin && forgotHref ? (
            <Link href={forgotHref} className={FORGOT_CLASS}>
              Forgot password?
            </Link>
          ) : null}
          {isSignin && !forgotHref && onForgot ? (
            <button type="button" disabled={pending} onClick={onForgot} className={FORGOT_CLASS}>
              Forgot password?
            </button>
          ) : null}
        </div>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete={isSignin ? "current-password" : "new-password"}
          required
          disabled={pending}
          {...aria}
          onChange={onChange}
          className="h-11 rounded-xl text-base"
        />
      </div>
    </>
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
  onForgotPassword,
  LinkComponent,
  mapError,
  initialError,
  className,
}: LoginFormProps): React.ReactElement {
  const [mode, setMode] = React.useState<LoginMode>(
    onPasswordSignUp ? defaultMode : "signin",
  );
  const [message, setMessage] = React.useState<string | null | undefined>(initialError);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [lastContext, setLastContext] = React.useState<LoginErrorContext>("signin");

  const Link = LinkComponent ?? DefaultLink;
  const inflight = React.useRef(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Provider strings and thrown errors can leak account state, so without a
  // kit-supplied mapError only the generic line is ever shown.
  const translate = React.useCallback(
    (raw: string | null, context: LoginErrorContext) =>
      mapError && raw !== null ? mapError(raw, context) : FALLBACK[context],
    [mapError],
  );

  // Redirects are left to useAsyncAction so `pending` stays true while the
  // page leaves; only a string result is handled here.
  const execute = React.useCallback(
    async (job: Job) => {
      setLastContext(job.context);
      setMessage(null);
      setNotice(null);
      const { error: text, notice: success } = splitResult(await job.run());
      if (text) setMessage(translate(text, job.context));
      setNotice(success);
    },
    [translate],
  );
  const { pending, error, run, reset } = useAsyncAction(execute);

  const submit = (job: Job) => runOnce(inflight, run, job);

  function clearError() {
    setMessage(null);
    setNotice(null);
    reset();
  }

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

  function forgot() {
    const email = String(new FormData(formRef.current ?? undefined).get("email") ?? "").trim();
    if (!email) setMessage(ENTER_EMAIL);
    else submit({ context: "reset", run: () => onForgotPassword!(email) });
  }

  function switchMode() {
    const next: LoginMode = isSignin ? "signup" : "signin";
    setMode(next);
    setMessage(null);
    setNotice(null);
    onModeChange?.(next);
  }

  return (
    <div className={className}>
      {onGoogleSignIn && showGoogle ? (
        <GoogleBlock
          pending={pending}
          onClick={() => submit({ context: "oauth", run: onGoogleSignIn })}
        />
      ) : null}

      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        <CredentialFields
          pending={pending}
          invalid={Boolean(shown)}
          isSignin={isSignin}
          forgotHref={forgotPasswordHref}
          onForgot={onForgotPassword ? forgot : undefined}
          Link={Link}
          onChange={clearError}
        />
        {shown ? (
          <p id={ERROR_ID} role="alert" className="text-sm font-medium text-destructive">
            {shown}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-sm font-medium text-foreground">
            {notice}
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

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
 * "Check your email", `{ error }` for a provider error object, or nothing on
 * success. A callback may also throw. `{ confirmEmail }` is honoured from
 * `onPasswordSignUp` only.
 */
type CallbackResult =
  | string
  | { notice: string }
  | { error: unknown }
  | { confirmEmail: string }
  | void;

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
  /**
   * Turns the value of a returned `{ error }` into copy. Separate from
   * `mapError` so existing `(raw: string, ctx) => string` mappers keep their
   * type. Without it an `{ error }` result shows the per-context fallback;
   * its content is never rendered.
   */
  mapErrorObject?: (error: unknown, context: LoginErrorContext) => string;
  /**
   * Shown instead of the per-context fallback when a callback throws a value
   * with no string `code` and no non-empty string `message` (a bare object, a
   * number). Throws with a `code` or `message` still go through `mapError` or
   * the fallback, and a thrown `null` or `undefined` shows nothing, as before.
   */
  connectErrorMessage?: string;
  /** Replaces "Enter your email first.", shown when forgot password is tapped with no email. */
  emailRequiredMessage?: string;
  /** Called with a returned `{ notice }` so the kit can show its own toast. */
  onNotice?: (notice: string) => void;
  /** `"none"` hides the inline notice, for kits that show it through `onNotice`. */
  noticeDisplay?: "inline" | "none";
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  /** Replaces the "New here?" and "Already have an account?" prompts. */
  modeTogglePrompt?: { signin: string; signup: string };
  /** Initial value of the email field. */
  defaultEmail?: string;
  /** Heading of the panel shown after sign-up returns `{ confirmEmail }`. */
  confirmEmailTitle?: string;
  /** Body of that panel; defaults to a sentence naming the address. */
  confirmEmailBody?: (email: string) => React.ReactNode;
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
  prompt,
  onClick,
}: {
  isSignin: boolean;
  pending: boolean;
  prompt: { signin: string; signup: string } | undefined;
  onClick: () => void;
}) {
  const signinPrompt = prompt?.signin ?? "New here?";
  const signupPrompt = prompt?.signup ?? "Already have an account?";
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {isSignin ? signinPrompt : signupPrompt}{" "}
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

type Split = {
  error: string | null;
  errorObject: { value: unknown } | null;
  notice: string | null;
  confirmEmail: string | null;
};

function splitResult(result: CallbackResult): Split {
  const none: Split = { error: null, errorObject: null, notice: null, confirmEmail: null };
  if (typeof result === "string") return { ...none, error: result || null };
  if (typeof result !== "object" || result === null) return none;
  if ("error" in result) return { ...none, errorObject: { value: result.error } };
  if ("confirmEmail" in result) return { ...none, confirmEmail: result.confirmEmail };
  return { ...none, notice: result.notice };
}

function Feedback({ error, notice }: { error: string | null | undefined; notice: string | null }) {
  return (
    <>
      {error ? (
        <p id={ERROR_ID} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm font-medium text-foreground">
          {notice}
        </p>
      ) : null}
    </>
  );
}

function announce(notice: string | null, onNotice: ((notice: string) => void) | undefined) {
  if (notice !== null) onNotice?.(notice);
}

function resultMessage(
  result: Split,
  context: LoginErrorContext,
  translate: (raw: string | null, context: LoginErrorContext) => string,
  mapErrorObject: LoginFormProps["mapErrorObject"],
): string | null {
  if (result.error) return translate(result.error, context);
  if (!result.errorObject) return null;
  return mapErrorObject ? mapErrorObject(result.errorObject.value, context) : FALLBACK[context];
}

function thrownMessage(
  error: unknown,
  context: LoginErrorContext,
  translate: (raw: string | null, context: LoginErrorContext) => string,
  connectErrorMessage: string | undefined,
): string {
  const text = rawErrorText(error);
  if (text === null && connectErrorMessage) return connectErrorMessage;
  return translate(text, context);
}

function ConfirmPanel({
  email,
  title = "Check your email",
  renderBody,
  onBack,
}: {
  email: string;
  title: string | undefined;
  renderBody: ((email: string) => React.ReactNode) | undefined;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <div role="status" className="text-sm text-muted-foreground">
        {renderBody ? (
          renderBody(email)
        ) : (
          <>We sent a confirmation link to {email}. Open it to finish setting up.</>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className="min-h-11 w-full rounded-xl font-semibold"
      >
        Back to sign in
      </Button>
    </div>
  );
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
  emailRef,
  defaultEmail,
  emailPlaceholder,
  passwordPlaceholder,
}: {
  emailRef: React.RefObject<HTMLInputElement | null>;
  defaultEmail: string | undefined;
  emailPlaceholder: string | undefined;
  passwordPlaceholder: string | undefined;
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
          ref={emailRef}
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
          placeholder={emailPlaceholder}
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
          placeholder={passwordPlaceholder}
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
  mapErrorObject,
  connectErrorMessage,
  emailRequiredMessage,
  onNotice,
  noticeDisplay,
  emailPlaceholder,
  passwordPlaceholder,
  modeTogglePrompt,
  defaultEmail,
  confirmEmailTitle,
  confirmEmailBody,
  initialError,
  className,
}: LoginFormProps): React.ReactElement {
  const [mode, setMode] = React.useState<LoginMode>(
    onPasswordSignUp ? defaultMode : "signin",
  );
  const [message, setMessage] = React.useState<string | null | undefined>(initialError);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [lastContext, setLastContext] = React.useState<LoginErrorContext>("signin");
  const [confirmEmail, setConfirmEmail] = React.useState<string | null>(null);
  // The form unmounts behind the confirmation panel, so the typed address is
  // carried here to refill the field on return.
  const [emailValue, setEmailValue] = React.useState(defaultEmail);

  const Link = LinkComponent ?? DefaultLink;
  const inflight = React.useRef(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

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
      const result = splitResult(await job.run());
      const failure = resultMessage(result, job.context, translate, mapErrorObject);
      if (failure) setMessage(failure);
      if (result.confirmEmail !== null && job.context === "signup") {
        setConfirmEmail(result.confirmEmail);
      }
      setNotice(result.notice);
      announce(result.notice, onNotice);
    },
    [translate, mapErrorObject, onNotice],
  );
  const { pending, error, run, reset } = useAsyncAction(execute);

  const submit = (job: Job) => runOnce(inflight, run, job);

  function clearError() {
    setMessage(null);
    setNotice(null);
    reset();
  }

  const thrown =
    error === null ? null : thrownMessage(error, lastContext, translate, connectErrorMessage);
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
      setEmailValue(credentials.email);
      submit({ context: "signup", run: () => onPasswordSignUp(credentials) });
    }
  }

  function forgot() {
    const email = String(new FormData(formRef.current ?? undefined).get("email") ?? "").trim();
    if (!email) {
      setMessage(emailRequiredMessage ?? ENTER_EMAIL);
      emailRef.current?.focus();
    } else submit({ context: "reset", run: () => onForgotPassword!(email) });
  }

  function switchMode() {
    const next: LoginMode = isSignin ? "signup" : "signin";
    setMode(next);
    setMessage(null);
    setNotice(null);
    changed(next);
  }

  function changed(next: LoginMode) {
    onModeChange?.(next);
  }

  function backToSignin() {
    setConfirmEmail(null);
    setMode("signin");
    changed("signin");
  }

  if (confirmEmail !== null) {
    return (
      <div className={className}>
        <ConfirmPanel
          email={confirmEmail}
          title={confirmEmailTitle}
          renderBody={confirmEmailBody}
          onBack={backToSignin}
        />
      </div>
    );
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
          emailRef={emailRef}
          defaultEmail={emailValue}
          emailPlaceholder={emailPlaceholder}
          passwordPlaceholder={passwordPlaceholder}
        />
        <Feedback error={shown} notice={noticeDisplay === "none" ? null : notice} />
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
        <ModeToggle
          isSignin={isSignin}
          pending={pending}
          prompt={modeTogglePrompt}
          onClick={switchMode}
        />
      ) : null}
    </div>
  );
}

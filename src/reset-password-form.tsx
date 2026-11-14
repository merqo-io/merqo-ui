"use client";

import * as React from "react";
import { AUTH_ERROR_FALLBACKS } from "./auth-error-message";
import { rawErrorText, runOnce } from "./auth-form-utils";
import { isRedirectError } from "./redirect-error";
import { FORM_ERROR_CLASS, FORM_LABEL_CLASS } from "./form-field";
import type { LoginFormLinkProps } from "./login-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAsyncAction } from "./use-async-action";

export type ResetPasswordState = "checking" | "ready" | "expired" | "failed";

/**
 * An error message to show, `{ error }` for a provider error object, or
 * nothing on success. `onSubmit` may also throw.
 */
type SubmitResult = string | { error: unknown } | void;

export type ResetPasswordFormProps = {
  /** Called with the new password once validation passes. The kit toasts and redirects here. */
  onSubmit: (password: string) => SubmitResult | Promise<SubmitResult>;
  /** Controlled by the kit; defaults to `"ready"`. */
  state?: ResetPasswordState;
  /** Called by the "Try again" button of the `"failed"` panel, which is hidden without it. */
  onRetry?: () => void;
  /** Turns a returned string, or a thrown error's `code` (else `message`), into copy. */
  mapError?: (raw: string) => string;
  /** Turns a returned `{ error }` into copy. Its content is never rendered otherwise. */
  mapErrorObject?: (error: unknown) => string;
  /** Shown when no mapper produces copy. Raw thrown text is never rendered. */
  errorFallback?: string;
  minLength?: number;
  maxLength?: number;
  tooShortMessage?: string;
  tooLongMessage?: string;
  mismatchMessage?: string;
  title?: string;
  subtitle?: string;
  passwordLabel?: string;
  confirmLabel?: string;
  submitLabel?: string;
  pendingLabel?: string;
  checkingLabel?: string;
  expiredTitle?: string;
  expiredBody?: string;
  failedTitle?: string;
  failedBody?: string;
  signInHref?: string;
  signInLabel?: string;
  /** Renders the sign-in link; pass `next/link`'s `Link` for client-side navigation. */
  LinkComponent?: React.ComponentType<LoginFormLinkProps>;
  className?: string;
};

type FieldError = { field: "password" | "confirm"; message: string };

const LINK_CLASS =
  "inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline";
const INPUT_CLASS = "h-11 rounded-xl text-base";

function DefaultLink(props: LoginFormLinkProps) {
  return <a {...props} />;
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  // The panel replaces a form or a spinner line, so focus would otherwise be
  // lost; the heading also gets the panel announced to screen readers.
  React.useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className="font-display text-2xl font-bold tracking-tight outline-none"
    >
      {children}
    </h2>
  );
}

type Mappers = Pick<ResetPasswordFormProps, "mapError" | "mapErrorObject" | "errorFallback">;

// A throwing mapper must not unmount the form, and its text must not reach
// the page, so every mapper call falls back to the generic line.
function mapped(map: () => string | undefined, fallback: string): string {
  try {
    return map() || fallback;
  } catch {
    return fallback;
  }
}

function resolveMessage(result: SubmitResult, m: Mappers): string | null {
  const fallback = m.errorFallback ?? AUTH_ERROR_FALLBACKS.update;
  if (typeof result === "string") {
    return result ? mapped(() => m.mapError?.(result), fallback) : null;
  }
  if (typeof result === "object" && result !== null && "error" in result) {
    return mapped(() => m.mapErrorObject?.(result.error), fallback);
  }
  return null;
}

function thrownMessage(error: unknown, m: Mappers): string {
  const text = rawErrorText(error);
  const fallback = m.errorFallback ?? AUTH_ERROR_FALLBACKS.update;
  return mapped(() => (text === null ? undefined : m.mapError?.(text)), fallback);
}

function validate(
  password: string,
  confirm: string,
  props: ResetPasswordFormProps,
): FieldError | null {
  const { minLength = 8, maxLength } = props;
  if (password.length < minLength) {
    return {
      field: "password",
      message: props.tooShortMessage ?? `Use at least ${minLength} characters.`,
    };
  }
  if (maxLength !== undefined && password.length > maxLength) {
    return {
      field: "password",
      message: props.tooLongMessage ?? `Use at most ${maxLength} characters.`,
    };
  }
  if (password !== confirm) {
    return { field: "confirm", message: props.mismatchMessage ?? "Passwords do not match." };
  }
  return null;
}

function FormHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <>
      {title ? <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2> : null}
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
    </>
  );
}

function SignInLink({ props, className }: { props: ResetPasswordFormProps; className?: string }) {
  const { signInHref, signInLabel = "Back to sign in", LinkComponent } = props;
  const Link = LinkComponent ?? DefaultLink;
  if (!signInHref) return null;
  const link = (
    <Link href={signInHref} className={LINK_CLASS}>
      {signInLabel}
    </Link>
  );
  return className ? <div className={className}>{link}</div> : link;
}

function StatePanel({ props }: { props: ResetPasswordFormProps }) {
  const {
    state,
    onRetry,
    expiredTitle = "This link has expired",
    expiredBody = "Reset links work once and expire quickly. Request a new one from the sign-in page.",
    failedTitle = "Could not check your reset link",
    failedBody = "Check your connection and try again.",
  } = props;
  const expired = state === "expired";
  return (
    <div className="space-y-4 text-center">
      <PanelHeading>{expired ? expiredTitle : failedTitle}</PanelHeading>
      <p className="text-sm text-muted-foreground">{expired ? expiredBody : failedBody}</p>
      {!expired && onRetry ? (
        <Button
          type="button"
          onClick={onRetry}
          className="min-h-11 w-full rounded-xl font-semibold"
        >
          Try again
        </Button>
      ) : null}
      <SignInLink props={props} />
    </div>
  );
}

function PasswordField({
  label,
  name,
  id,
  inputRef,
  disabled,
  invalid,
  describedBy,
  errorId,
  errorText,
  onChange,
}: {
  label: string;
  name: string;
  id: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  invalid: boolean;
  describedBy: string | undefined;
  errorId: string;
  errorText: string | undefined;
  onChange: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={FORM_LABEL_CLASS}>
        {label}
      </Label>
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="password"
        autoComplete="new-password"
        required
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onChange={onChange}
        className={INPUT_CLASS}
      />
      {errorText ? (
        <p id={errorId} className={FORM_ERROR_CLASS}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton({ props, pending }: { props: ResetPasswordFormProps; pending: boolean }) {
  const { submitLabel = "Update password", pendingLabel = "Updating…" } = props;
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-12 w-full rounded-xl text-base font-semibold"
    >
      {pending ? pendingLabel : submitLabel}
    </Button>
  );
}

function ReadyForm({ props }: { props: ResetPasswordFormProps }) {
  const {
    onSubmit,
    mapError,
    mapErrorObject,
    errorFallback,
  } = props;

  const id = React.useId();
  const passwordErrorId = `${id}-password-error`;
  const confirmErrorId = `${id}-confirm-error`;
  const submitErrorId = `${id}-submit-error`;

  const [fieldError, setFieldError] = React.useState<FieldError | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const inflight = React.useRef(false);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);

  const execute = React.useCallback(
    async (password: string) => {
      setMessage(null);
      const mappers = { mapError, mapErrorObject, errorFallback };
      try {
        setMessage(resolveMessage(await onSubmit(password), mappers));
      } catch (err) {
        // A redirect means the page is leaving; useAsyncAction keeps pending.
        if (isRedirectError(err)) throw err;
        setMessage(thrownMessage(err, mappers));
      }
    },
    [onSubmit, mapError, mapErrorObject, errorFallback],
  );
  const { pending, run } = useAsyncAction(execute);

  function clearErrors() {
    setFieldError(null);
    setMessage(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const invalid = validate(password, confirm, props);
    setFieldError(invalid);
    if (invalid) {
      (invalid.field === "password" ? passwordRef : confirmRef).current?.focus();
      return;
    }
    runOnce(inflight, run, password);
  }

  const shown = message;
  const passwordText = fieldError?.field === "password" ? fieldError.message : undefined;
  const confirmText = fieldError?.field === "confirm" ? fieldError.message : undefined;
  const submitDescribedBy = shown ? submitErrorId : undefined;

  return (
    <>
      <FormHeader title={props.title} subtitle={props.subtitle} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <PasswordField
          label={props.passwordLabel ?? "New password"}
          name="password"
          id={`${id}-password`}
          inputRef={passwordRef}
          disabled={pending}
          invalid={Boolean(passwordText ?? shown)}
          describedBy={passwordText ? passwordErrorId : submitDescribedBy}
          errorId={passwordErrorId}
          errorText={passwordText}
          onChange={clearErrors}
        />
        <PasswordField
          label={props.confirmLabel ?? "Confirm password"}
          name="confirm"
          id={`${id}-confirm`}
          inputRef={confirmRef}
          disabled={pending}
          invalid={Boolean(confirmText)}
          describedBy={confirmText ? confirmErrorId : undefined}
          errorId={confirmErrorId}
          errorText={confirmText}
          onChange={clearErrors}
        />
        {shown ? (
          <p id={submitErrorId} role="alert" className={FORM_ERROR_CLASS}>
            {shown}
          </p>
        ) : null}
        <SubmitButton props={props} pending={pending} />
      </form>
      <SignInLink props={props} className="mt-4 text-center" />
    </>
  );
}

export function ResetPasswordForm(props: ResetPasswordFormProps): React.ReactElement {
  const { state = "ready", checkingLabel = "Checking your reset link…", className } = props;
  let content: React.ReactNode;
  if (state === "checking") {
    content = (
      <p role="status" className="text-center text-sm text-muted-foreground">
        {checkingLabel}
      </p>
    );
  } else if (state === "ready") {
    content = <ReadyForm props={props} />;
  } else {
    content = <StatePanel props={props} />;
  }
  return <div className={className}>{content}</div>;
}

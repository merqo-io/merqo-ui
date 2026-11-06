"use client";

import * as React from "react";
import { rawErrorText } from "./auth-form-utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAsyncAction } from "./use-async-action";

export type MfaEnrolment = {
  /** Image source for the QR code; providers return a data: URL. */
  qr: string;
  /** Manual-entry key for when the QR code cannot be scanned. */
  secret: string;
  /** Passed back to `onVerify` for a factor created during this session. */
  factorId?: string;
};

export type MfaFormProps = {
  /** Whether the account already has a verified authenticator. */
  hasFactor: boolean;
  /** Starts enrolment. Return the QR details, or an error message. */
  onEnrol?: () => Promise<MfaEnrolment | string>;
  /** Check the code. Return an error message, or nothing on success. */
  onVerify: (code: string, context: { factorId?: string }) => Promise<string | void>;
  /** Sign out or step back. Shown as a secondary button when given. */
  onCancel?: () => Promise<string | void>;
  cancelLabel?: string;
  /** Copy above the "Set up authenticator" button. */
  enrolIntro?: React.ReactNode;
  /** Translates a thrown error's `code` (else `message`) into copy for the vendor. */
  mapError?: (raw: string) => string;
  className?: string;
};

const CODE = /^\d{6}$/;

const DEFAULT_ENROL_INTRO =
  "Admin access needs an authenticator app. Set one up once, then enter its code each time you sign in.";

const COPY = {
  short: "Enter the 6-digit code from your authenticator app.",
  verify: "That code did not work. Check the time on your phone and try again.",
  enrol: "Could not start setup. Try again.",
  cancel: "Could not sign out. Try again.",
};

type Job = { kind: keyof typeof COPY; run: () => Promise<void> };

export function MfaForm({
  hasFactor,
  onEnrol,
  onVerify,
  onCancel,
  cancelLabel = "Sign out",
  enrolIntro = DEFAULT_ENROL_INTRO,
  mapError,
  className,
}: MfaFormProps): React.ReactElement {
  const [enrolment, setEnrolment] = React.useState<MfaEnrolment | null>(null);
  const [code, setCode] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [lastKind, setLastKind] = React.useState<keyof typeof COPY>("verify");

  const translate = (raw: string | null, kind: keyof typeof COPY) => {
    if (raw === null) return COPY[kind];
    return mapError ? mapError(raw) : raw;
  };

  // A redirect thrown by a callback is left to useAsyncAction so `pending`
  // stays true while the page leaves.
  const execute = React.useCallback(async (job: Job) => {
    setLastKind(job.kind);
    setMessage(null);
    await job.run();
  }, []);
  const { pending, error, run } = useAsyncAction(execute);

  const submit = (job: Job) => {
    run(job).catch(() => {});
  };

  const shown =
    message ?? (error !== null ? translate(rawErrorText(error), lastKind) : null);

  const showMessage = (result: string | void) => {
    if (typeof result === "string" && result) setMessage(result);
  };

  const hasForm = hasFactor || enrolment !== null;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!CODE.test(code)) {
      setMessage(COPY.short);
      return;
    }
    submit({
      kind: "verify",
      run: async () =>
        showMessage(
          await onVerify(code, enrolment?.factorId ? { factorId: enrolment.factorId } : {}),
        ),
    });
  }

  const cancel = onCancel ? (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        submit({ kind: "cancel", run: async () => showMessage(await onCancel()) })
      }
      className="h-11 w-full rounded-xl"
    >
      {cancelLabel}
    </Button>
  ) : null;

  const alert = shown ? (
    <p role="alert" className="text-sm text-destructive">
      {shown}
    </p>
  ) : null;

  if (!hasForm) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{enrolIntro}</p>
          <Button
            type="button"
            disabled={pending || !onEnrol}
            onClick={() => {
              if (!onEnrol) return;
              submit({
                kind: "enrol",
                run: async () => {
                  const result = await onEnrol();
                  if (typeof result === "string") setMessage(result);
                  else setEnrolment(result);
                },
              });
            }}
            className="h-11 w-full rounded-xl"
          >
            Set up authenticator
          </Button>
          {alert}
          {cancel}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="space-y-4">
        {enrolment ? (
          <div className="space-y-2">
            {/* A plain img: providers return a data: URL, so there is nothing to optimise. */}
            <img src={enrolment.qr} alt="Authenticator QR code" className="mx-auto size-44" />
            <p className="text-center text-xs text-muted-foreground">
              Can&rsquo;t scan? Enter this key instead:
            </p>
            <code className="block break-all text-center text-sm">{enrolment.secret}</code>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="mfa-code">6-digit code</Label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            disabled={pending}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="h-11 rounded-xl text-base"
          />
        </div>
        {alert}
        <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl">
          {pending && lastKind === "verify" ? "Verifying" : "Verify"}
        </Button>
        {cancel}
      </form>
    </div>
  );
}

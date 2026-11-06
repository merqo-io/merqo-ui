"use client";

import * as React from "react";
import { rawErrorText, runOnce } from "./auth-form-utils";
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

type Job = { kind: keyof typeof COPY; run: (kind: keyof typeof COPY) => Promise<void> };

const ERROR_ID = "mfa-form-error";

function isImageDataUrl(value: string): boolean {
  return value.startsWith("data:image/");
}

function EnrolmentDetails({ enrolment }: { enrolment: MfaEnrolment }) {
  return (
    <div className="space-y-2">
      {/* Only data:image/ sources render: the value comes from a callback, and any other URL would load a remote image. */}
      {isImageDataUrl(enrolment.qr) ? (
        <img src={enrolment.qr} alt="Authenticator QR code" className="mx-auto size-44" />
      ) : null}
      <p className="text-center text-xs text-muted-foreground">
        Can&rsquo;t scan? Enter this key instead:
      </p>
      <code className="block break-all text-center text-sm">{enrolment.secret}</code>
    </div>
  );
}

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

  const inflight = React.useRef(false);

  // Provider strings and thrown errors can leak account state, so without a
  // kit-supplied mapError only the generic line is ever shown.
  const translate = React.useCallback(
    (raw: string | null, kind: keyof typeof COPY) =>
      mapError && raw !== null ? mapError(raw) : COPY[kind],
    [mapError],
  );

  // A redirect thrown by a callback is left to useAsyncAction so `pending`
  // stays true while the page leaves.
  const execute = React.useCallback(async (job: Job) => {
    setLastKind(job.kind);
    setMessage(null);
    await job.run(job.kind);
  }, []);
  const { pending, error, run, reset } = useAsyncAction(execute);

  const submit = (job: Job) => runOnce(inflight, run, job);

  function clearError() {
    setMessage(null);
    reset();
  }

  const shown =
    message ?? (error !== null ? translate(rawErrorText(error), lastKind) : null);

  const showMessage = (result: string | void, kind: keyof typeof COPY) => {
    if (typeof result === "string" && result) setMessage(translate(result, kind));
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
      run: async (kind) =>
        showMessage(
          await onVerify(code, enrolment?.factorId ? { factorId: enrolment.factorId } : {}),
          kind,
        ),
    });
  }

  const cancel = onCancel ? (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        submit({ kind: "cancel", run: async (kind) => showMessage(await onCancel(), kind) })
      }
      className="h-11 w-full rounded-xl"
    >
      {cancelLabel}
    </Button>
  ) : null;

  const alert = shown ? (
    <p id={ERROR_ID} role="alert" className="text-sm text-destructive">
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
                run: async (kind) => {
                  const result = await onEnrol();
                  if (typeof result === "string") showMessage(result, kind);
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
          <EnrolmentDetails enrolment={enrolment} />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="mfa-code">6-digit code</Label>
          <Input
            id="mfa-code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            placeholder="123456"
            disabled={pending}
            value={code}
            aria-invalid={shown ? true : undefined}
            aria-describedby={shown ? ERROR_ID : undefined}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              clearError();
            }}
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

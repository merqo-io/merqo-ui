/**
 * "reset" is sending the reset link; "update" is setting the new password.
 * The first four match `LoginForm`'s error context so a mapper can be passed
 * to `mapErrorObject` directly.
 */
export type AuthErrorContext = "signin" | "signup" | "oauth" | "reset" | "update";

export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_exists"
  | "weak_password"
  | "same_password"
  | "rate_limited"
  | "mfa_code"
  | "network";

export const AUTH_ERROR_MESSAGES: Readonly<Record<AuthErrorKind, string>> = Object.freeze({
  invalid_credentials: "Email or password is wrong. Try again or reset your password.",
  email_not_confirmed: "Confirm your email first. Check your inbox for the link.",
  email_exists: "That email already has an account. Sign in instead.",
  weak_password: "Pick a longer password.",
  same_password: "Pick a password you are not using now.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  mfa_code: "That code did not work. Enter the latest code from your app.",
  network: "Check your connection and try again.",
});

export const AUTH_ERROR_FALLBACKS: Readonly<Record<AuthErrorContext, string>> = Object.freeze({
  signin: "Could not sign in. Try again.",
  signup: "Could not create your account. Try again.",
  oauth: "Could not sign in with Google. Try again.",
  reset: "Could not send the reset link. Try again.",
  update: "Could not update your password. Try again.",
});

type Rule = {
  kind: AuthErrorKind;
  codes?: string[];
  status?: number;
  name?: string;
  message?: RegExp;
};

const RULES: Rule[] = [
  {
    kind: "invalid_credentials",
    codes: ["invalid_credentials"],
    message: /invalid login credentials/i,
  },
  { kind: "email_not_confirmed", codes: ["email_not_confirmed"], message: /email not confirmed/i },
  {
    kind: "email_exists",
    codes: ["user_already_exists", "email_exists"],
    message: /already (been )?registered|already exists/i,
  },
  {
    kind: "weak_password",
    codes: ["weak_password"],
    message: /password should be at least|weak password|easy to guess/i,
  },
  {
    kind: "same_password",
    codes: ["same_password"],
    message: /should be different from the old password/i,
  },
  {
    kind: "rate_limited",
    codes: ["over_request_rate_limit", "over_email_send_rate_limit"],
    status: 429,
    message: /rate limit|too many requests|security purposes/i,
  },
  {
    kind: "mfa_code",
    codes: ["mfa_verification_failed", "mfa_challenge_expired"],
    message: /(invalid|expired).*(totp|mfa|code)/i,
  },
  {
    kind: "network",
    name: "AuthRetryableFetchError",
    status: 0,
    message: /failed to fetch|network/i,
  },
];

type Fields = { code?: string; status?: number; name?: string; message?: string };

function fieldsOf(error: unknown): Fields {
  if (typeof error === "string") return { message: error };
  if (typeof error !== "object" || error === null) return {};
  const { code, status, name, message } = error as Record<string, unknown>;
  return {
    code: typeof code === "string" ? code : undefined,
    status: typeof status === "number" ? status : undefined,
    name: typeof name === "string" ? name : undefined,
    message: typeof message === "string" ? message : undefined,
  };
}

/** Classifies a Supabase-style auth error by code, then status, name and message. */
export function authErrorKind(error: unknown): AuthErrorKind | null {
  const { code, status, name, message } = fieldsOf(error);
  const find = (test: (rule: Rule) => boolean) => RULES.find(test)?.kind ?? null;
  return (
    (code === undefined ? null : find((r) => r.codes?.includes(code) ?? false)) ??
    (status === undefined ? null : find((r) => r.status === status)) ??
    (name === undefined ? null : find((r) => r.name === name)) ??
    (message === undefined ? null : find((r) => r.message?.test(message) ?? false))
  );
}

export type AuthErrorMessageOptions = {
  overrides?: Partial<Record<AuthErrorKind, string>>;
  fallback?: string;
};

/**
 * Friendly copy for an auth error. Raw provider text can leak account state,
 * so it is never returned, and the result is never an empty string.
 */
export function authErrorMessage(
  error: unknown,
  context: AuthErrorContext,
  options: AuthErrorMessageOptions = {},
): string {
  const kind = authErrorKind(error);
  if (kind) return options.overrides?.[kind] || AUTH_ERROR_MESSAGES[kind];
  return options.fallback || AUTH_ERROR_FALLBACKS[context];
}

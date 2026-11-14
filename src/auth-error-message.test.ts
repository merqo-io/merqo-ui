import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AUTH_ERROR_FALLBACKS,
  AUTH_ERROR_MESSAGES,
  authErrorKind,
  authErrorMessage,
  type AuthErrorContext,
  type AuthErrorKind,
} from "./auth-error-message";
import type { LoginFormProps } from "./login-form";

const BY_CODE: Array<[string, AuthErrorKind]> = [
  ["invalid_credentials", "invalid_credentials"],
  ["email_not_confirmed", "email_not_confirmed"],
  ["user_already_exists", "email_exists"],
  ["email_exists", "email_exists"],
  ["weak_password", "weak_password"],
  ["same_password", "same_password"],
  ["over_request_rate_limit", "rate_limited"],
  ["over_email_send_rate_limit", "rate_limited"],
  ["mfa_verification_failed", "mfa_code"],
  ["mfa_challenge_expired", "mfa_code"],
];

const BY_MESSAGE: Array<[string, AuthErrorKind]> = [
  ["Invalid login credentials", "invalid_credentials"],
  ["Email not confirmed", "email_not_confirmed"],
  ["User already registered", "email_exists"],
  ["A user has already been registered", "email_exists"],
  ["Account already exists", "email_exists"],
  ["Password should be at least 6 characters", "weak_password"],
  ["Weak password", "weak_password"],
  ["This password is easy to guess", "weak_password"],
  ["New password should be different from the old password.", "same_password"],
  ["Email rate limit exceeded", "rate_limited"],
  ["Too many requests", "rate_limited"],
  ["For security purposes, you can only request this after 20 seconds", "rate_limited"],
  ["Invalid TOTP code entered", "mfa_code"],
  ["Expired MFA code", "mfa_code"],
  ["TypeError: Failed to fetch", "network"],
  ["Network request failed", "network"],
  ["NetworkError when attempting to fetch resource.", "network"],
  ["Load failed", "network"],
  ["TOTP code is invalid", "mfa_code"],
];

describe("authErrorKind", () => {
  it.each(BY_CODE)("matches code %s", (code, kind) => {
    expect(authErrorKind({ code, message: "irrelevant" })).toBe(kind);
  });

  it.each(BY_MESSAGE)("matches message %s", (message, kind) => {
    expect(authErrorKind({ message })).toBe(kind);
    expect(authErrorKind(new Error(message))).toBe(kind);
    expect(authErrorKind(message)).toBe(kind);
  });

  it("matches rate limiting by status 429", () => {
    expect(authErrorKind({ status: 429, message: "x" })).toBe("rate_limited");
  });

  it("matches network by name", () => {
    expect(authErrorKind({ name: "AuthRetryableFetchError", message: "x" })).toBe("network");
  });

  it("does not treat a bare status 0 as network", () => {
    expect(authErrorKind({ status: 0 })).toBeNull();
    expect(authErrorKind({ status: 0, code: "invalid_credentials" })).toBe("invalid_credentials");
  });

  it("does not treat a loose network or code mention as network or mfa", () => {
    expect(authErrorKind("Network policy blocked")).toBeNull();
    expect(authErrorKind("Email link is invalid or has expired, request a new code")).toBeNull();
  });

  it("prefers the code over the message", () => {
    expect(authErrorKind({ code: "weak_password", message: "Invalid login credentials" })).toBe(
      "weak_password",
    );
  });

  it("prefers the status over the message", () => {
    expect(authErrorKind({ status: 429, message: "Invalid login credentials" })).toBe(
      "rate_limited",
    );
  });

  it("prefers the name over the message", () => {
    expect(
      authErrorKind({ name: "AuthRetryableFetchError", message: "Invalid login credentials" }),
    ).toBe("network");
  });

  it.each([null, undefined, 42, true, "", "something odd", {}, [], { code: 5, message: 7 }])(
    "returns null for %j",
    (input) => {
      expect(authErrorKind(input)).toBeNull();
    },
  );
});

describe("authErrorMessage", () => {
  it("returns the default copy for every kind", () => {
    for (const [code, kind] of BY_CODE) {
      expect(authErrorMessage({ code }, "signin")).toBe(AUTH_ERROR_MESSAGES[kind]);
    }
    expect(authErrorMessage({ name: "AuthRetryableFetchError" }, "signin")).toBe(
      AUTH_ERROR_MESSAGES.network,
    );
  });

  it("uses the exact default copy", () => {
    expect(AUTH_ERROR_MESSAGES).toEqual({
      invalid_credentials: "Email or password is wrong. Try again or reset your password.",
      email_not_confirmed: "Confirm your email first. Check your inbox for the link.",
      email_exists: "That email already has an account. Sign in instead.",
      weak_password: "Pick a longer password.",
      same_password: "Pick a password you are not using now.",
      rate_limited: "Too many attempts. Wait a minute and try again.",
      mfa_code: "That code did not work. Enter the latest code from your app.",
      network: "Check your connection and try again.",
    });
  });

  it.each([
    ["signin", "Could not sign in. Try again."],
    ["signup", "Could not create your account. Try again."],
    ["oauth", "Could not sign in with Google. Try again."],
    ["reset", "Could not send the reset link. Try again."],
    ["update", "Could not update your password. Try again."],
  ] satisfies Array<[AuthErrorContext, string]>)("falls back for %s", (context, copy) => {
    expect(authErrorMessage({ message: "Database exploded: secret" }, context)).toBe(copy);
    expect(AUTH_ERROR_FALLBACKS[context]).toBe(copy);
  });

  it("never returns raw provider text", () => {
    const out = authErrorMessage(new Error("pg: relation users leaked"), "signin");
    expect(out).not.toContain("leaked");
  });

  it.each([null, undefined, "plain string", 7, new Error("boom")])(
    "handles odd input %s",
    (input) => {
      expect(authErrorMessage(input, "update")).toBe(AUTH_ERROR_FALLBACKS.update);
    },
  );

  it("applies overrides and ignores empty ones", () => {
    const err = { code: "email_exists" };
    expect(
      authErrorMessage(err, "signup", { overrides: { email_exists: "Check your email." } }),
    ).toBe("Check your email.");
    expect(authErrorMessage(err, "signup", { overrides: { email_exists: "" } })).toBe(
      AUTH_ERROR_MESSAGES.email_exists,
    );
  });

  it("uses options.fallback for unmatched errors, ignoring an empty one", () => {
    expect(authErrorMessage({}, "signin", { fallback: "Custom." })).toBe("Custom.");
    expect(authErrorMessage({}, "signin", { fallback: "" })).toBe(AUTH_ERROR_FALLBACKS.signin);
  });

  it("freezes the default tables", () => {
    expect(Object.isFrozen(AUTH_ERROR_MESSAGES)).toBe(true);
    expect(Object.isFrozen(AUTH_ERROR_FALLBACKS)).toBe(true);
  });

  it("is assignable to LoginForm's mapErrorObject", () => {
    const map: NonNullable<LoginFormProps["mapErrorObject"]> = (e, ctx) =>
      authErrorMessage(e, ctx);
    expect(map({ code: "weak_password" }, "signup")).toBe(AUTH_ERROR_MESSAGES.weak_password);
  });
});

describe("build output", () => {
  it('dist/auth-error-message.js carries no "use client" directive', () => {
    const built = path.resolve(__dirname, "../dist/auth-error-message.js");
    expect(readFileSync(built, "utf-8")).not.toMatch(/["']use client["']/);
  });
});

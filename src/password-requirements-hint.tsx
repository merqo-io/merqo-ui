"use client";

import * as React from "react";
import { InfoTooltip } from "./info-tooltip";

/** States the production password policy; keep in step with the Supabase auth settings. */
export const PASSWORD_REQUIREMENTS_HINT =
  "Use at least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.";

export type PasswordRequirementsHintProps = {
  /** Replaces the default policy text. */
  content?: React.ReactNode;
  ariaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

/**
 * Tap-to-show password requirements, meant for the `passwordLabelSlot` of
 * `LoginForm` and `ResetPasswordForm`.
 */
export function PasswordRequirementsHint({
  content = PASSWORD_REQUIREMENTS_HINT,
  ariaLabel = "Password requirements",
  triggerClassName,
  contentClassName,
}: PasswordRequirementsHintProps) {
  return (
    <InfoTooltip
      trigger="tap"
      ariaLabel={ariaLabel}
      content={content}
      triggerClassName={triggerClassName}
      contentClassName={contentClassName}
    />
  );
}

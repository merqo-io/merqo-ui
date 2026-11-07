import * as React from "react";

import { cn } from "./lib/utils";

/** One word gives its first two letters, several give first and last initial, empty gives a bullet. */
export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarProps {
  /** Source of the initials shown when there is no photo. */
  name: string;
  avatarUrl?: string;
  className?: string;
}

/** The vendor's photo, or their initials in a tinted tile when none is set. */
export function Avatar({ name, avatarUrl, className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          "size-8 shrink-0 rounded-md object-cover ring-1 ring-inset ring-primary/25",
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "bg-primary/12 text-primary flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold tracking-tight ring-1 ring-inset ring-primary/25",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export interface AvatarIdentityProps extends AvatarProps {
  /** Text beside the avatar; defaults to `name`. `null` renders the avatar alone. */
  label?: string | null;
}

/**
 * Avatar with the name on its right, hidden below `sm` and truncated. The
 * layout is fixed across every kit on purpose, so there is no prop to flip it.
 */
export function AvatarIdentity({
  name,
  avatarUrl,
  label,
  className,
}: AvatarIdentityProps) {
  const text = label === undefined ? name : label;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Avatar name={name} avatarUrl={avatarUrl} />
      {text ? (
        <span className="hidden max-w-[12rem] truncate text-sm font-medium sm:inline">
          {text}
        </span>
      ) : null}
    </span>
  );
}

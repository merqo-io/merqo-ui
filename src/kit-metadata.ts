import type { Metadata } from "next";

/**
 * Root `metadata` for a kit: `%s | <kit>` title template, kit name as the
 * default title. Pass `overrides` to add description, icons and so on. A
 * string `title` becomes the default title; an object `title`
 * (default/template/absolute) is merged over the kit defaults.
 */
export function kitMetadata(kitName: string, overrides: Metadata = {}): Metadata {
  const { title, ...rest } = overrides;
  const base = { default: kitName, template: `%s | ${kitName}` };
  if (typeof title === "string") return { ...rest, title: { ...base, default: title } };
  if (title && typeof title === "object") return { ...rest, title: { ...base, ...title } };
  return { ...rest, title: base };
}

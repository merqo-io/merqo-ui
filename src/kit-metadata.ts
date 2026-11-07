import type { Metadata } from "next";

/**
 * Root `metadata` for a kit: `%s | <kit>` title template, kit name as the
 * default title. Pass `overrides` to add description, icons and so on; a
 * string `title` override replaces the default title but keeps the template.
 */
export function kitMetadata(kitName: string, overrides: Metadata = {}): Metadata {
  const { title, ...rest } = overrides;
  return {
    ...rest,
    title: {
      default: typeof title === "string" ? title : kitName,
      template: `%s | ${kitName}`,
    },
  };
}

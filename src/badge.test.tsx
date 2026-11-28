import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./ui/badge";

describe("Badge tones", () => {
  it.each([
    ["soft-destructive", ["bg-destructive/10", "text-destructive"]],
    ["warning", ["bg-warning/12", "text-warning"]],
    ["gold", ["bg-gold", "text-gold-foreground", "[a&]:hover:bg-gold/90"]],
  ] as const)("%s carries its classes", (variant, classes) => {
    render(<Badge variant={variant}>tone</Badge>);
    const el = screen.getByText("tone");
    for (const c of classes) expect(el.className).toContain(c);
  });
});

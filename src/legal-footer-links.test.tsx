import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalFooterLinks } from "./legal-footer-links";

describe("LegalFooterLinks", () => {
  it("links to /legal/terms and /legal/privacy by default", () => {
    render(<LegalFooterLinks />);
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
  });

  it("respects a custom basePath", () => {
    render(<LegalFooterLinks basePath="/en/legal" />);
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/en/legal/terms",
    );
  });

  it("gives each link a 44px hit area with active and focus-visible states", () => {
    render(<LegalFooterLinks />);
    for (const name of ["Terms", "Privacy"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveClass("inline-flex", "min-h-11", "items-center");
      expect(link).toHaveClass("active:text-foreground");
      expect(link).toHaveClass("focus-visible:ring-[3px]", "focus-visible:ring-ring/50");
    }
  });
});

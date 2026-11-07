import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FORM_LABEL_CLASS, FormError } from "./form-field";

describe("FORM_LABEL_CLASS", () => {
  it("is the shared small-caps field label style", () => {
    expect(FORM_LABEL_CLASS).toBe(
      "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
    );
  });
});

describe("FormError", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<FormError message={null} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("announces the message with semantic destructive styling", () => {
    render(<FormError message="Bad password" id="e1" className="mt-2" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Bad password");
    expect(alert).toHaveAttribute("id", "e1");
    expect(alert).toHaveClass("text-destructive", "mt-2");
  });
});

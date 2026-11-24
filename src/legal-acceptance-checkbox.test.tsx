import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TermsAcceptanceCheckbox } from "./legal-acceptance-checkbox";

describe("TermsAcceptanceCheckbox", () => {
  it("fires onCheckedChange with the new value on click", async () => {
    const onCheckedChange = vi.fn();
    render(<TermsAcceptanceCheckbox checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("links out to Terms and Privacy Policy", () => {
    render(<TermsAcceptanceCheckbox checked={false} onCheckedChange={() => {}} />);
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
  });
});

describe("TermsAcceptanceCheckbox touch and focus", () => {
  it("uses the shared checkbox and toggles by touch", async () => {
    const onCheckedChange = vi.fn();
    render(<TermsAcceptanceCheckbox checked={false} onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("data-slot", "checkbox");
    expect(box.className.split(" ")).toContain("focus-visible:ring-[3px]");
    await userEvent.setup().pointer({ keys: "[TouchA]", target: box });
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("gives the label a 44px hit area on coarse pointers", () => {
    render(<TermsAcceptanceCheckbox checked onCheckedChange={() => {}} />);
    const label = screen.getByRole("checkbox").closest("label")!;
    expect(label.className.split(" ")).toContain("pointer-coarse:min-h-11");
  });
});

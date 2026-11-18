import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PASSWORD_REQUIREMENTS_HINT, PasswordRequirementsHint } from "./password-requirements-hint";

describe("PasswordRequirementsHint", () => {
  it("renders a non-submitting button named Password requirements", () => {
    render(<PasswordRequirementsHint />);
    const button = screen.getByRole("button", { name: "Password requirements" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("shows the policy text after a click", async () => {
    const user = userEvent.setup();
    render(<PasswordRequirementsHint />);
    expect(screen.queryByText(PASSWORD_REQUIREMENTS_HINT)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Password requirements" }));
    expect(await screen.findByText(PASSWORD_REQUIREMENTS_HINT)).toBeInTheDocument();
  });

  it("honours content and ariaLabel overrides", async () => {
    const user = userEvent.setup();
    render(<PasswordRequirementsHint content="Custom rule" ariaLabel="Rules" />);
    await user.click(screen.getByRole("button", { name: "Rules" }));
    expect(await screen.findByText("Custom rule")).toBeInTheDocument();
    expect(screen.queryByText(PASSWORD_REQUIREMENTS_HINT)).not.toBeInTheDocument();
  });
});

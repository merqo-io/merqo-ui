import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthConfirmForm, AuthConfirmInvalid } from "./auth-confirm-form";
import { AUTH_CONFIRM_TYPES } from "./auth/confirm";

const TOKEN = "tok-hash-123";

function hidden(container: HTMLElement, name: string) {
  return container.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`);
}

describe("AuthConfirmForm", () => {
  it("renders a POST form with hidden inputs", () => {
    const { container } = render(
      <AuthConfirmForm tokenHash={TOKEN} type="recovery" next="/reset-password" />,
    );
    const form = container.querySelector("form");
    expect(form?.getAttribute("method")).toBe("post");
    expect(form?.getAttribute("action")).toBe("/auth/confirm/verify");
    expect(hidden(container, "token_hash")?.value).toBe(TOKEN);
    expect(hidden(container, "type")?.value).toBe("recovery");
    expect(hidden(container, "next")?.value).toBe("/reset-password");
  });

  it("uses a custom action and an empty next by default", () => {
    const { container } = render(
      <AuthConfirmForm tokenHash={TOKEN} type="signup" action="/x/verify" />,
    );
    expect(container.querySelector("form")?.getAttribute("action")).toBe("/x/verify");
    expect(hidden(container, "next")?.value).toBe("");
  });

  it.each([
    ["recovery", "Reset your password", "Continue"],
    ["signup", "Confirm your email", "Confirm email"],
    ["email", "Confirm your email", "Confirm email"],
    ["invite", "Accept your invite", "Accept invite"],
    ["magiclink", "Sign in", "Sign in"],
    ["email_change", "Confirm your new email", "Confirm new email"],
  ] as const)("shows %s copy", (type, title, button) => {
    render(<AuthConfirmForm tokenHash={TOKEN} type={type} />);
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByRole("button", { name: button })).toBeTruthy();
  });

  it("covers every type", () => {
    for (const type of AUTH_CONFIRM_TYPES) {
      const { unmount } = render(<AuthConfirmForm tokenHash={TOKEN} type={type} />);
      expect(screen.getAllByRole("button")).toHaveLength(1);
      unmount();
    }
  });

  it("never renders the token as text or in an accessible name", () => {
    const { container } = render(<AuthConfirmForm tokenHash={TOKEN} type="recovery" />);
    expect(container.textContent).not.toContain(TOKEN);
    expect(screen.queryByLabelText(TOKEN)).toBeNull();
    expect(container.innerHTML.split(TOKEN).length - 1).toBe(1);
  });

  it("allows copy overrides", () => {
    render(
      <AuthConfirmForm tokenHash={TOKEN} type="recovery" title="T" body="B" buttonLabel="Go" />,
    );
    expect(screen.getByRole("heading", { name: "T" })).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go" })).toBeTruthy();
  });

  it("disables the button after submit and restores it on a bfcache restore", () => {
    render(<AuthConfirmForm tokenHash={TOKEN} type="recovery" />);
    const button = screen.getByRole("button") as HTMLButtonElement;
    fireEvent.submit(button.closest("form")!);
    expect(button.disabled).toBe(true);
    fireEvent(window, Object.assign(new Event("pageshow"), { persisted: true }));
    expect(button.disabled).toBe(false);
  });
});

describe("AuthConfirmInvalid", () => {
  it("explains the link is invalid and links to sign in", () => {
    render(<AuthConfirmInvalid />);
    expect(screen.getByText("This link is invalid or has expired.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });

  it("uses a custom loginHref", () => {
    render(<AuthConfirmInvalid loginHref="/signin" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/signin");
  });
});

describe("AuthConfirmForm AUTH_BUTTON", () => {
  it("uses the shared 44px full-width auth button", () => {
    render(<AuthConfirmForm tokenHash={TOKEN} type="signup" next="/" />);
    expect(screen.getByRole("button", { name: "Confirm email" })).toHaveClass("h-11", "w-full", "font-semibold");
  });
});
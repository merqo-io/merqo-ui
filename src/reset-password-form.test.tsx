import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "./reset-password-form";
import { navigatingAway } from "./use-async-action";

function redirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/x;307;" });
}

const FALLBACK = "Could not update your password. Try again.";

async function fillAndSubmit(
  props: Partial<React.ComponentProps<typeof ResetPasswordForm>> = {},
  password = "hunter22x",
  confirm = password,
) {
  const user = userEvent.setup();
  const onSubmit = props.onSubmit ?? vi.fn();
  render(<ResetPasswordForm {...props} onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Confirm password"), confirm);
  await user.click(screen.getByRole("button", { name: "Update password" }));
  return { user, onSubmit };
}

describe("ResetPasswordForm states", () => {
  it("renders the form by default", () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} />);
    const pw = screen.getByLabelText("New password");
    const confirm = screen.getByLabelText("Confirm password");
    for (const el of [pw, confirm]) {
      expect(el).toHaveAttribute("type", "password");
      expect(el).toHaveAttribute("autocomplete", "new-password");
    }
    expect(screen.getByRole("button", { name: "Update password" })).toBeInTheDocument();
  });

  it("shows a polite status line while checking, with no form", () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} state="checking" />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking your reset link…");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("accepts a custom checkingLabel", () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} state="checking" checkingLabel="One moment" />);
    expect(screen.getByRole("status")).toHaveTextContent("One moment");
  });

  it("shows the expired panel, focuses its heading and links back", () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} state="expired" signInHref="/login" />);
    const heading = screen.getByRole("heading", { name: "This link has expired" });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText(/Reset links work once and expire quickly/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("customises the expired copy", () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn()}
        state="expired"
        expiredTitle="Gone"
        expiredBody="Ask again."
      />,
    );
    expect(screen.getByRole("heading", { name: "Gone" })).toBeInTheDocument();
    expect(screen.getByText("Ask again.")).toBeInTheDocument();
  });

  it("shows the failed panel without Try again when onRetry is absent", () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} state="failed" />);
    const heading = screen.getByRole("heading", { name: "Could not check your reset link" });
    expect(heading).toHaveFocus();
    expect(screen.getByText("Check your connection and try again.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("customises the failed copy and shows Try again when onRetry is given", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ResetPasswordForm
        onSubmit={vi.fn()}
        state="failed"
        failedTitle="Oops"
        failedBody="Offline."
        onRetry={onRetry}
        signInHref="/login"
      />,
    );
    expect(screen.getByRole("heading", { name: "Oops" })).toBeInTheDocument();
    expect(screen.getByText("Offline.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to sign in" })).toBeInTheDocument();
  });

  it("activates Try again by touch", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ResetPasswordForm onSubmit={vi.fn()} state="failed" onRetry={onRetry} />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Try again" }) });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders title and subtitle only when given", () => {
    const { rerender } = render(<ResetPasswordForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole("heading")).toBeNull();
    rerender(<ResetPasswordForm onSubmit={vi.fn()} title="New password" subtitle="Pick one." />);
    expect(screen.getByRole("heading", { name: "New password" })).toBeInTheDocument();
    expect(screen.getByText("Pick one.")).toBeInTheDocument();
  });

  it("renders the sign-in link in ready state only when signInHref is given", () => {
    const { rerender } = render(<ResetPasswordForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<ResetPasswordForm onSubmit={vi.fn()} signInHref="/login" signInLabel="Cancel" />);
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/login");
  });

  it("uses LinkComponent and passes className", () => {
    const Custom = (props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
      <a data-custom="yes" {...props} />
    );
    const { container } = render(
      <ResetPasswordForm
        onSubmit={vi.fn()}
        signInHref="/login"
        LinkComponent={Custom}
        className="extra"
      />,
    );
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "data-custom",
      "yes",
    );
    expect(container.firstElementChild).toHaveClass("extra");
  });
});

describe("ResetPasswordForm validation", () => {
  it("rejects a short password, focuses the field and wires aria", async () => {
    const { onSubmit } = await fillAndSubmit({}, "short", "short");
    expect(onSubmit).not.toHaveBeenCalled();
    const pw = screen.getByLabelText("New password");
    expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(pw).toHaveFocus();
    expect(pw).toHaveAttribute("aria-invalid", "true");
    const describedBy = pw.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)).toHaveTextContent("Use at least 8 characters.");
  });

  it("builds the short message from minLength and accepts a custom one", async () => {
    await fillAndSubmit({ minLength: 12 }, "elevenchars", "elevenchars");
    expect(screen.getByText("Use at least 12 characters.")).toBeInTheDocument();
  });

  it("uses tooShortMessage when given", async () => {
    await fillAndSubmit({ tooShortMessage: "Longer please." }, "abc", "abc");
    expect(screen.getByText("Longer please.")).toBeInTheDocument();
  });

  it("rejects an over-long password", async () => {
    const { onSubmit } = await fillAndSubmit({ maxLength: 10 }, "x".repeat(11));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Use at most 10 characters.")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveFocus();
  });

  it("uses tooLongMessage when given", async () => {
    await fillAndSubmit({ maxLength: 10, tooLongMessage: "Too long." }, "x".repeat(11));
    expect(screen.getByText("Too long.")).toBeInTheDocument();
  });

  it("rejects a mismatch and focuses the confirm field", async () => {
    const { onSubmit } = await fillAndSubmit({}, "hunter22x", "hunter22y");
    expect(onSubmit).not.toHaveBeenCalled();
    const confirm = screen.getByLabelText("Confirm password");
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(confirm).toHaveFocus();
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(confirm.getAttribute("aria-describedby")!)).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(screen.getByLabelText("New password")).not.toHaveAttribute("aria-invalid");
  });

  it("uses mismatchMessage when given and clears the error on typing", async () => {
    const { user } = await fillAndSubmit({ mismatchMessage: "No match." }, "hunter22x", "nope");
    expect(screen.getByText("No match.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Confirm password"), "z");
    expect(screen.queryByText("No match.")).toBeNull();
    expect(screen.getByLabelText("Confirm password")).not.toHaveAttribute("aria-invalid");
  });

  it("passes the password to onSubmit when valid", async () => {
    const { onSubmit } = await fillAndSubmit();
    expect(onSubmit).toHaveBeenCalledWith("hunter22x");
  });

  it("relabels fields and buttons", () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn()}
        passwordLabel="Fresh password"
        confirmLabel="Again"
        submitLabel="Save"
      />,
    );
    expect(screen.getByLabelText("Fresh password")).toBeInTheDocument();
    expect(screen.getByLabelText("Again")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});

describe("ResetPasswordForm submit results", () => {
  it("shows a returned string as the error", async () => {
    await fillAndSubmit({ onSubmit: vi.fn().mockResolvedValue("Pick another one.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Pick another one.");
  });

  it("runs a returned string through mapError", async () => {
    const mapError = vi.fn().mockReturnValue("Mapped.");
    await fillAndSubmit({ onSubmit: vi.fn().mockReturnValue("raw_code"), mapError });
    expect(await screen.findByRole("alert")).toHaveTextContent("Mapped.");
    expect(mapError).toHaveBeenCalledWith("raw_code");
  });

  it("falls back when mapError returns an empty string", async () => {
    await fillAndSubmit({
      onSubmit: vi.fn().mockResolvedValue("raw"),
      mapError: () => "",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(FALLBACK);
  });

  it("maps an { error } result with mapErrorObject and never renders its text", async () => {
    const error = { message: "secret provider text" };
    const mapErrorObject = vi.fn().mockReturnValue("Friendly.");
    await fillAndSubmit({ onSubmit: vi.fn().mockResolvedValue({ error }), mapErrorObject });
    expect(await screen.findByRole("alert")).toHaveTextContent("Friendly.");
    expect(mapErrorObject).toHaveBeenCalledWith(error);
    expect(screen.queryByText(/secret provider text/)).toBeNull();
  });

  it("falls back for an { error } result without a mapper or with an empty mapping", async () => {
    await fillAndSubmit({ onSubmit: vi.fn().mockResolvedValue({ error: new Error("leak") }) });
    expect(await screen.findByRole("alert")).toHaveTextContent(FALLBACK);
    expect(screen.queryByText(/leak/)).toBeNull();
  });

  it("uses errorFallback when mapErrorObject returns an empty string", async () => {
    await fillAndSubmit({
      onSubmit: vi.fn().mockResolvedValue({ error: "x" }),
      mapErrorObject: () => "",
      errorFallback: "Custom fallback.",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Custom fallback.");
  });

  it("shows the fallback for a throw and never the raw text", async () => {
    await fillAndSubmit({ onSubmit: vi.fn().mockRejectedValue(new Error("db password leak")) });
    expect(await screen.findByRole("alert")).toHaveTextContent(FALLBACK);
    expect(screen.queryByText(/leak/)).toBeNull();
  });

  it("maps a thrown error through mapError using its code, else message", async () => {
    const mapError = vi.fn().mockReturnValue("Thrown mapped.");
    await fillAndSubmit({
      onSubmit: vi.fn().mockRejectedValue(Object.assign(new Error("m"), { code: "weak" })),
      mapError,
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Thrown mapped.");
    expect(mapError).toHaveBeenCalledWith("weak");
  });

  it("shows the fallback for a synchronous throw", async () => {
    await fillAndSubmit({
      onSubmit: () => {
        throw new Error("sync");
      },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(FALLBACK);
  });

  it("shows no error on success and re-enables the button", async () => {
    await fillAndSubmit({ onSubmit: vi.fn().mockResolvedValue(undefined) });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update password" })).toBeEnabled(),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the error when the user types again", async () => {
    const { user } = await fillAndSubmit({ onSubmit: vi.fn().mockResolvedValue("Nope.") });
    await screen.findByRole("alert");
    await user.type(screen.getByLabelText("New password"), "a");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("disables the button with pendingLabel while pending and ignores a second submit", async () => {
    let finish!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<ResetPasswordForm onSubmit={onSubmit} pendingLabel="Saving…" />);
    await user.type(screen.getByLabelText("New password"), "hunter22x");
    await user.type(screen.getByLabelText("Confirm password"), "hunter22x");
    await user.type(screen.getByLabelText("Confirm password"), "{Enter}");
    await user.type(screen.getByLabelText("Confirm password"), "{Enter}");
    const button = await screen.findByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Update password" })).toBeEnabled());
  });

  it("keeps the pending look when onSubmit redirects", async () => {
    await fillAndSubmit({
      onSubmit: async () => {
        await navigatingAway();
      },
    });
    expect(await screen.findByRole("button", { name: "Updating…" })).toBeDisabled();
  });

  it("keeps the pending look and shows no error on a redirect throw", async () => {
    await fillAndSubmit({ onSubmit: vi.fn().mockRejectedValue(redirectError()) });
    expect(await screen.findByRole("button", { name: "Updating…" })).toBeDisabled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("activates submit by touch", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ResetPasswordForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("New password"), "hunter22x");
    await user.type(screen.getByLabelText("Confirm password"), "hunter22x");
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Update password" }),
    });
    expect(onSubmit).toHaveBeenCalledWith("hunter22x");
  });
});

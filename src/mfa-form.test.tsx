import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MfaForm } from "./mfa-form";
import { navigatingAway } from "./use-async-action";

function redirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/admin;307;" });
}

describe("MfaForm with an enrolled factor", () => {
  it("has a numeric one-time-code input with a label", () => {
    render(<MfaForm hasFactor onVerify={vi.fn()} />);
    const input = screen.getByLabelText("6-digit code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("maxlength", "6");
  });

  it("rejects a short code without calling onVerify", async () => {
    const onVerify = vi.fn();
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={onVerify} />);
    await user.type(screen.getByLabelText("6-digit code"), "123");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter the 6-digit code from your authenticator app.",
    );
    expect(onVerify).not.toHaveBeenCalled();
  });

  it("keeps only digits", async () => {
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={vi.fn()} />);
    await user.type(screen.getByLabelText("6-digit code"), "12a3 4b56");
    expect(screen.getByLabelText("6-digit code")).toHaveValue("123456");
  });

  it("verifies a valid code by touch", async () => {
    const onVerify = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={onVerify} />);
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Verify" }) });
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith("123456", {}));
  });

  it("shows a returned error and re-enables the button", async () => {
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={vi.fn().mockResolvedValue("That code did not work.")} />);
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That code did not work.");
    expect(screen.getByRole("button", { name: "Verify" })).toBeEnabled();
  });

  it("maps a thrown error and falls back for opaque throws", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MfaForm
        hasFactor
        onVerify={vi.fn().mockRejectedValue(Object.assign(new Error("x"), { code: "mfa_verification_failed" }))}
        mapError={(raw) => (raw === "mfa_verification_failed" ? "Wrong code." : "Other")}
      />,
    );
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong code.");
    unmount();

    render(<MfaForm hasFactor onVerify={vi.fn().mockRejectedValue(undefined)} />);
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That code did not work. Check the time on your phone and try again.",
    );
  });

  it("stays pending without an error on a redirect", async () => {
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={vi.fn().mockRejectedValue(redirectError())} />);
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Verifying" })).toBeDisabled());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("stays pending when the callback awaits navigatingAway", async () => {
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={async () => navigatingAway()} />);
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(screen.getByRole("button", { name: "Verifying" })).toBeDisabled();
    expect(screen.getByLabelText("6-digit code")).toBeDisabled();
  });

  it("offers a cancel action that signs out by touch", async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MfaForm hasFactor onVerify={vi.fn()} onCancel={onCancel} />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Sign out" }) });
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });

  it("uses a custom cancel label and shows a cancel error", async () => {
    const user = userEvent.setup();
    render(
      <MfaForm
        hasFactor
        onVerify={vi.fn()}
        onCancel={vi.fn().mockResolvedValue("Could not sign out.")}
        cancelLabel="Use a different account"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Use a different account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign out.");
  });

  it("has no cancel button without a handler", () => {
    render(<MfaForm hasFactor onVerify={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });
});

describe("MfaForm enrolment", () => {
  it("prompts to set up when there is no factor", () => {
    render(<MfaForm hasFactor={false} onVerify={vi.fn()} onEnrol={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Set up authenticator" })).toBeInTheDocument();
    expect(screen.queryByLabelText("6-digit code")).toBeNull();
  });

  it("shows the QR code and key after enrolling, then verifies with the factor id", async () => {
    const onEnrol = vi
      .fn()
      .mockResolvedValue({ qr: "data:image/svg+xml;base64,AAA", secret: "ABCD EFGH", factorId: "f1" });
    const onVerify = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MfaForm hasFactor={false} onVerify={onVerify} onEnrol={onEnrol} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Set up authenticator" }),
    });
    expect(await screen.findByAltText("Authenticator QR code")).toHaveAttribute(
      "src",
      "data:image/svg+xml;base64,AAA",
    );
    expect(screen.getByText("ABCD EFGH")).toBeInTheDocument();
    await user.type(screen.getByLabelText("6-digit code"), "654321");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith("654321", { factorId: "f1" }));
  });

  it("shows an enrolment error and stays on the prompt", async () => {
    const user = userEvent.setup();
    render(
      <MfaForm
        hasFactor={false}
        onVerify={vi.fn()}
        onEnrol={vi.fn().mockResolvedValue("Could not start setup. Try again.")}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Set up authenticator" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not start setup. Try again.");
    expect(screen.getByRole("button", { name: "Set up authenticator" })).toBeEnabled();
  });

  it("falls back when enrolment throws", async () => {
    const user = userEvent.setup();
    render(<MfaForm hasFactor={false} onVerify={vi.fn()} onEnrol={vi.fn().mockRejectedValue(undefined)} />);
    await user.click(screen.getByRole("button", { name: "Set up authenticator" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not start setup. Try again.");
  });
});

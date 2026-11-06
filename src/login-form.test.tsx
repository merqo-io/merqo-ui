import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import { navigatingAway } from "./use-async-action";

function redirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/x;307;" });
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "a@b.sg");
  await user.type(screen.getByLabelText("Password"), "hunter22");
}

describe("LoginForm", () => {
  it("labels inputs with the right autocomplete", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  });

  it("submits email and password in signin mode", async () => {
    const onPasswordSignIn = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={onPasswordSignIn} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onPasswordSignIn).toHaveBeenCalledWith({ email: "a@b.sg", password: "hunter22" });
  });

  it("submits by touch", async () => {
    const onPasswordSignIn = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={onPasswordSignIn} />);
    await fill(user);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Sign in" }) });
    await waitFor(() => expect(onPasswordSignIn).toHaveBeenCalledTimes(1));
  });

  it("never renders a raw returned string without mapError", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn().mockResolvedValue("User jo@x.sg not found in auth.users")} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not sign in. Try again.");
    expect(alert).not.toHaveTextContent("auth.users");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("never renders a thrown error's message or code without mapError", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onPasswordSignIn={vi
          .fn()
          .mockRejectedValue(Object.assign(new Error("db password leaked"), { code: "pg_boom" }))}
      />,
    );
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not sign in. Try again.");
    expect(alert).not.toHaveTextContent(/leaked|pg_boom/);
  });

  it("points the inputs at the error and clears it on typing", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn().mockResolvedValue("x")} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const alert = await screen.findByRole("alert");
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", alert.id);
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-describedby", alert.id);
    await user.type(email, "z");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(email).not.toHaveAttribute("aria-invalid", "true");
  });

  it("clears a thrown error on typing too", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn().mockRejectedValue(new Error("x"))} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    await user.type(screen.getByLabelText("Password"), "z");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("names the inputs", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("name", "password");
  });

  it("calls the handler once when a password submit and a Google tap overlap", async () => {
    const onPasswordSignIn = vi.fn(() => new Promise<void>(() => {}));
    const onGoogleSignIn = vi.fn(() => new Promise<void>(() => {}));
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={onPasswordSignIn} onGoogleSignIn={onGoogleSignIn} />);
    await fill(user);
    const form = screen.getByLabelText("Email").closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(onPasswordSignIn).toHaveBeenCalledTimes(1);
    expect(onGoogleSignIn).not.toHaveBeenCalled();
  });

  it("allows a retry after a failed submit", async () => {
    const onPasswordSignIn = vi.fn().mockResolvedValue("x");
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={onPasswordSignIn} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(onPasswordSignIn).toHaveBeenCalledTimes(2));
  });

  it("renders the forgot-password link through LinkComponent", () => {
    function Custom(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
      return <a data-custom="1" {...props} />;
    }
    render(
      <LoginForm onPasswordSignIn={vi.fn()} forgotPasswordHref="/forgot" LinkComponent={Custom} />,
    );
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("data-custom", "1");
  });

  it("maps a thrown error code through mapError", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onPasswordSignIn={vi.fn().mockRejectedValue(Object.assign(new Error("raw"), { code: "invalid_credentials" }))}
        mapError={(code) => (code === "invalid_credentials" ? "Wrong email or password." : "Generic")}
      />,
    );
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password.");
  });

  it("maps a returned string through mapError with the context", async () => {
    const user = userEvent.setup();
    const mapError = vi.fn().mockReturnValue("Friendly");
    render(<LoginForm onPasswordSignIn={vi.fn().mockResolvedValue("raw_code")} mapError={mapError} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Friendly");
    expect(mapError).toHaveBeenCalledWith("raw_code", "signin");
  });

  it("falls back to a generic message when a non-error value is thrown", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn().mockRejectedValue(undefined)} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign in. Try again.");
  });

  it("disables controls while pending", async () => {
    let release: () => void = () => {};
    const onPasswordSignIn = vi.fn(() => new Promise<void>((r) => (release = r)));
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={onPasswordSignIn} onGoogleSignIn={vi.fn()} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Please wait" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    release();
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled());
  });

  it("stays pending and shows no error when the callback redirects", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onPasswordSignIn={vi.fn().mockRejectedValue(redirectError())}
      />,
    );
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Please wait" })).toBeDisabled());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("stays pending when the callback awaits navigatingAway", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={async () => navigatingAway()} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Please wait" })).toBeDisabled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides the Google button without a handler or with showGoogle false", () => {
    const { rerender } = render(<LoginForm onPasswordSignIn={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Google/ })).toBeNull();
    rerender(<LoginForm onPasswordSignIn={vi.fn()} onGoogleSignIn={vi.fn()} showGoogle={false} />);
    expect(screen.queryByRole("button", { name: /Google/ })).toBeNull();
  });

  it("runs Google sign-in by touch and shows its error", async () => {
    const onGoogleSignIn = vi.fn().mockResolvedValue("Could not sign in with Google.");
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn()} onGoogleSignIn={onGoogleSignIn} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Continue with Google" }),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not sign in with Google. Try again.",
    );
  });

  it("toggles to signup by touch and submits through onPasswordSignUp", async () => {
    const onPasswordSignUp = vi.fn().mockResolvedValue(undefined);
    const onModeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <LoginForm
        onPasswordSignIn={vi.fn()}
        onPasswordSignUp={onPasswordSignUp}
        onModeChange={onModeChange}
      />,
    );
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Create an account" }) });
    expect(onModeChange).toHaveBeenCalledWith("signup");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.queryByRole("link", { name: "Forgot password?" })).toBeNull();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(onPasswordSignUp).toHaveBeenCalledWith({ email: "a@b.sg", password: "hunter22" });
  });

  it("starts in signup mode when asked", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} onPasswordSignUp={vi.fn()} defaultMode="signup" />);
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("has no mode toggle without a signup handler", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Create an account" })).toBeNull();
  });

  it("clears the error when the mode changes", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onPasswordSignIn={vi.fn().mockResolvedValue("Nope")}
        onPasswordSignUp={vi.fn()}
      />,
    );
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Create an account" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders the forgot-password link in signin mode", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} forgotPasswordHref="/forgot" />);
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot");
  });

  it("shows a notice returned by sign-up, such as a confirmation-email prompt", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onPasswordSignIn={vi.fn()}
        onPasswordSignUp={vi.fn().mockResolvedValue({ notice: "Check your email." })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Check your email.");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends a reset link for the typed email from a button", async () => {
    const onForgotPassword = vi.fn().mockResolvedValue({ notice: "Reset link sent." });
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn()} onForgotPassword={onForgotPassword} />);
    await user.type(screen.getByLabelText("Email"), "a@b.sg");
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Forgot password?" }) });
    await waitFor(() => expect(onForgotPassword).toHaveBeenCalledWith("a@b.sg"));
    expect(await screen.findByRole("status")).toHaveTextContent("Reset link sent.");
  });

  it("asks for an email before resetting and does not call onForgotPassword", async () => {
    const onForgotPassword = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn()} onForgotPassword={onForgotPassword} />);
    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your email first.");
    expect(onForgotPassword).not.toHaveBeenCalled();
  });

  it("falls back to a generic reset error", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn()} onForgotPassword={vi.fn().mockResolvedValue("rate limit hit")} />);
    await user.type(screen.getByLabelText("Email"), "a@b.sg");
    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not send the reset link. Try again.");
  });

  it("shows an initial error such as one passed back from the auth callback", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} initialError="Link expired." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Link expired.");
  });
});

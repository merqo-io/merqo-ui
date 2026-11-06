import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("shows a returned error string and re-enables the form", async () => {
    const user = userEvent.setup();
    render(<LoginForm onPasswordSignIn={vi.fn().mockResolvedValue("Wrong email or password.")} />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password.");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
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
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign in with Google.");
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

  it("shows an initial error such as one passed back from the auth callback", () => {
    render(<LoginForm onPasswordSignIn={vi.fn()} initialError="Link expired." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Link expired.");
  });
});

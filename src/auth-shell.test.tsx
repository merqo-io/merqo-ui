import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("renders wordmark, title, subtitle, children and footer", () => {
    render(
      <AuthShell
        wordmark={<span>Kit</span>}
        title="Welcome back"
        subtitle="Sign in to continue"
        footer={<p>Terms apply</p>}
      >
        <p>form body</p>
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Kit")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByText("form body")).toBeInTheDocument();
    expect(screen.getByText("Terms apply")).toBeInTheDocument();
  });

  it("omits optional slots", () => {
    const { container } = render(<AuthShell title="Only title">x</AuthShell>);
    expect(container.querySelector("footer")).toBeNull();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders a tagline under the wordmark", () => {
    render(
      <AuthShell wordmark={<span>Kit</span>} tagline={<span>Sell more</span>} title="T">
        x
      </AuthShell>,
    );
    expect(screen.getByText("Sell more")).toBeInTheDocument();
  });

  it("left-aligns the title block by default and centres it on request", () => {
    const { rerender } = render(
      <AuthShell title="T" subtitle="S">
        x
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { level: 1 }).parentElement).not.toHaveClass("text-center");
    rerender(
      <AuthShell title="T" subtitle="S" align="center">
        x
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { level: 1 }).parentElement).toHaveClass("text-center");
  });
});

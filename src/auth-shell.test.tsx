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

  it("keeps the default DOM: h1, subtitle and children are siblings in the card", () => {
    render(
      <AuthShell title="T" subtitle="S">
        <p>body</p>
      </AuthShell>,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    const card = h1.parentElement!;
    expect(screen.getByText("S").parentElement).toBe(card);
    expect(screen.getByText("body").parentElement?.parentElement).toBe(card);
    expect(h1).not.toHaveClass("text-center");
    expect(screen.getByText("S")).not.toHaveClass("text-center");
  });

  it("centres the title and subtitle on request", () => {
    render(
      <AuthShell title="T" subtitle="S" align="center">
        x
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-center");
    expect(screen.getByText("S")).toHaveClass("text-center");
  });

  it("centres a title without a subtitle", () => {
    render(
      <AuthShell title="T" align="center">
        x
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-center");
  });

  it("combines tagline, wordmark and align", () => {
    render(
      <AuthShell tagline="Sell more" align="center" title="T">
        x
      </AuthShell>,
    );
    expect(screen.getByText("Sell more")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-center");
  });

  it("renders no header block without wordmark or tagline", () => {
    const { container } = render(<AuthShell title="T">x</AuthShell>);
    expect(container.querySelector(".mb-8")).toBeNull();
  });
});

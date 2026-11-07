import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotFound } from "./not-found-page";
import { brandIcon, APPLE_ICON_SIZE, ICON_SIZE } from "./brand-icon";
import { kitMetadata } from "./kit-metadata";
import { Providers, ThemeProvider, Toaster } from "./providers";
import { Wordmark } from "./wordmark";
import { LegalPage, legalPageMetadata } from "./legal-page";
import { AcceptTermsForm, AcceptTermsPage } from "./accept-terms";

describe("NotFound", () => {
  it("links home by default and shows the code", () => {
    render(<NotFound code="404" wordmark={<b>Kit</b>} />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("accepts custom copy and an action slot", () => {
    render(<NotFound title="Gone" description="D" action={<button>Scan again</button>} />);
    expect(screen.getByText("Gone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan again" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("uses a custom home target", () => {
    render(<NotFound homeHref="/start" homeLabel="Start" />);
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/start");
  });
});

describe("brandIcon", () => {
  it("scales the tile and takes colours from the kit", () => {
    const el = brandIcon(100, { monogram: "Q", background: "red", foreground: "blue" });
    const style = (el.props as { style: Record<string, unknown>; children: string }).style;
    expect(style).toMatchObject({
      width: 100,
      background: "red",
      color: "blue",
      fontSize: 62,
      borderRadius: 22,
    });
    expect((el.props as { children: string }).children).toBe("Q");
  });

  it("exports the favicon and touch-icon sizes", () => {
    expect(ICON_SIZE).toEqual({ width: 32, height: 32 });
    expect(APPLE_ICON_SIZE).toEqual({ width: 180, height: 180 });
  });
});

describe("kitMetadata", () => {
  it("sets the title template and default", () => {
    expect(kitMetadata("qkit")).toEqual({ title: { default: "qkit", template: "%s | qkit" } });
  });

  it("merges overrides and honours a string title", () => {
    const meta = kitMetadata("qkit", { description: "d", title: "qkit | Queues" });
    expect(meta.description).toBe("d");
    expect(meta.title).toEqual({ default: "qkit | Queues", template: "%s | qkit" });
  });
});

describe("Providers", () => {
  it("renders children inside ThemeProvider with a Toaster", () => {
    render(
      <Providers>
        <p>child</p>
      </Providers>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(document.querySelector("section[aria-label]")).not.toBeNull();
  });

  it("renders the parts on their own with overrides", () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <Toaster position="bottom-center" />
        <span>x</span>
      </ThemeProvider>,
    );
    expect(screen.getByText("x")).toBeInTheDocument();
  });

  it("passes theme and toaster overrides through Providers", () => {
    render(
      <Providers theme={{ forcedTheme: "dark" }} toaster={{ position: "top-left" }}>
        <span>y</span>
      </Providers>,
    );
    expect(screen.getByText("y")).toBeInTheDocument();
  });
});

describe("Wordmark", () => {
  it("applies the size class and renders plain text without href", () => {
    render(
      <Wordmark size="xl" label="qkit" className="extra">
        <span>q</span>kit
      </Wordmark>,
    );
    const el = screen.getByRole("img", { name: "qkit" });
    expect(el).toHaveClass("text-3xl", "extra", "font-display");
  });

  it("defaults to the md size", () => {
    const { container } = render(<Wordmark>Kit</Wordmark>);
    expect(container.firstElementChild).toHaveClass("text-xl");
  });

  it("wraps in a touch-sized link when href is given", async () => {
    const user = userEvent.setup();
    render(
      <Wordmark href="/home" size="sm">
        Kit
      </Wordmark>,
    );
    const link = screen.getByRole("link", { name: "Kit" });
    expect(link).toHaveAttribute("href", "/home");
    expect(link).toHaveClass("text-lg", "min-h-11");
    await user.pointer({ keys: "[TouchA]", target: link });
  });

  it("names a linked mark with label", () => {
    render(
      <Wordmark href="/" label="Home">
        K
      </Wordmark>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});

describe("LegalPage", () => {
  it("renders the document and a linked wordmark", () => {
    render(<LegalPage doc="terms" kit="qkit" wordmark={<b>Kit</b>} homeHref="/h" />);
    expect(screen.getByRole("link", { name: "Kit" })).toHaveAttribute("href", "/h");
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders without a wordmark", () => {
    render(<LegalPage doc="privacy" />);
    expect(screen.queryByRole("link", { name: "Kit" })).toBeNull();
  });

  it("builds page metadata", () => {
    expect(legalPageMetadata("terms")).toEqual({ title: "Terms of Service" });
    expect(legalPageMetadata("privacy")).toEqual({ title: "Privacy Policy" });
  });
});

describe("AcceptTerms", () => {
  it("keeps submit disabled until the box is ticked by touch, then submits next", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<AcceptTermsForm action={action} next="/dashboard" basePath="/legal" />);
    const submit = screen.getByRole("button", { name: "Continue" });
    expect(submit).toBeDisabled();
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("checkbox") });
    expect(submit).toBeEnabled();
    await user.pointer({ keys: "[TouchA]", target: submit });
    expect(action).toHaveBeenCalledTimes(1);
    const data = action.mock.calls[0][0] as FormData;
    expect(data.get("next")).toBe("/dashboard");
  });

  it("supports a custom label and class", () => {
    const { container } = render(
      <AcceptTermsForm action={() => {}} next="/" submitLabel="Agree" className="c" />,
    );
    expect(screen.getByRole("button", { name: "Agree" })).toBeInTheDocument();
    expect(container.querySelector("form")).toHaveClass("c");
  });

  it("wraps the form in the page with default and custom copy", () => {
    const { rerender } = render(<AcceptTermsPage action={() => {}} next="/" wordmark={<b>Kit</b>} />);
    expect(screen.getByRole("heading", { name: "Our terms have been updated" })).toBeInTheDocument();
    rerender(<AcceptTermsPage action={() => {}} next="/" title="T" description="D" />);
    expect(screen.getByRole("heading", { name: "T" })).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });
});

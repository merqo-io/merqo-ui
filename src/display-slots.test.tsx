import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";

describe("PageHeader slots", () => {
  it("renders `actions` as an alias of `action`", () => {
    render(<PageHeader title="T" actions={<button type="button">Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("`action` wins over `actions`", () => {
    render(
      <PageHeader title="T" action={<span>one</span>} actions={<span>two</span>} />,
    );
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.queryByText("two")).not.toBeInTheDocument();
  });

  it("renders an {href, label} back link with a 44px target", () => {
    render(<PageHeader title="T" back={{ href: "/dashboard", label: "Dashboard" }} />);
    const link = screen.getByRole("link", { name: /Dashboard/ });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link).toHaveClass("min-h-11");
  });

  it("still accepts a node as `back`", () => {
    render(<PageHeader title="T" back={<a href="/x">Custom</a>} />);
    expect(screen.getByRole("link", { name: "Custom" })).toBeInTheDocument();
  });
});

describe("EmptyState slots", () => {
  it("renders primaryAction and secondaryAction in order", () => {
    render(
      <EmptyState
        title="Nothing"
        primaryAction={<button type="button">First</button>}
        secondaryAction={<button type="button">Second</button>}
      />,
    );
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons).toEqual(["First", "Second"]);
  });

  it("`actions` wins over the primary and secondary slots", () => {
    render(
      <EmptyState
        title="Nothing"
        actions={<button type="button">Only</button>}
        primaryAction={<button type="button">Ignored</button>}
      />,
    );
    expect(screen.queryByRole("button", { name: "Ignored" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Only" })).toBeInTheDocument();
  });
});

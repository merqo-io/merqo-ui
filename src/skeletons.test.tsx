import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTableSkeleton, ListSkeleton, StatTileSkeleton } from "./skeletons";

const blocks = (root: HTMLElement) => root.querySelectorAll('[data-slot="skeleton"]');

describe.each([
  ["DataTableSkeleton", () => <DataTableSkeleton className="custom" />],
  ["StatTileSkeleton", () => <StatTileSkeleton className="custom" />],
  ["ListSkeleton", () => <ListSkeleton className="custom" />],
])("%s shared contract", (_name, ui) => {
  it("is a busy status region with an sr-only Loading label", () => {
    render(ui());
    const root = screen.getByRole("status");
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading")).toHaveClass("sr-only");
  });

  it("hides every block from assistive tech and carries no em dash", () => {
    const { container } = render(ui());
    const all = blocks(container);
    expect(all.length).toBeGreaterThan(0);
    for (const el of all) expect(el.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.textContent).not.toContain("—");
  });

  it("passes className through on the root", () => {
    render(ui());
    expect(screen.getByRole("status")).toHaveClass("custom");
  });
});

describe("DataTableSkeleton", () => {
  it("renders rows x columns body cells plus a header row", () => {
    const { container } = render(<DataTableSkeleton rows={3} columns={2} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(container.querySelectorAll("tbody td")).toHaveLength(6);
    expect(container.querySelectorAll("thead th")).toHaveLength(2);
  });

  it("drops the header when header is false", () => {
    const { container } = render(<DataTableSkeleton header={false} />);
    expect(container.querySelector("thead")).toBeNull();
  });

  it("uses a fixed table layout so it cannot overflow at 360px", () => {
    const { container } = render(<DataTableSkeleton />);
    expect(container.querySelector("table")).toHaveClass("table-fixed", "w-full");
  });

  it("overrides the label", () => {
    render(<DataTableSkeleton label="Loading orders" />);
    expect(screen.getByText("Loading orders")).toHaveClass("sr-only");
  });

  it("is deterministic across renders", () => {
    const a = render(<DataTableSkeleton />).container.innerHTML;
    const b = render(<DataTableSkeleton />).container.innerHTML;
    expect(a).toBe(b);
  });
});

describe("StatTileSkeleton", () => {
  it("draws label, value and caption lines", () => {
    const { container } = render(<StatTileSkeleton />);
    expect(blocks(container)).toHaveLength(3);
  });

  it("uses the card surface by default and none with card false", () => {
    const { rerender } = render(<StatTileSkeleton />);
    expect(screen.getByRole("status").className).toContain("shadow");
    rerender(<StatTileSkeleton card={false} />);
    expect(screen.getByRole("status").className).not.toContain("shadow");
  });
});

describe("ListSkeleton", () => {
  it("renders the requested number of rows", () => {
    const { container } = render(<ListSkeleton rows={4} />);
    expect(container.querySelectorAll('[data-slot="item"]')).toHaveLength(4);
  });

  it("toggles the media square", () => {
    const { container, rerender } = render(<ListSkeleton rows={2} media />);
    expect(container.querySelectorAll('[data-slot="item-media"]')).toHaveLength(2);
    rerender(<ListSkeleton rows={2} />);
    expect(container.querySelectorAll('[data-slot="item-media"]')).toHaveLength(0);
  });

  it("toggles the actions block", () => {
    const { container, rerender } = render(<ListSkeleton rows={2} actions />);
    expect(container.querySelectorAll('[data-slot="item-actions"]')).toHaveLength(2);
    rerender(<ListSkeleton rows={2} />);
    expect(container.querySelectorAll('[data-slot="item-actions"]')).toHaveLength(0);
  });
});

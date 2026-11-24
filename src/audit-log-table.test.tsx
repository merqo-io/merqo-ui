import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditLogTable, type AuditLogEntry } from "./audit-log-table";
import { GROUP } from "./recipes";

describe("AuditLogTable frame", () => {
  it("is an in-page group, with no shadow, filled or empty", () => {
    const { container, rerender } = render(<AuditLogTable entries={[]} />);
    const empty = container.firstElementChild as HTMLElement;
    expect(empty).toHaveClass("rounded-xl", "border");
    expect(empty.className).not.toMatch(/rounded-2xl|shadow/);
    rerender(
      <AuditLogTable
        entries={[{ id: "1", actor: "a", action: "x", target: null, detail: null, createdAt: "2026-08-19T10:00:00.000Z" }]}
      />,
    );
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveClass(GROUP.split(" ")[0]);
    expect(frame.className).not.toMatch(/rounded-2xl|shadow/);
  });
});

describe("AuditLogTable", () => {
  const entries: AuditLogEntry[] = [
    {
      id: "1",
      actor: "clarence@merqo.io",
      action: "set_vendor_plan",
      target: "Auntie Lim's Kopitiam",
      detail: "plan: pro",
      createdAt: "2026-08-19T10:00:00.000Z",
    },
    {
      id: "2",
      actor: "clarence@merqo.io",
      action: "set_pricing",
      target: null,
      detail: null,
      createdAt: new Date("2026-08-18T09:00:00.000Z"),
    },
  ];

  it("renders the header columns", () => {
    render(<AuditLogTable entries={[]} />);
    expect(screen.getByText("No activity recorded yet.")).toBeInTheDocument();
  });

  it("renders a custom empty state", () => {
    render(<AuditLogTable entries={[]} emptyState="Nothing to see." />);
    expect(screen.getByText("Nothing to see.")).toBeInTheDocument();
    expect(screen.queryByText("No activity recorded yet.")).not.toBeInTheDocument();
  });

  it("renders one row per entry, actor and target as given", () => {
    render(<AuditLogTable entries={entries} />);
    expect(screen.getAllByText("clarence@merqo.io")).toHaveLength(2);
    expect(screen.getByText("Auntie Lim's Kopitiam")).toBeInTheDocument();
  });

  it("humanises the action code when formatAction is omitted", () => {
    render(<AuditLogTable entries={entries} />);
    expect(screen.getByText("Set vendor plan")).toBeInTheDocument();
    expect(screen.queryByText("set_vendor_plan")).not.toBeInTheDocument();
  });

  it("humanises hyphens as well as underscores", () => {
    render(<AuditLogTable entries={[{ ...entries[0], action: "reset-vendor_pin" }]} />);
    expect(screen.getByText("Reset vendor pin")).toBeInTheDocument();
  });

  it("maps the action through formatAction when given", () => {
    render(
      <AuditLogTable
        entries={entries}
        formatAction={(action) => (action === "set_vendor_plan" ? "Plan changed" : action)}
      />,
    );
    expect(screen.getByText("Plan changed")).toBeInTheDocument();
    expect(screen.queryByText("set_vendor_plan")).not.toBeInTheDocument();
  });

  it("renders no em dash for a missing target and exposes it to assistive tech", () => {
    const { container } = render(<AuditLogTable entries={[entries[1]]} />);
    expect(container).not.toHaveTextContent("—");
    const note = screen.getByText("No target");
    expect(note).toHaveClass("sr-only");
  });

  it("treats an empty target string like a missing one", () => {
    render(<AuditLogTable entries={[{ ...entries[1], target: "" }]} />);
    expect(screen.getByText("No target")).toBeInTheDocument();
  });

  it("renders detail as a secondary line under the action when present", () => {
    render(<AuditLogTable entries={[entries[0]]} />);
    expect(screen.getByText("plan: pro")).toBeInTheDocument();
  });

  it("uses a custom dateFormatter when given", () => {
    render(<AuditLogTable entries={[entries[0]]} dateFormatter={() => "just now"} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
  });
});

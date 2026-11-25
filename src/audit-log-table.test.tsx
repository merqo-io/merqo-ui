import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditLogTable, type AuditLogEntry } from "./audit-log-table";
import { GROUP } from "./recipes";

describe("AuditLogTable header", () => {
  it("uses the sentence-case label recipe for column headings", () => {
    const { container } = render(<AuditLogTable entries={[]} />);
    expect(container.innerHTML).not.toMatch(/uppercase|tracking-wider/);
  });

  it("filled header row is sentence case", () => {
    const { container } = render(
      <AuditLogTable
        entries={[{ id: "1", createdAt: "2025-01-01T00:00:00Z", actor: "a", action: "x", target: "t" } satisfies AuditLogEntry]}
      />,
    );
    expect(container.innerHTML).not.toMatch(/uppercase|tracking-wider/);
    const head = container.firstElementChild!.firstElementChild as HTMLElement;
    expect(head).toHaveClass("text-xs");
    expect(head).not.toHaveClass("text-sm");
  });
});

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

describe("AuditLogTable small screens", () => {
  const entry: AuditLogEntry = {
    id: "1",
    actor: "someone.with.a.very.long.address@example.com",
    action: "set_plan",
    target: "Stall",
    detail: null,
    createdAt: "2026-08-19T10:00:00.000Z",
  };

  it("stacks each row below sm and only uses the column grid from sm up", () => {
    const { container } = render(<AuditLogTable entries={[entry]} />);
    const row = screen.getByText("someone.with.a.very.long.address@example.com").parentElement as HTMLElement;
    expect(row).toHaveClass("flex", "flex-col", "sm:grid");
    expect(container.innerHTML).not.toMatch(/(^|[ "])grid-cols-\[/);
    expect(row.className).toContain("sm:grid-cols-");
  });

  it("hides the column header row below sm and labels the stacked values instead", () => {
    render(<AuditLogTable entries={[entry]} />);
    const header = screen.getAllByText("Actor")[0].parentElement as HTMLElement;
    expect(header).toHaveClass("hidden", "sm:grid");
    const actor = screen.getByText("someone.with.a.very.long.address@example.com");
    expect(actor).toHaveClass("break-words");
    expect(actor.querySelector("span")).toHaveClass("sm:hidden");
  });
});

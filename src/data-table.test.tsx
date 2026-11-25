import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "./data-table";

type Row = { id: string; name: string; amount: number };

const ROWS: Row[] = [
  { id: "1", name: "Alice", amount: 500 },
  { id: "2", name: "Bob", amount: 1200 },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { header: "Name", cell: (r) => r.name },
  { header: "Amount", cell: (r) => `$${r.amount}`, className: "text-right" },
];

describe("DataTable", () => {
  it("renders the default empty state when rows is empty", () => {
    render(<DataTable rows={[]} columns={COLUMNS} getRowKey={(r) => r.id} />);
    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });

  it("renders a custom empty state", () => {
    render(<DataTable rows={[]} columns={COLUMNS} getRowKey={(r) => r.id} emptyState="No bookings yet." />);
    expect(screen.getByText("No bookings yet.")).toBeInTheDocument();
    expect(screen.queryByText("No data yet.")).not.toBeInTheDocument();
  });

  it("renders one header per column and one row per data row", () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("$1200")).toBeInTheDocument();
  });

  it("applies a column's className to both its header and its cells", () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Amount")).toHaveClass("text-right");
    expect(screen.getByText("$500")).toHaveClass("text-right");
  });

  it("lets cells and headers wrap so long values stay readable on a phone", () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowKey={(r) => r.id} />);
    for (const el of [screen.getByText("Name"), screen.getByText("Alice")]) {
      expect(el.className).not.toContain("whitespace-nowrap");
      expect(el).toHaveClass("wrap-anywhere");
    }
  });

  it("names the table for assistive tech when given a caption", () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowKey={(r) => r.id} caption="Recent payments" />);
    expect(screen.getByRole("table", { name: "Recent payments" })).toBeInTheDocument();
  });

  it("renders no caption element by default", () => {
    const { container } = render(<DataTable rows={ROWS} columns={COLUMNS} getRowKey={(r) => r.id} />);
    expect(container.querySelector("caption")).toBeNull();
  });
});

describe("DataTable data shapes", () => {
  const LONG = "a.very.long.unbroken.address.that.would.widen.the.column@example-domain-name.com";

  it('align "end" right-aligns the header and every cell with tabular figures', () => {
    render(
      <DataTable
        rows={ROWS}
        getRowKey={(r) => r.id}
        columns={[
          { header: "Name", cell: (r) => r.name },
          { header: "Amount", cell: (r) => `$${r.amount}`, align: "end" },
        ]}
      />,
    );
    for (const el of [
      screen.getByRole("columnheader", { name: "Amount" }),
      screen.getByText("$500"),
      screen.getByText("$1200"),
    ]) {
      expect(el).toHaveClass("text-end", "tabular-nums");
    }
    expect(screen.getByText("$500")).toHaveClass("whitespace-nowrap");
  });

  it("leaves the default column as it was and keeps className composing", () => {
    render(
      <DataTable
        rows={ROWS}
        getRowKey={(r) => r.id}
        columns={[{ header: "Name", cell: (r) => r.name, className: "w-32" }]}
      />,
    );
    const cell = screen.getByText("Alice");
    expect(cell).toHaveClass("w-32", "wrap-anywhere");
    expect(cell).not.toHaveClass("text-end", "tabular-nums");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass("text-left", "w-32");
  });

  it("lets a long unbroken string wrap anywhere so it cannot widen the table", () => {
    render(
      <DataTable
        rows={[{ id: "1", name: LONG, amount: 1 }]}
        getRowKey={(r) => r.id}
        columns={[{ header: "Email", cell: (r) => r.name }]}
      />,
    );
    const cell = screen.getByText(LONG);
    expect(cell).toHaveClass("wrap-anywhere");
    expect(cell.className).not.toMatch(/break-words/);
  });
});

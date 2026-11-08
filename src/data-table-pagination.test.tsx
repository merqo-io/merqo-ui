import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "./data-table";

type Row = { id: string; name: string };

const COLUMNS: DataTableColumn<Row>[] = [{ header: "Name", cell: (r) => r.name }];
const MANY: Row[] = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `Row ${i}` }));
const noop = () => {};

describe("DataTable pagination", () => {
  it("renders only the current page and a pager", () => {
    render(
      <DataTable
        rows={MANY}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        pagination={{ page: 2, pageSize: 10, onPageChange: noop }}
      />,
    );
    expect(screen.getByText("Row 10")).toBeInTheDocument();
    expect(screen.queryByText("Row 9")).not.toBeInTheDocument();
    expect(screen.queryByText("Row 20")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("clamps an out-of-range page", () => {
    render(
      <DataTable
        rows={MANY}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        pagination={{ page: 9, pageSize: 10, onPageChange: noop }}
      />,
    );
    expect(screen.getByText("Row 20")).toBeInTheDocument();
  });

  it.each([0, -5, Number.NaN])("treats pageSize %s as 1", (pageSize) => {
    render(
      <DataTable
        rows={MANY.slice(0, 3)}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        pagination={{ page: Number.NaN, pageSize, onPageChange: noop }}
      />,
    );
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    expect(screen.queryByText("Row 1")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("omits the pager when everything fits on one page", () => {
    render(
      <DataTable
        rows={MANY.slice(0, 3)}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        pagination={{ page: 1, pageSize: 10, onPageChange: noop }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
  });

  it("accepts a node as the empty state", () => {
    render(
      <DataTable
        rows={[]}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        emptyState={<button type="button">Add one</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Add one" })).toBeInTheDocument();
  });
});

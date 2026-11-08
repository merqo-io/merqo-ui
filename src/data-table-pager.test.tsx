import { describe, it, expect, vi } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTablePager, useDataTablePage } from "./data-table-pager";

describe("DataTablePager", () => {
  it("shows the position and disables previous on the first page", () => {
    render(<DataTablePager page={1} pageCount={3} onPageChange={() => {}} />);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });

  it("disables next on the last page", () => {
    render(<DataTablePager page={3} pageCount={3} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("changes page by touch and uses 44px targets", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<DataTablePager page={2} pageCount={3} onPageChange={onPageChange} />);
    const next = screen.getByRole("button", { name: "Next page" });
    expect(next).toHaveClass("min-h-11");
    await user.pointer({ keys: "[TouchA]", target: next });
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Previous page" }) });
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it("accepts custom labels", () => {
    render(
      <DataTablePager
        page={1}
        pageCount={2}
        onPageChange={() => {}}
        labels={{ previous: "Back", next: "Forward", position: (p, n) => `${p}/${n}` }}
      />,
    );
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forward" })).toBeInTheDocument();
  });
});

describe("useDataTablePage", () => {
  it("tracks the page and clamps to the page count", () => {
    const { result, rerender } = renderHook(({ total }) => useDataTablePage(total, 10), {
      initialProps: { total: 25 },
    });
    expect(result.current.pageCount).toBe(3);
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    rerender({ total: 5 });
    expect(result.current.page).toBe(1);
    act(() => result.current.setPage(99));
    expect(result.current.page).toBe(1);
  });
});

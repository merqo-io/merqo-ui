import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState size and role", () => {
  it("keeps the default rendering unchanged", () => {
    const { container } = render(
      <EmptyState title="Nothing yet" description="Add one" />,
    );
    expect(container.innerHTML).toBe(
      '<div class="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">' +
        '<h2 class="font-display text-2xl font-semibold tracking-tight">Nothing yet</h2>' +
        '<p class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Add one</p></div>',
    );
  });

  it("compact renders the title as a muted paragraph, not a heading", () => {
    const { container } = render(
      <EmptyState size="compact" title="No vendors yet." />,
    );
    expect(screen.queryByRole("heading")).toBeNull();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass(
      "rounded-xl",
      "border-dashed",
      "bg-card/50",
      "px-4",
      "py-6",
    );
    expect(root).not.toHaveClass("rounded-2xl");
    const title = screen.getByText("No vendors yet.");
    expect(title.tagName).toBe("P");
    expect(title).toHaveClass("text-sm", "text-muted-foreground");
  });

  it("compact keeps description, icon and actions", () => {
    render(
      <EmptyState
        size="compact"
        icon={<svg data-testid="icon" />}
        title="No vendors yet."
        description="Invite one."
        actions={<button>Invite</button>}
      />,
    );
    expect(screen.getByText("Invite one.")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  });

  it("forwards role to the root", () => {
    render(<EmptyState size="compact" role="status" title="No vendors yet." />);
    expect(screen.getByRole("status")).toHaveTextContent("No vendors yet.");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";
import { CARD_TITLE } from "./recipes";

describe("EmptyState size and role", () => {
  it("keeps the default dashed slot with a heading and one sentence", () => {
    const { container } = render(
      <EmptyState title="Nothing yet" description="Add one" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("rounded-xl", "text-card-foreground");
    expect(root).toHaveClass("border", "border-dashed", "bg-card/50", "text-center");
    expect(screen.getByRole("heading", { level: 2, name: "Nothing yet" })).toHaveClass(
      ...CARD_TITLE.split(" "),
    );
    expect(screen.getByText("Add one")).toBeInTheDocument();
  });

  it("compact renders the title as a muted paragraph, not a heading", () => {
    const { container } = render(
      <EmptyState size="compact" title="No vendors yet." />,
    );
    expect(screen.queryByRole("heading")).toBeNull();
    const title = screen.getByText("No vendors yet.");
    expect(title.tagName).toBe("P");
    expect(title).toHaveClass("text-sm", "text-muted-foreground");
    expect(container.firstElementChild).toBeTruthy();
  });

  it("compact drops the dashed box: no border, no card background", () => {
    const { container } = render(
      <EmptyState size="compact" title="No vendors yet." />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toMatch(/bg-card/);
    expect(root.className).not.toMatch(/(^|\s)border(\s|$)/);
    expect(root.className).not.toMatch(/shadow/);
    expect(root).toHaveClass("border-0", "p-4");
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

  it("renders children as the sentence and primary and secondary actions", () => {
    render(
      <EmptyState
        title="Empty"
        primaryAction={<button>One</button>}
        secondaryAction={<button>Two</button>}
      >
        Body text
      </EmptyState>,
    );
    expect(screen.getByText("Body text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
  });

  it("hides the decorative icon and keeps it bare, not a tinted tile", () => {
    const { container } = render(
      <EmptyState title="Empty" icon={<svg data-testid="icon" />} />,
    );
    const media = container.querySelector('[data-slot="empty-icon"]') as HTMLElement;
    expect(media).toHaveAttribute("aria-hidden", "true");
    expect(media).toHaveAttribute("data-variant", "default");
    expect(media).not.toHaveClass("bg-muted");
  });
});

describe("EmptyState caller padding", () => {
  it.each(["default", "compact"] as const)(
    "%s: a caller padding class leaves no responsive padding on the root",
    (size) => {
      for (const pad of ["py-2", "p-2"]) {
        const { container, unmount } = render(
          <EmptyState size={size} title="Empty" className={pad} />,
        );
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass(pad);
        expect(root.className).not.toMatch(/md:p/);
        unmount();
      }
    },
  );
});

describe("EmptyState media and preview", () => {
  it("media wins over icon and sits in a clipped fixed-aspect frame", () => {
    const { container } = render(
      <EmptyState
        title="No photos"
        icon={<svg data-testid="icon" />}
        media={<img alt="" src="/x.png" data-testid="media" />}
      />,
    );
    expect(screen.queryByTestId("icon")).toBeNull();
    const frame = screen.getByTestId("media").parentElement as HTMLElement;
    expect(frame).toHaveClass("aspect-video", "overflow-hidden", "rounded-lg");
    expect(container.contains(frame)).toBe(true);
  });

  it("preview is aria-hidden, inert, faded and above the title", () => {
    render(
      <EmptyState
        title="No orders yet"
        preview={<div data-testid="row">Sample row</div>}
      />,
    );
    const wrap = screen.getByTestId("row").parentElement as HTMLElement;
    expect(wrap).toHaveAttribute("aria-hidden", "true");
    expect(wrap).toHaveAttribute("inert");
    expect(wrap).toHaveClass("opacity-60");
    const title = screen.getByRole("heading", { name: "No orders yet" });
    expect(
      wrap.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("preview content stays out of the accessibility tree", () => {
    render(
      <EmptyState title="Empty" preview={<button>Sample</button>} />,
    );
    expect(screen.queryByRole("button", { name: "Sample" })).toBeNull();
  });
});

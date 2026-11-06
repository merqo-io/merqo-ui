import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { TierChip } from "./tier-chip";

describe("PageHeader", () => {
  it("renders eyebrow, one h1, description and action", () => {
    render(
      <PageHeader
        eyebrow="Admin"
        title="Vendors"
        description="Who has access"
        action={<button>New</button>}
      />,
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Vendors" })).toBeInTheDocument();
    expect(screen.getByText("Who has access")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });

  it("treats children as the muted line and prefers description when both are given", () => {
    const { rerender } = render(<PageHeader title="T">Line from children</PageHeader>);
    expect(screen.getByText("Line from children")).toBeInTheDocument();
    rerender(
      <PageHeader title="T" description="Described">
        ignored
      </PageHeader>,
    );
    expect(screen.getByText("Described")).toBeInTheDocument();
    expect(screen.queryByText("ignored")).not.toBeInTheDocument();
  });

  it("renders the back slot, omits an absent eyebrow and forwards root props", () => {
    render(<PageHeader title="T" back={<a href="/x">Back</a>} data-testid="root" className="extra" />);
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByTestId("root")).toHaveClass("extra");
    expect(document.querySelector("p")).toBeNull();
  });

  it("sizes the title down on a phone when responsive", () => {
    render(<PageHeader title="T" responsive />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-3xl", "sm:text-4xl");
  });
});

describe("EmptyState", () => {
  it("renders title, description, icon and actions", () => {
    render(
      <EmptyState
        icon={<svg data-testid="icon" />}
        title="Nothing yet"
        description="Add one"
        actions={<button>Add</button>}
        className="mine"
      />,
    );
    expect(screen.getByRole("heading", { name: "Nothing yet" })).toBeInTheDocument();
    expect(screen.getByText("Add one")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    expect(screen.getByRole("heading").parentElement).toHaveClass("mine");
  });

  it("accepts the sentence as children and omits empty slots", () => {
    render(<EmptyState title="Empty">Try later</EmptyState>);
    expect(screen.getByText("Try later")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeNull();
  });
});

describe("StatCard", () => {
  it("renders label, value, caption and the delta pill", () => {
    render(<StatCard label="Orders" value="12" caption="this week" delta={5} />);
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("this week")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
  });

  it("shows the icon in the label row, but a delta wins over it", () => {
    const { rerender } = render(
      <StatCard label="L" value="1" icon={<svg data-testid="icon" />} />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    rerender(<StatCard label="L" value="1" delta={3} icon={<svg data-testid="icon" />} />);
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(screen.getByText("3%")).toBeInTheDocument();
  });

  it("styles the featured card and puts className on the card shell", () => {
    render(<StatCard label="L" value="9" featured className="mine" />);
    const card = screen.getByText("9").closest(".mine");
    expect(card).not.toBeNull();
    expect(card).toHaveClass("bg-primary/[0.05]");
    expect(screen.getByText("9")).toHaveClass("text-primary");
  });
});

describe("TierChip", () => {
  it("labels known and unknown tiers via tierLabel", () => {
    const { rerender } = render(<TierChip tier="qkit" />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    rerender(<TierChip tier="free" />);
    expect(screen.getByText("Free")).toHaveClass("bg-muted");
    rerender(<TierChip tier="starter" className="mine" />);
    expect(screen.getByText("Starter")).toHaveClass("bg-primary/12", "mine");
    rerender(<TierChip tier="enterprise" />);
    expect(screen.getByText("Enterprise")).toHaveClass("bg-secondary");
  });
});

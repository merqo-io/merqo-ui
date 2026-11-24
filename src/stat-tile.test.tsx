import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatTile, DeltaPill } from "./stat-tile";

describe("DeltaPill", () => {
  it("renders nothing for a null pct", () => {
    const { container } = render(<DeltaPill pct={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an up arrow and percentage for a positive pct", () => {
    render(<DeltaPill pct={12.4} />);
    expect(screen.getByText("12%")).toBeInTheDocument();
  });

  it("colours the up pill with the success token, no literal emerald", () => {
    render(<DeltaPill pct={3} />);
    const pill = screen.getByText("3%").closest("span");
    expect(pill).toHaveClass("bg-success/12", "text-success");
    expect(pill?.className).not.toContain("emerald");
  });

  it("renders a down arrow and the default down color for a negative pct", () => {
    render(<DeltaPill pct={-8} />);
    const pill = screen.getByText("8%").closest("span");
    expect(pill).toHaveClass("bg-destructive/12");
  });

  it("applies a custom downClassName override", () => {
    render(
      <DeltaPill
        pct={-8}
        downClassName="bg-status-cancelled/12 text-status-cancelled"
      />,
    );
    const pill = screen.getByText("8%").closest("span");
    expect(pill).toHaveClass("bg-status-cancelled/12");
    expect(pill).not.toHaveClass("bg-destructive/12");
  });

  it("applies the tooltip as a native title", () => {
    render(<DeltaPill pct={5} tooltip="vs the previous period" />);
    expect(screen.getByText("5%").closest("span")).toHaveAttribute(
      "title",
      "vs the previous period",
    );
  });
});

describe("StatTile", () => {
  it("renders label and value in label-above-value order by default", () => {
    render(<StatTile label="Revenue" value="$120" />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$120")).toBeInTheDocument();
  });

  it("renders value-above-label when reverse is set", () => {
    render(<StatTile label="Enrolled" value="42" reverse />);
    const root = screen.getByText("42").closest("div")?.parentElement;
    const children = Array.from(root?.children ?? []);
    const valueRowIndex = children.findIndex((c) =>
      c.textContent?.includes("42"),
    );
    const labelIndex = children.findIndex((c) => c.textContent === "Enrolled");
    expect(valueRowIndex).toBeLessThan(labelIndex);
  });

  it("renders a delta pill from a numeric delta prop", () => {
    render(<StatTile label="Orders" value="10" delta={7} />);
    expect(screen.getByText("7%")).toBeInTheDocument();
  });

  it("renders deltaSlot content instead of a pill when both could apply", () => {
    render(
      <StatTile
        label="Orders"
        value="10"
        delta={7}
        deltaSlot={<span>custom</span>}
      />,
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(screen.queryByText("7%")).not.toBeInTheDocument();
  });

  it("renders a caption when provided", () => {
    render(<StatTile label="Revenue" value="$120" caption="$900 all time" />);
    expect(screen.getByText("$900 all time")).toBeInTheDocument();
  });

  it("applies valueClassName to the value element", () => {
    render(
      <StatTile label="Revenue" value="$120" valueClassName="font-mono" />,
    );
    expect(screen.getByText("$120")).toHaveClass("font-mono");
  });

  it("renders valueTrailing content beside the value", () => {
    render(
      <StatTile
        label="Revenue"
        value="$120"
        valueTrailing={<span>flat</span>}
      />,
    );
    expect(screen.getByText("flat")).toBeInTheDocument();
  });

  it("applies the hint as a native title on the root", () => {
    const { container } = render(
      <StatTile label="Fulfilled" value="8/10" hint="2 cancelled" />,
    );
    expect(container.firstChild).toHaveAttribute("title", "2 cancelled");
  });
});

describe("StatTile presentation overrides", () => {
  it.each([false, true])(
    "preserves caller label/container classes for reverse=%s",
    (reverse) => {
      render(
        <StatTile
          label="Revenue variant"
          value="$12"
          reverse={reverse}
          className="gap-1"
          labelClassName="text-xs tracking-wide"
        />,
      );
      const label = screen.getByText("Revenue variant");
      expect(label).toHaveClass("text-xs", "tracking-wide");
      expect(label.closest("div.flex-col")).toHaveClass("gap-1");
    },
  );
});

describe("StatTile card", () => {
  it("renders the ElevatedCard chrome on the root when card is set", () => {
    const { container } = render(
      <StatTile card label="Orders" value="4" className="mine" hint="h" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("bg-card", "border", "p-4", "mine");
    expect(root).toHaveAttribute("title", "h");
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("has no card chrome by default", () => {
    const { container } = render(<StatTile label="Orders" value="4" />);
    expect(container.firstElementChild).not.toHaveClass("bg-card");
  });
});

describe("StatTile legibility", () => {
  it("keeps the label at text-xs or larger with no arbitrary size or tracking", () => {
    render(<StatTile label="Legible" value="1" />);
    const label = screen.getByText("Legible");
    expect(label).toHaveClass("text-xs");
    expect(label.className).not.toMatch(/text-\[|tracking-|uppercase/);
  });

  it.each(["xs", "sm"] as const)("keeps the %s delta pill at text-xs", (deltaSize) => {
    render(<StatTile label="Delta" value="1" delta={12} deltaSize={deltaSize} />);
    const pill = screen.getByText("12%").closest("span");
    expect(pill).toHaveClass("text-xs");
    expect(pill?.className).not.toMatch(/text-\[/);
  });
});

describe("StatTile bottom anchoring", () => {
  it("pushes the caption to the bottom of a stretched card", () => {
    render(<StatTile card label="Orders" value="4" caption="3 pending" />);
    const caption = screen.getByText("3 pending");
    expect(caption).toHaveClass("mt-auto");
    expect(caption.parentElement).toHaveClass("flex-col");
  });

  it("keeps the label row top-aligned so the label stays on one baseline", () => {
    render(<StatTile card label="Orders" value="4" delta={5} />);
    expect(screen.getByText("Orders").parentElement).toHaveClass("items-start");
  });
});

describe("StatTile long values", () => {
  it("wraps the value and caption instead of truncating them", () => {
    render(<StatTile label="Revenue" value="S$12,345,678.90" caption="a very long caption" />);
    for (const el of [screen.getByText("S$12,345,678.90"), screen.getByText("a very long caption")]) {
      expect(el).not.toHaveClass("truncate");
      expect(el).toHaveClass("break-words");
    }
  });

  it("wraps the value beside a trailing node too", () => {
    render(<StatTile label="Revenue" value="S$12,345,678.90" valueTrailing={<span>x</span>} />);
    const value = screen.getByText("S$12,345,678.90");
    expect(value).not.toHaveClass("truncate");
    expect(value).toHaveClass("min-w-0", "break-words");
  });
});

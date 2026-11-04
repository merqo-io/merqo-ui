import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PricingLadder } from "./pricing-ladder";
import type { CatalogPlan, PlanCatalog } from "./plan-catalog";

const plan = (
  slug: string,
  name: string,
  monthly: number,
  annual: number,
): CatalogPlan => ({
  slug,
  kind: "x",
  name,
  monthly_cents: monthly,
  annual_cents: annual,
  kits: [],
});

const CATALOG: PlanCatalog = {
  plans: [
    plan("free", "Free", 0, 0),
    plan("loopkit", "loopkit", 1000, 10000),
    plan("starter", "Starter", 1200, 12000),
    plan("stockkit", "stockkit", 1500, 15000),
    plan("qkit", "qkit", 1600, 16000),
    plan("all_access", "All-Access", 3600, 36000),
  ],
  event_pass: { per_cup_cents: 15, min_cents: 1400, cap_cents: 2800, days: 2 },
};

const OTHER: PlanCatalog = {
  plans: [
    plan("starter", "Starter", 1300, 13000),
    plan("qkit", "qkit", 1733, 17330),
    plan("all_access", "All-Access", 4100, 41000),
  ],
  event_pass: { per_cup_cents: 20, min_cents: 1500, cap_cents: 3100, days: 1 },
};

const card = (name: string) =>
  screen.getByRole("heading", { name, level: 3 }).closest("li") as HTMLElement;

describe("PricingLadder prices", () => {
  it("renders every price from the catalog", () => {
    render(<PricingLadder catalog={CATALOG} />);
    expect(card("qkit")).toHaveTextContent("S$16 a month");
    expect(within(card("qkit")).getByText("or S$160 a year")).toBeInTheDocument();
    expect(within(card("All-Access")).getByText("or S$360 a year")).toBeInTheDocument();
    expect(within(card("Starter")).getByText("or S$120 a year")).toBeInTheDocument();
  });

  it("renders different numbers for a different catalog", () => {
    render(<PricingLadder catalog={OTHER} />);
    expect(within(card("qkit")).getByText(/S\$17\.33/)).toBeInTheDocument();
    expect(screen.getByText("or S$173.30 a year")).toBeInTheDocument();
    expect(screen.getByText("or S$410 a year")).toBeInTheDocument();
    expect(screen.queryByText(/S\$16\b/)).not.toBeInTheDocument();
    const pass = screen.getByRole("region", { name: "Event Pass" });
    expect(pass).toHaveTextContent("minimum of S$15");
    expect(pass).toHaveTextContent("20c per cup");
    expect(pass).toHaveTextContent("more than S$31");
    expect(pass).toHaveTextContent("covers 1 day.");
  });

  it("shows Free with no annual line for the free plan", () => {
    render(<PricingLadder catalog={CATALOG} />);
    const free = within(card("Free"));
    expect(free.getByText("Free", { selector: "p" })).toBeInTheDocument();
    expect(free.queryByText(/a year/)).not.toBeInTheDocument();
    expect(free.queryByText(/a month/)).not.toBeInTheDocument();
  });
});

describe("PricingLadder highlight", () => {
  const recommended = () => screen.getAllByText("Recommended");

  it("highlights qkit by default", () => {
    render(<PricingLadder catalog={CATALOG} />);
    expect(recommended()).toHaveLength(1);
    expect(card("qkit")).toHaveAttribute("aria-current", "true");
    expect(within(card("qkit")).getByText("Recommended")).toBeInTheDocument();
  });

  it("highlights all_access when asked", () => {
    render(<PricingLadder catalog={CATALOG} highlight="all_access" />);
    expect(card("All-Access")).toHaveAttribute("aria-current", "true");
    expect(card("qkit")).not.toHaveAttribute("aria-current");
  });

  it("falls back to all_access when qkit is absent", () => {
    const catalog = { ...CATALOG, plans: CATALOG.plans.filter((p) => p.slug !== "qkit") };
    render(<PricingLadder catalog={catalog} />);
    expect(card("All-Access")).toHaveAttribute("aria-current", "true");
  });

  it("falls back to qkit when all_access is absent", () => {
    const catalog = { ...CATALOG, plans: CATALOG.plans.filter((p) => p.slug !== "all_access") };
    render(<PricingLadder catalog={catalog} highlight="all_access" />);
    expect(card("qkit")).toHaveAttribute("aria-current", "true");
  });

  it("never highlights Starter and highlights nothing without either plan", () => {
    const catalog = { ...CATALOG, plans: [plan("starter", "Starter", 1200, 12000)] };
    render(<PricingLadder catalog={catalog} />);
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
    expect(card("Starter")).not.toHaveAttribute("aria-current");
  });
});

describe("PricingLadder copy", () => {
  it("gives Starter an identity frame and honours description overrides", () => {
    render(
      <PricingLadder
        catalog={CATALOG}
        descriptions={{ qkit: "Queue and order.", starter: "Custom starter." }}
      />,
    );
    expect(within(card("qkit")).getByText("Queue and order.")).toBeInTheDocument();
    expect(within(card("Starter")).getByText("Custom starter.")).toBeInTheDocument();
  });

  it("uses the default Starter description", () => {
    render(<PricingLadder catalog={CATALOG} />);
    expect(
      within(card("Starter")).getByText("For testing the waters as a solo operator."),
    ).toBeInTheDocument();
  });

  it("renders no percentages, discount copy, strikethrough or em dash", () => {
    const { container } = render(<PricingLadder catalog={CATALOG} />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/%/);
    expect(text).not.toMatch(/save|discount|effective/i);
    expect(text).not.toMatch(/—/);
    expect(container.querySelector("s, del, strike")).toBeNull();
    expect(container.innerHTML).not.toMatch(/line-through/);
  });
});

describe("PricingLadder options", () => {
  it("renders the Event Pass section from the catalog", () => {
    render(<PricingLadder catalog={CATALOG} />);
    const pass = screen.getByRole("region", { name: "Event Pass" });
    expect(pass).toHaveTextContent("minimum of S$14");
    expect(pass).toHaveTextContent("15c per cup");
    expect(pass).toHaveTextContent("more than S$28");
    expect(pass).toHaveTextContent("covers 2 days.");
  });

  it("hides the Event Pass when showEventPass is false", () => {
    render(<PricingLadder catalog={CATALOG} showEventPass={false} />);
    expect(screen.queryByText("Event Pass")).not.toBeInTheDocument();
  });

  it("filters by slugs and keeps catalog order", () => {
    render(<PricingLadder catalog={CATALOG} slugs={["qkit", "free"]} />);
    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["Free", "qkit", "Event Pass"]);
  });

  it("calls renderAction once per rendered plan", () => {
    const renderAction = vi.fn((p: CatalogPlan) => <button>{`Pick ${p.slug}`}</button>);
    render(<PricingLadder catalog={CATALOG} slugs={["qkit", "starter"]} renderAction={renderAction} />);
    expect(renderAction).toHaveBeenCalledTimes(2);
    expect(within(card("qkit")).getByRole("button", { name: "Pick qkit" })).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faq } from "./faq";
import { EYEBROW, PAGE_TITLE } from "./recipes";

const ITEMS = [
  { question: "Is it free?", answer: "Yes." },
  { question: "Do I need an app?", answer: <span>No app needed.</span> },
];

describe("Faq", () => {
  it("renders each question as a disclosure", () => {
    render(<Faq items={ITEMS} />);
    expect(screen.getByText("Is it free?")).toBeInTheDocument();
    expect(document.querySelectorAll("details")).toHaveLength(2);
  });

  it("uses a 44px summary that a touch reaches", async () => {
    const user = userEvent.setup();
    render(<Faq items={ITEMS} />);
    const summary = screen.getByText("Is it free?").closest("summary")!;
    expect(summary).toHaveClass("min-h-11");
    let clicks = 0;
    summary.addEventListener("click", () => (clicks += 1));
    // jsdom does not toggle <details>, so assert the touch lands on the summary.
    await user.pointer({ keys: "[TouchA]", target: summary });
    expect(clicks).toBe(1);
    expect(summary.closest("details")).not.toBeNull();
  });

  it("renders optional heading, eyebrow and anchor id", () => {
    render(<Faq items={ITEMS} id="faq" eyebrow="Questions" title="Still wondering?" />);
    expect(screen.getByRole("heading", { name: "Still wondering?" })).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
    expect(document.getElementById("faq")).not.toBeNull();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<Faq items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Faq type", () => {
  it("uses the eyebrow and page title recipes, left-aligned", () => {
    render(<Faq items={ITEMS} eyebrow="Questions" title="Answers" />);
    const eyebrow = screen.getByText("Questions");
    expect(eyebrow).toHaveClass(...EYEBROW.split(" "), "text-left");
    const title = screen.getByRole("heading", { name: "Answers" });
    expect(title).toHaveClass(...PAGE_TITLE.split(" "), "text-left", "mt-3");
  });
});

describe("Faq shape", () => {
  it("takes its corners from the kit radius token", () => {
    render(<Faq items={ITEMS} />);
    const item = document.querySelector("details") as HTMLElement;
    expect(item).toHaveClass("rounded-xl");
    expect(item.className).not.toMatch(/rounded-(\[|lg|2xl)|shadow/);
  });
});

describe("Faq summary", () => {
  it("hides the default marker and top-aligns as separate classes", () => {
    render(<Faq items={ITEMS} />);
    const summary = document.querySelector("summary") as HTMLElement;
    expect(summary).toHaveClass("[&::-webkit-details-marker]:hidden");
    expect(summary).toHaveClass("items-start");
  });
});

describe("Faq reduced motion", () => {
  it("drops the icon rotation transition when motion is reduced", () => {
    render(<Faq items={ITEMS} />);
    const icon = document.querySelector("summary [aria-hidden='true']")!;
    expect(icon).toHaveClass("motion-reduce:transition-none");
  });
});

describe("Faq height motion", () => {
  it("animates the details content height with a reduced-motion guard", () => {
    render(<Faq items={ITEMS} />);
    const details = document.querySelector("details")!;
    for (const cls of [
      "[interpolate-size:allow-keywords]",
      "details-content:h-0",
      "details-content:overflow-clip",
      "details-content:transition-[height,content-visibility]",
      "details-content:[transition-behavior:allow-discrete]",
      "open:details-content:h-auto",
      "open:details-content:duration-250",
      "motion-reduce:details-content:transition-none",
    ]) {
      expect(details).toHaveClass(cls);
    }
  });

  it("renders on the server and carries no client directive", async () => {
    const { renderToString } = await import("react-dom/server");
    const { readFileSync } = await import("node:fs");
    expect(renderToString(<Faq items={ITEMS} />)).toContain("Is it free?");
    expect(readFileSync(`${process.cwd()}/src/faq.tsx`, "utf8")).not.toContain("use client");
  });
});

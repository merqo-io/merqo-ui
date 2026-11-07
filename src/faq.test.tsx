import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faq } from "./faq";

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

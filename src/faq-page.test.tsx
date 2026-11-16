// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqPage, faqJsonLd, type FaqGroup } from "./faq-page";

const groups: FaqGroup[] = [
  {
    id: "orders",
    heading: "Orders",
    rows: [
      { q: "One?", a: "Yes." },
      { q: "Two?", a: "No." },
    ],
  },
  { id: "empty", heading: "Nothing here", rows: [] },
  { heading: "Billing", rows: [{ q: "Three?", a: "Maybe." }] },
];

function ldOf(container: HTMLElement) {
  const el = container.querySelector('script[type="application/ld+json"]');
  return el ? JSON.parse(el.textContent ?? "") : null;
}

describe("FaqPage", () => {
  it("renders the title and intro", () => {
    render(<FaqPage title="Questions" intro="Short answers." groups={groups} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Questions" }),
    ).toBeTruthy();
    expect(screen.getByText("Short answers.")).toBeTruthy();
  });

  it("renders one section per non-empty group with heading and id", () => {
    const { container } = render(<FaqPage title="Q" groups={groups} />);
    const sections = container.querySelectorAll("section");
    expect(sections).toHaveLength(2);
    expect(sections[0].id).toBe("orders");
    expect(sections[0].querySelector("h2")?.textContent).toBe("Orders");
    expect(sections[0].className).toContain("scroll-mt-");
    expect(sections[1].querySelector("h2")?.textContent).toBe("Billing");
    expect(screen.queryByText("Nothing here")).toBeNull();
  });

  it("omits the h2 when a group has no heading", () => {
    const { container } = render(
      <FaqPage title="Q" groups={[{ rows: [{ q: "A?", a: "B." }] }]} />,
    );
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelectorAll("details")).toHaveLength(1);
  });

  it("opens a row by touch", async () => {
    const user = userEvent.setup();
    const { container } = render(<FaqPage title="Q" groups={groups} />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    await user.pointer({ keys: "[TouchA]", target: screen.getByText("One?") });
    expect(details.open).toBe(true);
  });

  it("renders title and intro only when no group has rows", () => {
    const { container } = render(
      <FaqPage title="Q" intro="Hi" groups={[{ heading: "X", rows: [] }]} />,
    );
    expect(container.querySelector("section")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("Hi")).toBeTruthy();
  });

  it("renders the closing slot", () => {
    render(
      <FaqPage title="Q" groups={groups} closing={<p>Write to us.</p>} />,
    );
    expect(screen.getByText("Write to us.")).toBeTruthy();
  });

  it("emits JSON-LD matching the rows in order", () => {
    const { container } = render(<FaqPage title="Q" groups={groups} />);
    const ld = ldOf(container);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity.map((e: { name: string }) => e.name)).toEqual([
      "One?",
      "Two?",
      "Three?",
    ]);
  });

  it("omits JSON-LD with jsonLd false", () => {
    const { container } = render(
      <FaqPage title="Q" groups={groups} jsonLd={false} />,
    );
    expect(ldOf(container)).toBeNull();
  });

  it("escapes < so an answer cannot close the script element", () => {
    const { container } = render(
      <FaqPage
        title="Q"
        groups={[{ rows: [{ q: "Hack?", a: "</script><b>x</b>" }] }]}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).not.toContain("</script>");
    expect(script?.innerHTML).toContain("\\u003c/script>");
    expect(ldOf(container).mainEntity[0].acceptedAnswer.text).toBe(
      "</script><b>x</b>",
    );
  });

  it("applies className to the root", () => {
    const { container } = render(
      <FaqPage title="Q" groups={groups} className="extra" />,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "extra",
    );
  });
});

describe("faqJsonLd", () => {
  it("returns the schema.org FAQPage shape", () => {
    const answer = (text: string) => ({ "@type": "Answer", text });
    expect(faqJsonLd(groups)).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "One?", acceptedAnswer: answer("Yes.") },
        { "@type": "Question", name: "Two?", acceptedAnswer: answer("No.") },
        { "@type": "Question", name: "Three?", acceptedAnswer: answer("Maybe.") },
      ],
    });
  });
});

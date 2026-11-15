// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqRows } from "./faq-rows";

const rows = [
  { q: "One?", a: "Yes." },
  { q: "Two?", a: "Yes." },
];

describe("FaqRows", () => {
  it("renders one ruled details row per question", () => {
    const { container } = render(<FaqRows rows={rows} />);
    expect(container.querySelectorAll("details[data-faq-row]")).toHaveLength(2);
    expect(container.textContent).not.toContain("—");
    expect(
      container
        .querySelector("summary")
        ?.classList.contains("[&::-webkit-details-marker]:hidden"),
    ).toBe(true);
  });
  it("opens a row by touch", async () => {
    const user = userEvent.setup();
    const { container } = render(<FaqRows rows={rows} />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByText("One?"),
    });
    expect(details.open).toBe(true);
  });
  it("makes each summary reachable by keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(<FaqRows rows={rows} />);
    const summaries = container.querySelectorAll("summary");
    await user.tab();
    expect(document.activeElement).toBe(summaries[0]);
    await user.tab();
    expect(document.activeElement).toBe(summaries[1]);
  });
  it("opens a row on the activation click a keyboard press produces", () => {
    const { container } = render(<FaqRows rows={rows} />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    // jsdom does not turn Enter on a summary into a click; browsers do.
    fireEvent.click(container.querySelector("summary") as HTMLElement);
    expect(details.open).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusCard } from "./status-card";
import { CARD_TITLE, LABEL } from "./recipes";

describe("StatusCard", () => {
  it("uses the sentence-case label and card title recipes", () => {
    render(<StatusCard eyebrow="Offline" title="Gone" />);
    expect(screen.getByText("Offline")).toHaveClass(...LABEL.split(" "));
    expect(screen.getByRole("heading", { name: "Gone" })).toHaveClass(
      ...CARD_TITLE.split(" "),
    );
  });

  it("keeps the code as mono data and sits on a standalone surface", () => {
    const { container } = render(<StatusCard code="404" title="Not found" />);
    expect(screen.getByText("404")).toHaveClass("font-mono", "text-5xl");
    expect(container.querySelector(".rounded-2xl")).toHaveClass("shadow-sm");
  });
});

describe("StatusCard media", () => {
  it("renders media in a clipped frame above the title", () => {
    render(
      <StatusCard
        title="Gone"
        media={<img alt="" src="/x.png" data-testid="media" />}
      />,
    );
    const frame = screen.getByTestId("media").parentElement as HTMLElement;
    expect(frame).toHaveClass("overflow-hidden", "rounded-lg");
    const title = screen.getByRole("heading", { name: "Gone" });
    expect(
      frame.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders no frame without media", () => {
    const { container } = render(<StatusCard title="Gone" />);
    expect(container.querySelector(".aspect-video")).toBeNull();
  });
});

describe("StatusCard alignment", () => {
  it("reads from the left edge in the card and the wordmark", () => {
    const { container } = render(
      <StatusCard wordmark={<span>Kit</span>} title="Gone" description="d" />,
    );
    expect(container.innerHTML).not.toContain("text-center");
    expect(container.querySelector(".rounded-2xl")).toHaveClass("text-left");
  });
});

describe("StatusCard signature", () => {
  it("renders the signature aria-hidden inside the card and pads the title", () => {
    render(<StatusCard title="Gone" signature={<svg data-testid="mark" />} />);
    const wrapper = screen.getByTestId("mark").parentElement as HTMLElement;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveClass("absolute", "end-4", "pointer-events-none");
    expect(wrapper.parentElement).toHaveClass("relative");
    expect(screen.getByRole("heading", { name: "Gone" })).toHaveClass("pe-12");
  });

  it("adds no wrapper or padding without a signature", () => {
    const { container } = render(<StatusCard title="Gone" />);
    expect(container.querySelector("[aria-hidden]")).toBeNull();
    expect(screen.getByRole("heading", { name: "Gone" })).not.toHaveClass("pe-12");
  });
});

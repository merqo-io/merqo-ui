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

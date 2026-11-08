import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourActions } from "./tour-actions";

function setup(index: number, total = 3) {
  const h = { onNext: vi.fn(), onBack: vi.fn(), onSkip: vi.fn(), onFinish: vi.fn() };
  render(<TourActions index={index} total={total} {...h} />);
  return h;
}

describe("TourActions", () => {
  it("first step has no back, next and skip work by touch", async () => {
    const user = userEvent.setup();
    const h = setup(0);
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toHaveClass("min-h-11");
    await user.pointer({ keys: "[TouchA]", target: next });
    expect(h.onNext).toHaveBeenCalledTimes(1);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Skip tour" }) });
    expect(h.onSkip).toHaveBeenCalledTimes(1);
  });

  it("middle step offers back", async () => {
    const user = userEvent.setup();
    const h = setup(1);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Back" }) });
    expect(h.onBack).toHaveBeenCalledTimes(1);
  });

  it("last step finishes instead of advancing and hides skip", async () => {
    const user = userEvent.setup();
    const h = setup(2);
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Done" }) });
    expect(h.onFinish).toHaveBeenCalledTimes(1);
  });

  it("accepts custom labels", () => {
    render(
      <TourActions
        index={0}
        total={2}
        onNext={() => {}}
        onBack={() => {}}
        onSkip={() => {}}
        onFinish={() => {}}
        labels={{ next: "Continue", skip: "Not now", progress: (i, n) => `${i}/${n}` }}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});

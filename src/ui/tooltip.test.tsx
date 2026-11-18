import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

function Sample() {
  return (
    <Tooltip>
      <TooltipTrigger>trigger</TooltipTrigger>
      <TooltipContent>tip</TooltipContent>
    </Tooltip>
  );
}

function hover() {
  fireEvent.pointerMove(screen.getByText("trigger"), { pointerType: "mouse" });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Tooltip delay", () => {
  it("waits for the default 300ms settle delay before opening", () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider>
        <Sample />
      </TooltipProvider>,
    );
    hover();
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("uses an outer provider's settings instead of its own", () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider delayDuration={0}>
        <Sample />
      </TooltipProvider>,
    );
    hover();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("works without an outer provider", () => {
    vi.useFakeTimers();
    render(<Sample />);
    hover();
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("opens immediately on keyboard focus", () => {
    render(
      <TooltipProvider>
        <Sample />
      </TooltipProvider>,
    );
    fireEvent.focus(screen.getByText("trigger"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});

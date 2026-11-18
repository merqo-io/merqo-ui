// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

let writeText: ReturnType<typeof vi.fn>;

// user-event installs its own clipboard stub on setup(), so ours goes in after.
function setup() {
  const user = userEvent.setup({ delay: null });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return user;
}

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("CopyButton", () => {
  it("copies on tap, shows the copied label, then resets after 2s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = setup();
    const onCopied = vi.fn();
    render(<CopyButton value="abc" onCopied={onCopied} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Copy" }),
    });
    expect(writeText).toHaveBeenCalledWith("abc");
    expect(onCopied).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("uses custom labels", async () => {
    const user = setup();
    render(<CopyButton value="v" label="Copy ID" copiedLabel="ID copied" />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Copy ID" }),
    });
    expect(
      await screen.findByRole("button", { name: "ID copied" }),
    ).toBeInTheDocument();
  });

  it("calls onError and stays in the idle state when the write fails", async () => {
    const err = new Error("denied");
    writeText.mockRejectedValue(err);
    const onError = vi.fn();
    const onCopied = vi.fn();
    const user = setup();
    render(<CopyButton value="x" onError={onError} onCopied={onCopied} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button"),
    });
    expect(onError).toHaveBeenCalledWith(err);
    expect(onCopied).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("reports an error when the clipboard is unavailable", async () => {
    const user = setup();
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const onError = vi.fn();
    render(<CopyButton value="x" onError={onError} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button"),
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("clears the timer on unmount", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = setup();
    const { unmount } = render(<CopyButton value="x" />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button"),
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the touch target and passes props through", () => {
    render(<CopyButton value="x" size="sm" variant="ghost" className="extra" data-x="1" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("pointer-coarse:h-11", "extra");
    expect(btn).toHaveAttribute("data-x", "1");
    expect(btn).toHaveAttribute("type", "button");
  });
});

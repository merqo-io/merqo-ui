import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Timestamp } from "./timestamp";
import { formatDateTime } from "./time";

const THEN = "2026-11-07T01:30:00Z";
const ABSOLUTE = formatDateTime(THEN);
const NOW_MS = Date.parse("2026-11-07T04:30:00Z");

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("Timestamp plain variants", () => {
  it("renders date and datetime text with an ISO dateTime", () => {
    const { container } = render(
      <>
        <Timestamp value={THEN} variant="date" />
        <Timestamp value={THEN} variant="datetime" />
      </>,
    );
    expect(screen.getByText("7 Nov 2026")).toBeInTheDocument();
    expect(screen.getByText(ABSOLUTE)).toBeInTheDocument();
    const times = container.querySelectorAll("time");
    expect(times[0]).toHaveAttribute("dateTime", "2026-11-07T01:30:00.000Z");
    expect(times[0]).toHaveClass("tabular-nums");
    expect(container.querySelector("button, [role=button]")).toBeNull();
  });

  it("renders a dash with no dateTime for an invalid value", () => {
    const { container } = render(<Timestamp value="nope" />);
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("[role=button]")).toBeNull();
  });
});

describe("Timestamp relative", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(NOW_MS);
    setHidden(false);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("server-renders the absolute time", () => {
    const html = renderToString(<Timestamp value={THEN} />);
    expect(html).toContain(ABSOLUTE);
    expect(html).not.toContain("ago");
  });

  it("switches from absolute to relative after mount", () => {
    render(<Timestamp value={THEN} />);
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("3h ago");
    expect(trigger).toHaveAttribute("aria-label", `3h ago, ${ABSOLUTE}`);
    expect(trigger).toHaveAttribute("dateTime", "2026-11-07T01:30:00.000Z");
  });

  it("updates once a minute", () => {
    render(<Timestamp value={NOW_MS - 30_000} />);
    expect(screen.getByRole("button")).toHaveTextContent("just now");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole("button")).toHaveTextContent("1m ago");
  });

  it("shares one interval across instances and clears it on unmount", () => {
    const spy = vi.spyOn(globalThis, "setInterval");
    const clear = vi.spyOn(globalThis, "clearInterval");
    const first = render(<Timestamp value={THEN} />);
    const second = render(<Timestamp value={THEN} />);
    expect(spy).toHaveBeenCalledTimes(1);
    first.unmount();
    expect(clear).not.toHaveBeenCalled();
    second.unmount();
    expect(clear).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    clear.mockRestore();
  });

  it("pauses while hidden and refreshes when visible again", () => {
    render(<Timestamp value={NOW_MS - 30_000} />);
    setHidden(true);
    act(() => {
      vi.setSystemTime(NOW_MS + 5 * 60_000);
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByRole("button")).toHaveTextContent("just now");
    act(() => setHidden(false));
    expect(screen.getByRole("button")).toHaveTextContent("15m ago");
  });

  it("does not tick when now is given", () => {
    const spy = vi.spyOn(globalThis, "setInterval");
    render(<Timestamp value={THEN} now={NOW_MS} />);
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveTextContent("3h ago");
    spy.mockRestore();
  });

  it("opens the exact time on touch", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Timestamp value={THEN} />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button") });
    expect(await screen.findByText(ABSOLUTE)).toBeVisible();
  });

  it("opens the exact time from the keyboard", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Timestamp value={THEN} />);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Enter}");
    expect(await screen.findByText(ABSOLUTE)).toBeVisible();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles on Space keyup exactly once", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Timestamp value={THEN} />);
    await user.tab();
    const trigger = screen.getByRole("button");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("does not paint a stale clock when remounted after idling", () => {
    const first = render(<Timestamp value={NOW_MS - 30_000} />);
    expect(screen.getByRole("button")).toHaveTextContent("just now");
    first.unmount();
    vi.setSystemTime(NOW_MS + 60 * 60_000);
    let firstFrame = "";
    render(
      <div
        ref={(el) => {
          if (el && !firstFrame) firstFrame = el.textContent ?? "";
        }}
      >
        <Timestamp value={NOW_MS - 30_000} />
      </div>,
    );
    expect(firstFrame).toBe(formatDateTime(NOW_MS - 30_000));
    expect(screen.getByRole("button")).toHaveTextContent("1h ago");
    expect(screen.getByRole("button")).not.toHaveTextContent("just now");
  });

  it("keeps instances on one clock when another mounts later", () => {
    render(<Timestamp value={NOW_MS - 30_000} />);
    act(() => {
      vi.setSystemTime(NOW_MS + 30_000);
    });
    render(<Timestamp value={NOW_MS - 30_000} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent(buttons[1].textContent ?? "");
  });
});

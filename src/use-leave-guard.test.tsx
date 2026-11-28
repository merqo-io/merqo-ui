// @vitest-environment jsdom
import { cleanup, render, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLeaveGuard } from "./use-leave-guard";

function Links() {
  return (
    <div>
      <a href="/other">other</a>
      <a href="https://example.org/x">external</a>
      <a href="#section">hash</a>
      <a href="/other" download>
        download
      </a>
      <a href="/other" target="_blank">
        blank
      </a>
      <a href="/other" target="_self">
        self
      </a>
    </div>
  );
}

function guard(when: boolean, message?: string) {
  return renderHook(({ w }) => useLeaveGuard(w, message), {
    initialProps: { w: when },
  });
}

function clickLink(name: string, init?: MouseEventInit) {
  const link = Array.from(document.querySelectorAll("a")).find(
    (a) => a.textContent === name,
  ) as HTMLAnchorElement;
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  // test-setup cancels every anchor click, which the hook rightly treats as
  // already handled, so cancelling is ignored here and a stopped click is
  // detected by it never reaching the anchor.
  event.preventDefault = () => {};
  let reached = false;
  link.addEventListener("click", () => {
    reached = true;
  });
  link.dispatchEvent(event);
  return { blocked: !reached };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useLeaveGuard", () => {
  it("does nothing while `when` is false", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Links />);
    guard(false);
    expect(clickLink("other").blocked).toBe(false);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("raises the browser prompt on beforeunload", () => {
    guard(true);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
  });

  it("blocks a link to another page, same-origin or not, on Cancel", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Links />);
    guard(true, "Stay?");
    expect(clickLink("other").blocked).toBe(true);
    expect(clickLink("external").blocked).toBe(true);
    expect(confirm).toHaveBeenCalledWith("Stay?");
  });

  it("lets the link through on OK", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Links />);
    guard(true);
    expect(clickLink("other").blocked).toBe(false);
  });

  it("uses a generic default message without an em dash", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Links />);
    guard(true);
    clickLink("other");
    const message = confirm.mock.calls[0]?.[0] as string;
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toContain("—");
  });

  it("ignores hash, download, new-tab, modified and non-primary clicks", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Links />);
    guard(true);
    expect(clickLink("hash").blocked).toBe(false);
    expect(clickLink("download").blocked).toBe(false);
    expect(clickLink("blank").blocked).toBe(false);
    expect(clickLink("other", { ctrlKey: true }).blocked).toBe(false);
    expect(clickLink("other", { button: 1 }).blocked).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    expect(clickLink("self").blocked).toBe(true);
  });

  it("ignores clicks that are not on a link", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<button type="button">plain</button>);
    guard(true);
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    window.dispatchEvent(new MouseEvent("click"));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("guards a touch tap on a link", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    const { getByText } = render(<Links />);
    guard(true);
    const mute = (event: Event) => {
      event.preventDefault = () => {};
    };
    window.addEventListener("click", mute, true);
    await user.pointer({ keys: "[TouchA]", target: getByText("external") });
    window.removeEventListener("click", mute, true);
    expect(confirm).toHaveBeenCalled();
  });

  it("stops guarding when `when` turns false and on unmount", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Links />);
    const { rerender, unmount } = guard(true);
    rerender({ w: false });
    expect(clickLink("other").blocked).toBe(false);
    rerender({ w: true });
    expect(clickLink("other").blocked).toBe(true);
    unmount();
    expect(clickLink("other").blocked).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("returns a confirm function for in-code navigation", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result, rerender } = guard(true, "Sure?");
    expect(result.current()).toBe(false);
    expect(confirm).toHaveBeenCalledWith("Sure?");
    confirm.mockReturnValue(true);
    expect(result.current()).toBe(true);
    confirm.mockClear();
    rerender({ w: false });
    expect(result.current()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});

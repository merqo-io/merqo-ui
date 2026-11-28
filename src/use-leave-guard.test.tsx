// @vitest-environment jsdom
import { cleanup, render, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  link.dispatchEvent(event);
  return { blocked: event.defaultPrevented };
}

// test-setup registers a document capture listener that cancels every anchor
// click, which the guard rightly treats as already handled. This window capture
// listener runs earlier and swallows that first preventDefault call, so later
// calls (the guard's, or a router link's) stay real.
function swallowSetupCancel(event: Event) {
  const real = event.preventDefault.bind(event);
  let first = true;
  event.preventDefault = () => {
    if (first) first = false;
    else real();
  };
}

beforeEach(() => window.addEventListener("click", swallowSetupCancel, true));

afterEach(() => {
  window.removeEventListener("click", swallowSetupCancel, true);
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
    await user.pointer({ keys: "[TouchA]", target: getByText("external") });
    expect(confirm).toHaveBeenCalled();
  });

  it("prompts before a router link's bubble-phase handler cancels the click", () => {
    const order: string[] = [];
    vi.spyOn(window, "confirm").mockImplementation(() => {
      order.push("confirm");
      return true;
    });
    render(<Links />);
    guard(true);
    const link = document.querySelector("a") as HTMLAnchorElement;
    link.addEventListener("click", (event) => {
      order.push("router");
      event.preventDefault();
    });
    clickLink("other");
    expect(order).toEqual(["confirm", "router"]);
  });

  it("leaves a click alone that an earlier capture handler already cancelled", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Links />);
    const owner = (event: Event) => event.preventDefault();
    document.addEventListener("click", owner, true);
    guard(true);
    clickLink("other");
    document.removeEventListener("click", owner, true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("does not run a router link's handler when the user cancels", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const router = vi.fn();
    render(<Links />);
    guard(true);
    (document.querySelector("a") as HTMLAnchorElement).addEventListener(
      "click",
      router,
    );
    expect(clickLink("other").blocked).toBe(true);
    expect(router).not.toHaveBeenCalled();
  });

  it("does not prompt for mailto: and tel: links", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <div>
        <a href="mailto:hi@example.com">mail</a>
        <a href="tel:+6591234567">call</a>
      </div>,
    );
    guard(true);
    expect(clickLink("mail").blocked).toBe(false);
    expect(clickLink("call").blocked).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
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

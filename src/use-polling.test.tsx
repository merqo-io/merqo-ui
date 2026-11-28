// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "./use-polling";

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  });
}

describe("usePolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it("does nothing while disabled", () => {
    setHidden(false);
    const tick = vi.fn();
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: false }));
    vi.advanceTimersByTime(3000);
    expect(tick).not.toHaveBeenCalled();
  });

  it("fires an immediate tick on mount, then every interval, while visible", () => {
    setHidden(false);
    const tick = vi.fn();
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3000);
    expect(tick).toHaveBeenCalledTimes(4);
  });

  it("stays quiet while the tab is hidden", () => {
    setHidden(true);
    const tick = vi.fn();
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    vi.advanceTimersByTime(3000);
    expect(tick).not.toHaveBeenCalled();
  });

  it("fires an immediate tick when the tab becomes visible again", () => {
    setHidden(true);
    const tick = vi.fn();
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    expect(tick).not.toHaveBeenCalled();
    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("stops when disabled and resumes with an immediate tick when re-enabled", () => {
    setHidden(false);
    const tick = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => usePolling(tick, { intervalMs: 1000, enabled }),
      { initialProps: { enabled: true } },
    );
    expect(tick).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    vi.advanceTimersByTime(3000);
    expect(tick).toHaveBeenCalledTimes(1);
    rerender({ enabled: true });
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it("pauses when the tab is hidden mid-run", () => {
    setHidden(false);
    const tick = vi.fn();
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    setHidden(true);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(3000);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("calls the latest tick closure without resubscribing", () => {
    setHidden(false);
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ tick }) => usePolling(tick, { intervalMs: 1000, enabled: true }),
      { initialProps: { tick: first } },
    );
    rerender({ tick: second });
    vi.advanceTimersByTime(1000);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops ticking on unmount", () => {
    setHidden(false);
    const tick = vi.fn();
    const { unmount } = renderHook(() =>
      usePolling(tick, { intervalMs: 1000, enabled: true }),
    );
    expect(tick).toHaveBeenCalledTimes(1);
    unmount();
    vi.advanceTimersByTime(5000);
    expect(tick).toHaveBeenCalledTimes(1);
  });
});

describe("pending and failed refreshes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it("keeps one request in flight across interval changes and visibility events", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const tick = vi.fn().mockReturnValueOnce(pending);
    const { rerender, unmount } = renderHook(
      ({ intervalMs }) => usePolling(tick, { intervalMs, enabled: true }),
      { initialProps: { intervalMs: 1000 } },
    );
    vi.advanceTimersByTime(4000);
    rerender({ intervalMs: 500 });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(tick).toHaveBeenCalledTimes(1);
    finish();
    await Promise.resolve();
    vi.advanceTimersByTime(500);
    expect(tick).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("contains rejected and synchronous refresh failures and retries", async () => {
    const tick = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementationOnce(() => {
        throw new Error("sync");
      });
    const { unmount } = renderHook(() =>
      usePolling(tick, { intervalMs: 1000, enabled: true }),
    );
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    expect(tick).toHaveBeenCalledTimes(3);
    unmount();
  });

  describe("refetchOnFocus", () => {
    it("ignores window focus by default", () => {
      const tick = vi.fn();
      const { unmount } = renderHook(() =>
        usePolling(tick, { intervalMs: 10_000, enabled: true }),
      );
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("ticks on window focus when opted in", () => {
      const tick = vi.fn();
      const { unmount } = renderHook(() =>
        usePolling(tick, {
          intervalMs: 10_000,
          enabled: true,
          refetchOnFocus: true,
        }),
      );
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(2);
      unmount();
    });

    it("makes one call when visibilitychange and focus arrive together", () => {
      const tick = vi.fn();
      const { unmount } = renderHook(() =>
        usePolling(tick, {
          intervalMs: 10_000,
          enabled: true,
          refetchOnFocus: true,
        }),
      );
      setHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(5000);
      setHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(2);
      unmount();
    });

    it("makes one call when focus arrives before visibilitychange", () => {
      const tick = vi.fn();
      const { unmount } = renderHook(() =>
        usePolling(tick, {
          intervalMs: 10_000,
          enabled: true,
          refetchOnFocus: true,
        }),
      );
      setHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(5000);
      setHidden(false);
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
      expect(tick).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(10_000);
      expect(tick).toHaveBeenCalledTimes(3);
      unmount();
    });

    it("skips a focus tick while one is in flight, while hidden or disabled", async () => {
      let finish!: () => void;
      const pending = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const tick = vi.fn().mockReturnValueOnce(pending);
      const { rerender, unmount } = renderHook(
        ({ enabled }) =>
          usePolling(tick, {
            intervalMs: 10_000,
            enabled,
            refetchOnFocus: true,
          }),
        { initialProps: { enabled: true } },
      );
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(1);
      finish();
      await Promise.resolve();
      setHidden(true);
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(1);
      setHidden(false);
      rerender({ enabled: false });
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("stops listening on unmount", () => {
      const tick = vi.fn();
      const { unmount } = renderHook(() =>
        usePolling(tick, {
          intervalMs: 10_000,
          enabled: true,
          refetchOnFocus: true,
        }),
      );
      unmount();
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("focus"));
      expect(tick).toHaveBeenCalledTimes(1);
    });
  });
});

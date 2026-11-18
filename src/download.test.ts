// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./download";

describe("downloadBlob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("clicks a temporary anchor with the filename, then cleans up", () => {
    let seen: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      seen = document.body.querySelector("a") ?? undefined;
    });
    const blob = new Blob(["a,b"], { type: "text/csv" });
    downloadBlob(blob, "x.csv");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(seen?.download).toBe("x.csv");
    expect(seen?.getAttribute("href")).toBe("blob:x");
    expect(document.body.querySelector("a")).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x");
  });
});

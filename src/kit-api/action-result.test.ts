import { describe, expect, expectTypeOf, it } from "vitest";
import { isActionError, type ActionResult } from "./action-result";

describe("ActionResult", () => {
  it("narrows the failure branch", () => {
    const fail: ActionResult<{ id: string }> = { success: false, error: "no" };
    const ok: ActionResult<{ id: string }> = { success: true, id: "a" };
    expect(isActionError(fail)).toBe(true);
    expect(isActionError(ok)).toBe(false);
    if (!isActionError(ok)) expectTypeOf(ok.id).toBeString();
  });
});

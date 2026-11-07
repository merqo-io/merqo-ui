import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listAllUsers, readAllRows, readAllRowsResult, type AdminUsersClient } from "./index";

describe("readAllRows", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("pages with inclusive 1000-row ranges and stops at the first short page", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => i);
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: full, error: null })
      .mockResolvedValueOnce({ data: [1000, 1001], error: null });
    const rows = await readAllRows<number>(page);
    expect(rows).toHaveLength(1002);
    expect(page.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it("reads one more page after an exactly full one", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => i);
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: full, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    expect(await readAllRows<number>(page)).toHaveLength(1000);
    expect(page).toHaveBeenCalledTimes(2);
  });

  it("throws at the page cap instead of looping forever", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => i);
    const page = vi.fn().mockResolvedValue({ data: full, error: null });
    await expect(readAllRows<number>(page)).rejects.toThrow("Could not load complete query results");
    expect(page).toHaveBeenCalledTimes(1000);
    expect(console.error).toHaveBeenCalledWith("readAllRows: page limit reached", 1000);
  });

  it("returns an empty list for an empty first page", async () => {
    expect(await readAllRows(async () => ({ data: [], error: null }))).toEqual([]);
  });

  it("throws instead of returning a partial list when a page errors", async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, i) => i), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "timeout" } });
    await expect(readAllRows(page)).rejects.toThrow("Could not load complete query results");
    expect(console.error).toHaveBeenCalledWith("readAllRows: page failed", "timeout");
  });

  it("throws when a page returns no data and no error", async () => {
    await expect(readAllRows(async () => ({ data: null, error: null }))).rejects.toThrow();
    expect(console.error).toHaveBeenCalledWith("readAllRows: page failed", "no data");
  });
});

describe("readAllRowsResult", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("wraps success", async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: [1], error: null });
    expect(await readAllRowsResult<number>(page)).toEqual({ data: [1], error: null });
  });

  it("maps a failure to an error result", async () => {
    const result = await readAllRowsResult(async () => ({ data: null, error: { message: "x" } }));
    expect(result).toEqual({
      data: null,
      error: { message: "Could not load complete query results" },
    });
  });
});

function clientWith(listUsers: ReturnType<typeof vi.fn>) {
  return { auth: { admin: { listUsers } } } as unknown as AdminUsersClient;
}

describe("listAllUsers", () => {
  it("returns a single partial page", async () => {
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [{ id: "1", email: "a@b.co" }, { id: "2" }] },
      error: null,
    });
    const { data, error } = await listAllUsers(clientWith(listUsers));
    expect(error).toBeNull();
    expect(data?.users).toEqual([
      { id: "1", email: "a@b.co" },
      { id: "2", email: null },
    ]);
    expect(listUsers).toHaveBeenCalledOnce();
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
  });

  it("walks every full page and stops at the first partial one", async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), email: null }));
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({ data: { users: fullPage }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ id: "x", email: "x@y.z" }] }, error: null });
    const { data } = await listAllUsers(clientWith(listUsers));
    expect(data?.users).toHaveLength(1001);
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
  });

  it("returns the error from a failing page", async () => {
    const listUsers = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await listAllUsers(clientWith(listUsers))).toEqual({
      data: null,
      error: { message: "boom" },
    });
  });

  it("stops at the pagination safety limit", async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }));
    const listUsers = vi.fn().mockResolvedValue({ data: { users: fullPage }, error: null });
    const { data, error } = await listAllUsers(clientWith(listUsers));
    expect(data).toBeNull();
    expect(error?.message).toContain("safety limit");
    expect(listUsers).toHaveBeenCalledTimes(50);
  });
});

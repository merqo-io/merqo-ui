import { describe, it, expect } from "vitest";
import { toNavUser } from "./nav-user";

describe("toNavUser", () => {
  it("returns null without a user", () => {
    expect(toNavUser(null)).toBeNull();
    expect(toNavUser(undefined, "Shop")).toBeNull();
  });

  it("prefers the vendor name", () => {
    const u = toNavUser(
      { email: "a@b.co", user_metadata: { full_name: "Full" } },
      "  Shop  ",
    );
    expect(u).toEqual({ name: "Shop", email: "a@b.co", avatarUrl: undefined });
  });

  it("falls through whitespace-only vendor name to full_name", () => {
    expect(
      toNavUser({ email: "a@b.co", user_metadata: { full_name: " Full " } }, "   ")?.name,
    ).toBe("Full");
  });

  it("uses display_name when full_name is blank or not a string", () => {
    expect(
      toNavUser({ user_metadata: { full_name: "  ", display_name: "Disp" } })?.name,
    ).toBe("Disp");
    expect(
      toNavUser({ user_metadata: { full_name: 5, display_name: "Disp" } })?.name,
    ).toBe("Disp");
  });

  it("uses the email local part, then Account", () => {
    expect(
      toNavUser({ email: "jane@x.co", user_metadata: { display_name: 7 } })?.name,
    ).toBe("jane");
    expect(toNavUser({ email: "@x.co" })?.name).toBe("Account");
    expect(toNavUser({ email: null, user_metadata: null })?.name).toBe("Account");
  });

  it("omits email when absent", () => {
    expect(toNavUser({ email: null })?.email).toBeUndefined();
  });

  it("accepts only https avatar urls", () => {
    const av = (v: unknown) => toNavUser({ user_metadata: { avatar_url: v } })?.avatarUrl;
    expect(av("https://cdn.x.co/a.png")).toBe("https://cdn.x.co/a.png");
    expect(av("http://cdn.x.co/a.png")).toBeUndefined();
    expect(av("/a.png")).toBeUndefined();
    expect(av(12)).toBeUndefined();
    expect(av("javascript:alert(1)")).toBeUndefined();
  });
});

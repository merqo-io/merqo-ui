import { describe, expect, it } from "vitest";
import {
  isTelegramLink,
  normalizeTelegramHandle,
  telegramLink,
} from "./telegram-link";

describe("normalizeTelegramHandle", () => {
  it.each([
    ["@shop_bot", "shop_bot"],
    ["shop_bot", "shop_bot"],
    ["  @Shop_Bot  ", "Shop_Bot"],
    ["https://t.me/shop_bot", "shop_bot"],
    ["https://t.me/shop_bot/", "shop_bot"],
  ])("%j -> %j", (input, expected) => {
    expect(normalizeTelegramHandle(input)).toBe(expected);
  });

  it.each([
    "",
    "@",
    "abc",
    "1shop_bot",
    "_shopbot",
    "shop bot",
    "shop-bot",
    "a".repeat(33),
    "@@shop_bot",
    "https://evil.example/shop_bot",
    "https://t.me.evil.example/shop_bot",
    "http://t.me/shop_bot",
    "https://t.me/",
    "https://t.me/a/b",
    "https://user@t.me/shop_bot",
  ])("rejects %j", (input) => {
    expect(normalizeTelegramHandle(input)).toBeNull();
  });
});

describe("telegramLink", () => {
  it("builds an https t.me link", () => {
    expect(telegramLink("@shop_bot")).toBe("https://t.me/shop_bot");
  });
  it("returns null for an invalid handle", () => {
    expect(telegramLink("bad handle")).toBeNull();
  });
});

describe("isTelegramLink", () => {
  it("accepts https t.me deep links", () => {
    expect(isTelegramLink("https://t.me/shop_bot?start=abc")).toBe(true);
  });
  it.each([
    "http://t.me/x",
    "https://telegram.me/x",
    "https://t.me:8443/x",
    "https://u:p@t.me/x",
    "javascript:alert(1)",
    "not a url",
  ])("rejects %j", (value) => {
    expect(isTelegramLink(value)).toBe(false);
  });
});

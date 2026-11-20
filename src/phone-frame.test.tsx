// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhoneFrame } from "./phone-frame";

describe("PhoneFrame", () => {
  it("renders the plain frame by default, with no hardware", () => {
    const { container } = render(
      <PhoneFrame label="Order">
        <p>body</p>
      </PhoneFrame>,
    );
    expect(screen.getByRole("group", { name: "Order" })).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });

  it("shows the browser bar URL as visible text", () => {
    render(
      <PhoneFrame label="Order" browserBar={{ url: "qkit.merqo.io" }}>
        <p>body</p>
      </PhoneFrame>,
    );
    expect(screen.getByText("qkit.merqo.io")).toBeVisible();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("marks the island, keys, status bar and bar controls aria-hidden", () => {
    const { container } = render(
      <PhoneFrame label="Order" realistic browserBar={{ url: "x.io" }}>
        <p>body</p>
      </PhoneFrame>,
    );
    expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText("9:41").closest("[aria-hidden]")).not.toBeNull();
    expect(screen.getByText("x.io").closest("[aria-hidden]")).toBeNull();
  });

  it("uses statusTime and the small size", () => {
    render(
      <PhoneFrame label="Order" realistic size="small" statusTime="10:02">
        <p>body</p>
      </PhoneFrame>,
    );
    expect(screen.getByText("10:02")).toBeInTheDocument();
    expect(screen.getByRole("group")).toHaveClass("w-[190px]");
  });
});

// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { ClosingCall } from "./closing-call";
import { Journey, JourneyStep } from "./journey";
import { PhoneFrame } from "./phone-frame";

describe("Journey", () => {
  it("renders the section with its id and heading", () => {
    const { container } = render(
      <Journey id="how" title="How it works">
        <p>body</p>
      </Journey>,
    );
    expect(container.querySelector("section#how")).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "How it works" }),
    ).toBeInTheDocument();
  });
});

describe("JourneyStep", () => {
  it("renders its copy and forwards stageRef to the stage element", () => {
    const stageRef = createRef<HTMLDivElement>();
    render(
      <JourneyStep
        label="Step 1"
        heading="Scan"
        say="Point a phone."
        extra={<span>extra</span>}
        stage={<span data-testid="stage-child">x</span>}
        stageRef={stageRef}
      />,
    );
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Scan");
    expect(screen.getByText("extra")).toBeInTheDocument();
    expect(stageRef.current).toBe(
      screen.getByTestId("stage-child").parentElement,
    );
  });
});

describe("PhoneFrame", () => {
  it("exposes a labelled group and uses the kit-driven radius", () => {
    render(<PhoneFrame label="Order screen">hi</PhoneFrame>);
    const group = screen.getByRole("group", { name: "Order screen" });
    expect(group.className).toContain("rounded-3xl");
    expect(group.className).not.toContain("rounded-[");
    expect(group.className).toContain("w-[232px]");
  });
  it("has a small size", () => {
    render(
      <PhoneFrame label="Small" size="small">
        hi
      </PhoneFrame>,
    );
    expect(screen.getByRole("group").className).toContain("w-[190px]");
  });
});

describe("ClosingCall", () => {
  it("renders its four slots", () => {
    render(
      <ClosingCall
        heading="Ready?"
        line="Start today."
        action={<button type="button">Go</button>}
        aside={<p>aside</p>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Ready?" })).toBeInTheDocument();
    expect(screen.getByText("Start today.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
    expect(screen.getByText("aside")).toBeInTheDocument();
  });
});

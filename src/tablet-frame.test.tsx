// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabletFrame } from "./tablet-frame";

describe("TabletFrame", () => {
  it("is a labelled group wrapping its children", () => {
    render(
      <TabletFrame label="Vendor board">
        <p>orders</p>
      </TabletFrame>,
    );
    expect(screen.getByRole("group", { name: "Vendor board" })).toBeInTheDocument();
    expect(screen.getByText("orders")).toBeInTheDocument();
  });

  it("renders the top bar only when a title or end slot is given", () => {
    const { rerender } = render(
      <TabletFrame label="Board">
        <p>x</p>
      </TabletFrame>,
    );
    expect(screen.queryByText("Queue")).toBeNull();
    rerender(
      <TabletFrame label="Board" title="Queue" topBarEnd={<span>3 open</span>}>
        <p>x</p>
      </TabletFrame>,
    );
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("3 open")).toBeInTheDocument();
  });

  it("hides the camera dot from assistive tech", () => {
    const { container } = render(
      <TabletFrame label="Board">
        <p>x</p>
      </TabletFrame>,
    );
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
  });
});

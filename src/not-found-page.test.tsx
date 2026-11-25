import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFound } from "./not-found-page";

describe("NotFound media", () => {
  it("threads media to the status card", () => {
    render(<NotFound media={<img alt="" src="/x.png" data-testid="media" />} />);
    expect(screen.getByTestId("media")).toBeInTheDocument();
  });

  it("renders without media by default", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

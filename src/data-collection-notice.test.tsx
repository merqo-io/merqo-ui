import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataCollectionNotice } from "./data-collection-notice";

describe("DataCollectionNotice", () => {
  it("states the purpose passed in", () => {
    render(<DataCollectionNotice purpose="track your stamp card" />);
    expect(
      screen.getByText(/We use your phone number and name to track your stamp card\./),
    ).toBeInTheDocument();
  });

  it("links to the privacy policy under the default base path", () => {
    render(<DataCollectionNotice purpose="track your stamp card" />);
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
  });

  it("honours a custom basePath and className", () => {
    const { container } = render(
      <DataCollectionNotice purpose="x" basePath="https://merqo.sg/legal" className="mt-2" />,
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "https://merqo.sg/legal/privacy",
    );
    expect(container.firstChild).toHaveClass("mt-2");
  });
});

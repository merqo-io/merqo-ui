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

  it("says the phone number is only used when given when phoneOptional is set", () => {
    render(<DataCollectionNotice purpose="send your order updates" phoneOptional />);
    expect(
      screen.getByText(
        /We use your name, and your phone number if you give one, to send your order updates\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/your phone number and name/)).not.toBeInTheDocument();
  });

  it("keeps the privacy link when phoneOptional is set", () => {
    render(<DataCollectionNotice purpose="x" phoneOptional />);
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
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

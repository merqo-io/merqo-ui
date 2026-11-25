// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageUploader } from "./image-uploader";

describe("ImageUploader preview fade", () => {
  it("fades the preview in from transparent, near-instant under reduced motion", () => {
    const { container } = render(
      <ImageUploader
        bucket="vendor-images"
        pathPrefix="vendor-1"
        value="https://cdn.example.test/a.webp"
        onChange={() => {}}
        onUpload={vi.fn()}
      />,
    );
    const wrap = container.querySelector("[data-slot='image-preview']");
    expect(wrap).toHaveClass(
      "starting:opacity-0",
      "transition-opacity",
      "duration-200",
      "motion-reduce:duration-1",
    );
    expect(wrap?.querySelector("img")).not.toBeNull();
    expect(wrap).not.toContainElement(screen.getByRole("button", { name: "Remove image" }));
  });
});

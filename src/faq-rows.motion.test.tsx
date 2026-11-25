// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqRows } from "./faq-rows";

describe("FaqRows motion", () => {
  it("eases the row open with a no-animation fallback and near-zero reduced motion", () => {
    const { container } = render(<FaqRows rows={[{ q: "One?", a: "Yes." }]} />);
    expect(container.querySelector("details")).toHaveClass(
      "details-content:h-0",
      "details-content:overflow-clip",
      "details-content:duration-200",
      "open:details-content:h-auto",
      "motion-reduce:details-content:duration-1",
    );
  });
});

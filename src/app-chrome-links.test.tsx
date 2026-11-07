import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFound } from "./not-found-page";
import { Wordmark } from "./wordmark";
import { LegalPage } from "./legal-page";

describe("LinkComponent", () => {
  const Custom = (props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a data-custom="1" {...props} />
  );

  it("is used by NotFound, Wordmark and LegalPage", () => {
    render(
      <>
        <NotFound LinkComponent={Custom} />
        <Wordmark href="/w" LinkComponent={Custom}>
          W
        </Wordmark>
        <LegalPage doc="terms" wordmark="L" LinkComponent={Custom} />
      </>,
    );
    expect(document.querySelectorAll("[data-custom]")).toHaveLength(3);
  });
});

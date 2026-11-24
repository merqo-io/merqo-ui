import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

const DEFAULT_CLASS =
  "h-9 pointer-coarse:h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground text-ellipsis placeholder:text-ellipsis disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

const tokens = (el: HTMLElement) => el.className.split(" ");

describe("Input size", () => {
  it("renders today's classes by default and for size=default", () => {
    render(
      <>
        <Input aria-label="a" />
        <Input aria-label="b" size="default" />
      </>,
    );
    expect(screen.getByLabelText("a").className).toBe(DEFAULT_CLASS);
    expect(screen.getByLabelText("b").className).toBe(DEFAULT_CLASS);
  });

  it("size=lg replaces height and radius and keeps the rest", () => {
    render(<Input aria-label="a" size="lg" />);
    const t = tokens(screen.getByLabelText("a"));
    expect(t).toContain("h-11");
    expect(t).toContain("rounded-xl");
    expect(t).toContain("text-base");
    expect(t).not.toContain("h-9");
    expect(t).not.toContain("rounded-md");
    expect(t).toContain("pointer-coarse:h-11");
  });

  it("size=lg renders the same classes as the old className override", () => {
    render(
      <>
        <Input aria-label="a" size="lg" />
        <Input aria-label="b" className="h-11 rounded-xl text-base" />
      </>,
    );
    const norm = (el: HTMLElement) => tokens(el).sort().join(" ");
    expect(norm(screen.getByLabelText("a"))).toBe(
      norm(screen.getByLabelText("b")),
    );
  });

  it("merges className last", () => {
    render(<Input aria-label="a" size="lg" className="h-14 rounded-none" />);
    const t = tokens(screen.getByLabelText("a"));
    expect(t).toContain("h-14");
    expect(t).toContain("rounded-none");
    expect(t).not.toContain("h-11");
    expect(t).not.toContain("rounded-xl");
  });
});

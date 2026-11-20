// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackToTop } from "./back-to-top";
import { Footer } from "./footer";

describe("Footer", () => {
  it("renders the given wordmark, tagline, and kit-name copyright", () => {
    render(
      <Footer
        wordmark={<a href="/">QKit</a>}
        tagline="Built for booths."
        kitName="qkit"
      />,
    );
    expect(screen.getByRole("link", { name: "QKit" })).toBeInTheDocument();
    expect(screen.getByText("Built for booths.")).toBeInTheDocument();
    expect(
      screen.getByText(`© ${new Date().getFullYear()} qkit · a Merqo kit`),
    ).toBeInTheDocument();
  });

  it("renders About, legal, and sign-in links", () => {
    render(<Footer wordmark={<a href="/">Kit</a>} tagline="t" kitName="kit" />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      screen.getByRole("link", { name: /vendor sign in/i }),
    ).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Terms" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
  });

  it("hides the sign-in link when showSignIn is false", () => {
    render(
      <Footer
        wordmark={<a href="/">Kit</a>}
        tagline="t"
        kitName="kit"
        showSignIn={false}
      />,
    );
    expect(
      screen.queryByRole("link", { name: /vendor sign in/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });

  it("replaces the whole copyright line when copyright is given", () => {
    render(
      <Footer
        wordmark={<a href="/">Merqo</a>}
        tagline="t"
        kitName="merqo"
        copyright="© 2026 Merqo"
      />,
    );
    expect(screen.getByText("© 2026 Merqo")).toBeInTheDocument();
    expect(screen.queryByText(/a Merqo kit/)).not.toBeInTheDocument();
  });

  it("overrides the sign-in copy when signInLabel is given", () => {
    render(
      <Footer
        wordmark={<a href="/">Merqo</a>}
        tagline="t"
        kitName="merqo"
        signInLabel="Sign in →"
      />,
    );
    expect(screen.getByRole("link", { name: "Sign in →" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.queryByRole("link", { name: /vendor sign in/i }),
    ).not.toBeInTheDocument();
  });

  it("renders every link exactly once in the desktop DOM order", () => {
    render(<Footer wordmark={<a href="/">Kit</a>} tagline="t" kitName="kit" />);
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/",
      "/about",
      "/legal/terms",
      "/legal/privacy",
      "/login",
    ]);
  });

  it("renders no FAQ link unless faqHref is given", () => {
    render(<Footer wordmark={<a href="/">Kit</a>} tagline="t" kitName="kit" />);
    expect(screen.queryByRole("link", { name: "FAQ" })).not.toBeInTheDocument();
  });

  it("renders a FAQ link to faqHref when given", () => {
    render(
      <Footer
        wordmark={<a href="/">Kit</a>}
        tagline="t"
        kitName="kit"
        faqHref="/faq"
      />,
    );
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute(
      "href",
      "/faq",
    );
  });

  it("places the FAQ link after About and before the legal links", () => {
    render(
      <Footer
        wordmark={<a href="/">Kit</a>}
        tagline="t"
        kitName="kit"
        faqHref="/faq"
      />,
    );
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/",
      "/about",
      "/faq",
      "/legal/terms",
      "/legal/privacy",
      "/login",
    ]);
  });

  it("lets the FAQ link be tapped by touch", async () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    const user = userEvent.setup();
    render(
      <div onClick={onClick}>
        <Footer
          wordmark={<a href="/">Kit</a>}
          tagline="t"
          kitName="kit"
          faqHref="/faq"
        />
      </div>,
    );
    const link = screen.getByRole("link", { name: "FAQ" });
    await user.pointer({ keys: "[TouchA]", target: link });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].target).toBe(link);
  });

  it("gives every footer link a 44px touch height and a focus ring at every width", () => {
    render(
      <Footer
        wordmark={<a href="/">Kit</a>}
        tagline="t"
        kitName="kit"
        faqHref="/faq"
      />,
    );
    for (const name of ["About", "FAQ", /vendor sign in/i]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveClass("min-h-11", "inline-flex", "items-center");
      expect(link.className).not.toMatch(/sm:min-h-0/);
      expect(link.className).toMatch(/focus-visible:ring-\[3px\]/);
      expect(link.className).toMatch(/focus-visible:ring-ring\/50/);
      expect(link).toHaveClass("outline-none");
    }
    const nav = screen.getByRole("link", { name: "Terms" }).closest("nav")!;
    expect(nav).toHaveClass("[&_a]:min-h-11", "[&_a]:inline-flex");
    expect(nav).toHaveClass("[&_a]:focus-visible:ring-[3px]");
    expect(nav).toHaveClass("[&_a]:focus-visible:ring-ring/50");
    expect(nav.className).not.toMatch(/sm:\[&_a\]:min-h-0/);
  });

  it("reserves room below the links so Back to top never covers one", () => {
    const { container } = render(
      <Footer wordmark={<a href="/">Kit</a>} tagline="t" kitName="kit" />,
    );
    const inner = container.querySelector("footer > div") as HTMLElement;
    expect(inner).toHaveClass("pb-20");
    expect(inner.className).not.toMatch(/(^|\s)(sm:)?py-/);
  });

  it("keeps Back to top tappable by touch beside the footer", async () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    }) as unknown as typeof window.matchMedia;
    Object.defineProperty(window, "scrollY", { value: 900, configurable: true });
    const user = userEvent.setup();
    render(
      <>
        <Footer wordmark={<a href="/">Kit</a>} tagline="t" kitName="kit" />
        <BackToTop />
      </>,
    );
    const button = screen.getByRole("button", { name: "Back to top" });
    await user.pointer({ keys: "[TouchA]", target: button });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("compact layout keeps every link at 44px and folds the links to their own row on a phone", () => {
    const { container } = render(
      <Footer
        wordmark={<a href="/">Kit</a>}
        tagline="t"
        kitName="kit"
        faqHref="/faq"
        layout="compact"
      />,
    );
    for (const name of ["About", "FAQ", /vendor sign in/i]) {
      expect(screen.getByRole("link", { name })).toHaveClass("min-h-11");
    }
    const nav = screen.getByRole("link", { name: "Terms" }).closest("nav")!;
    expect(nav).toHaveClass("[&_a]:min-h-11");
    expect(nav.parentElement).toHaveClass("basis-full", "sm:basis-auto");
    const wrap = container.querySelector("footer > div")!;
    expect(wrap).toHaveClass("min-h-16", "flex-wrap");
    expect(wrap).toHaveClass("sm:pr-20", "max-sm:pb-14");
    expect(wrap.className).not.toMatch(/pb-20/);
  });

  it("default layout is unchanged", () => {
    const { container } = render(
      <Footer wordmark={<a href="/">Kit</a>} tagline="t" kitName="kit" />,
    );
    expect(container.querySelector("footer > div")).toHaveClass(
      "pb-20",
      "sm:flex-row",
    );
  });
});

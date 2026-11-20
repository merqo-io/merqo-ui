import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingNav } from "./landing-nav";

describe("LandingNav", () => {
  it("renders the wordmark and end slots", () => {
    render(<LandingNav wordmark={<span>QKit</span>} end={<a href="/login">Sign in</a>} />);
    expect(screen.getByText("QKit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  it("wraps both slots in a header with the shared sticky/shape classes", () => {
    const { container } = render(<LandingNav wordmark={<span>Kit</span>} end={<span>End</span>} />);
    const header = container.querySelector("header");
    expect(header).toHaveClass("sticky", "top-0", "z-20", "bg-background/85");
  });

  it("puts the edge padding on the inner max-w-6xl box, not the header", () => {
    const { container } = render(<LandingNav wordmark={<span>Kit</span>} end={<span>End</span>} />);
    expect(container.querySelector("header")).not.toHaveClass("px-5");
    expect(container.querySelector("nav")).toHaveClass("mx-auto", "max-w-6xl", "px-5");
  });
});

describe("LandingNav links", () => {
  const links = [
    { label: "FAQ", href: "/#faq" },
    { label: "About", href: "/about" },
  ];
  const setup = () =>
    render(
      <LandingNav
        wordmark={<span>Kit</span>}
        end={<a href="/login">Sign in</a>}
        links={links}
      />,
    );

  it("renders links inline (hidden below sm) and a burger shown only below sm", () => {
    setup();
    const inline = screen.getByRole("link", { name: "About" });
    expect(inline.parentElement).toHaveClass("hidden", "sm:flex");
    const burger = screen.getByRole("button", { name: "Menu" });
    expect(burger).toHaveClass("sm:hidden", "h-11", "min-w-11");
    expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles aria-expanded and shows the panel", async () => {
    const user = userEvent.setup();
    setup();
    const burger = screen.getByRole("button", { name: "Menu" });
    await user.click(burger);
    expect(burger).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(burger.getAttribute("aria-controls") ?? "");
    expect(panel).toBeInTheDocument();
    expect(panel?.querySelectorAll("a")).toHaveLength(2);
    await user.click(burger);
    expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and returns focus to the burger", async () => {
    const user = userEvent.setup();
    setup();
    const burger = screen.getByRole("button", { name: "Menu" });
    await user.click(burger);
    await user.keyboard("{Escape}");
    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(burger).toHaveFocus();
  });

  it("closes when a panel link or the scrim is clicked", async () => {
    const user = userEvent.setup();
    setup();
    const burger = screen.getByRole("button", { name: "Menu" });
    await user.click(burger);
    const link = document.getElementById("landing-nav-mobile-panel")?.querySelector("a");
    link?.addEventListener("click", (event) => event.preventDefault());
    await user.click(link as HTMLElement);
    expect(burger).toHaveAttribute("aria-expanded", "false");
    await user.click(burger);
    await user.click(screen.getByRole("button", { name: "Close menu", hidden: true }));
    expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders no burger when links is absent or empty", () => {
    const { container, rerender } = render(
      <LandingNav wordmark={<span>Kit</span>} end={<span>End</span>} />,
    );
    const before = container.innerHTML;
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<LandingNav wordmark={<span>Kit</span>} end={<span>End</span>} links={[]} />);
    expect(container.innerHTML).toBe(before);
  });
});

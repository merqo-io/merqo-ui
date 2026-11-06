import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminShell } from "./admin-shell";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/feedback", label: "Feedback" },
];

function setup(pathname: string, extra: Partial<React.ComponentProps<typeof AdminShell>> = {}) {
  return render(
    <AdminShell wordmark={<span>Kit</span>} tabs={tabs} pathname={pathname} {...extra}>
      <p>page</p>
    </AdminShell>,
  );
}

describe("AdminShell", () => {
  it("renders the Admin label, wordmark and children", () => {
    setup("/admin");
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Kit")).toBeInTheDocument();
    expect(screen.getByText("page")).toBeInTheDocument();
  });

  it("marks only Overview active on the exact path", () => {
    setup("/admin");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vendors" })).not.toHaveAttribute("aria-current");
  });

  it("marks a tab active on a nested path and not Overview", () => {
    setup("/admin/vendors/123");
    expect(screen.getByRole("link", { name: "Vendors" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("does not match a sibling that only shares a prefix string", () => {
    setup("/admin/vendors-archive");
    expect(screen.getByRole("link", { name: "Vendors" })).not.toHaveAttribute("aria-current");
  });

  it("scrolls tabs horizontally", () => {
    setup("/admin");
    expect(screen.getByRole("navigation", { name: "Admin sections" }).className).toContain(
      "overflow-x-auto",
    );
  });

  it("renders a back link and actions when given", () => {
    setup("/admin", {
      backHref: "/dashboard",
      backLabel: "Back to dashboard",
      actions: <button>Out</button>,
    });
    expect(screen.getByRole("link", { name: /Back to dashboard/ })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("button", { name: "Out" })).toBeInTheDocument();
  });

  it("omits the back link by default", () => {
    setup("/admin");
    expect(screen.queryByRole("link", { name: /Back/ })).toBeNull();
  });

  it("renders links through LinkComponent and a tap reaches it", async () => {
    const clicked: string[] = [];
    function Custom({
      href,
      children,
      ...rest
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
      return (
        <a
          href={href}
          data-custom="1"
          onClick={(e) => {
            e.preventDefault();
            clicked.push(href);
          }}
          {...rest}
        >
          {children}
        </a>
      );
    }
    setup("/admin", { LinkComponent: Custom });
    const link = screen.getByRole("link", { name: "Vendors" });
    expect(link).toHaveAttribute("data-custom", "1");
    const user = userEvent.setup();
    await user.pointer({ keys: "[TouchA]", target: link });
    expect(clicked).toEqual(["/admin/vendors"]);
  });
});

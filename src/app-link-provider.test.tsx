import type { AnchorHTMLAttributes } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { AppLinkProvider, useAppLink } from "./app-link-provider";
import { AccountMenu } from "./account-menu";
import { DashboardNav } from "./dashboard-nav";
import { LandingAccountNav } from "./landing-account-nav";
import { LoginForm } from "./login-form";
import { ResetPasswordForm } from "./reset-password-form";

type P = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
const make = (tag: string) =>
  function Mark({ href, children, ...rest }: P) {
    return (
      <a href={href} data-from={tag} {...rest}>
        {children}
      </a>
    );
  };
const Provided = make("provider");
const Explicit = make("prop");

const menuProps = {
  vendor: { name: "Manfred" },
  signOutAction: vi.fn().mockResolvedValue(undefined),
  getHelp: { type: "mailto" as const, address: "support@merqo.app" },
  onFeedbackSubmit: vi.fn(),
};

function wrap(node: React.ReactNode, component: typeof Provided | null = Provided) {
  return (
    <ThemeProvider attribute="class">
      {component ? <AppLinkProvider component={component}>{node}</AppLinkProvider> : node}
    </ThemeProvider>
  );
}

describe("useAppLink", () => {
  it("returns undefined without a provider and the component within one", () => {
    let seen: unknown = "unset";
    function Probe() {
      seen = useAppLink();
      return null;
    }
    render(<Probe />);
    expect(seen).toBeUndefined();
    render(
      <AppLinkProvider component={Provided}>
        <Probe />
      </AppLinkProvider>,
    );
    expect(seen).toBe(Provided);
  });
});

describe("AppLinkProvider", () => {
  async function openMenu(component: typeof Provided | null, LinkComponent?: typeof Provided) {
    const user = userEvent.setup();
    render(wrap(<AccountMenu {...menuProps} LinkComponent={LinkComponent} />, component));
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: /account menu/i }),
    });
    return screen.findByRole("menuitem", { name: /profile/i });
  }

  it("supplies the link to AccountMenu", async () => {
    expect(await openMenu(Provided)).toHaveAttribute("data-from", "provider");
  });

  it("lets an explicit LinkComponent prop beat the provider", async () => {
    expect(await openMenu(Provided, Explicit)).toHaveAttribute("data-from", "prop");
  });

  it("falls back to a plain <a> with no provider", async () => {
    expect(await openMenu(null)).not.toHaveAttribute("data-from");
  });

  it("supplies the link to DashboardNav and its AccountMenu", () => {
    render(
      wrap(
        <DashboardNav
          {...menuProps}
          wordmark={<span>QKit</span>}
          navLinks={[{ href: "/d", label: "Home" }]}
        />,
      ),
    );
    for (const link of screen.getAllByRole("link", { name: "Home" })) {
      expect(link).toHaveAttribute("data-from", "provider");
    }
  });

  it("supplies the link to LandingAccountNav", () => {
    const props = {
      kit: "qkit" as const,
      dashboardHref: "/dashboard",
      user: { name: "Manfred", email: "m@x.co" },
      signOutAction: vi.fn(),
      supportCategories: { other: "Other" } as const,
      actions: { submitSupport: vi.fn(), submitFeedback: vi.fn() },
    };
    const { unmount } = render(wrap(<LandingAccountNav {...props} />));
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("data-from", "provider");
    unmount();
    render(wrap(<LandingAccountNav {...props} LinkComponent={Explicit} />));
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("data-from", "prop");
  });

  it("supplies the link to LoginForm", () => {
    const { unmount } = render(
      wrap(<LoginForm onPasswordSignIn={vi.fn()} forgotPasswordHref="/forgot" />),
    );
    expect(screen.getByRole("link", { name: /forgot/i })).toHaveAttribute("data-from", "provider");
    unmount();
    render(wrap(<LoginForm onPasswordSignIn={vi.fn()} forgotPasswordHref="/forgot" />, null));
    expect(screen.getByRole("link", { name: /forgot/i })).not.toHaveAttribute("data-from");
  });

  it("supplies the link to ResetPasswordForm", () => {
    render(wrap(<ResetPasswordForm onSubmit={vi.fn()} signInHref="/login" />));
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
      "data-from",
      "provider",
    );
  });
});

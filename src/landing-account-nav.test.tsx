import type { AnchorHTMLAttributes } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

import { LandingAccountNav } from "./landing-account-nav";
import { getSwitchKits } from "./kit-family";

const CATEGORIES = { billing: "Billing", bug: "Bug", other: "Other" } as const;

const submitSupport = vi.fn();
const submitFeedback = vi.fn();
const signOutAction = vi.fn().mockResolvedValue(undefined);

function setup(props: Partial<Parameters<typeof LandingAccountNav>[0]> = {}) {
  const user = userEvent.setup();
  render(
    <ThemeProvider attribute="class">
      <LandingAccountNav
        kit="qkit"
        dashboardHref="/dashboard"
        user={{ name: "Manfred", email: "m@x.co" }}
        signOutAction={signOutAction}
        supportCategories={CATEGORIES}
        actions={{ submitSupport, submitFeedback }}
        {...props}
      />
    </ThemeProvider>,
  );
  return user;
}

async function openByTouch(user: ReturnType<typeof userEvent.setup>) {
  await user.pointer({
    keys: "[TouchA]",
    target: screen.getByRole("button", { name: /account menu/i }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  submitSupport.mockResolvedValue({ success: true });
  submitFeedback.mockResolvedValue({ success: true });
});

describe("LandingAccountNav", () => {
  it("renders a Dashboard link with the given href", () => {
    setup({ dashboardHref: "/post-login" });
    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveAttribute("href", "/post-login");
    expect(link.className).toContain("min-h-11");
  });

  it("labels the trigger with the stall name, not the email", () => {
    setup();
    const trigger = screen.getByRole("button", { name: /account menu/i });
    expect(trigger).toHaveTextContent("Manfred");
    expect(trigger).not.toHaveTextContent("m@x.co");
  });

  it("uses LinkComponent for the Dashboard link", () => {
    const Custom = ({
      href,
      children,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
      <a href={href} data-custom="1" {...rest}>
        {children}
      </a>
    );
    setup({ LinkComponent: Custom });
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("data-custom", "1");
  });

  it("opens by touch with Switch products, Get help, Feedback and Sign out", async () => {
    const user = setup();
    await openByTouch(user);
    expect(await screen.findByText(/switch products/i)).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /get help/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /feedback/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
    await user.pointer({ keys: "[TouchA]", target: screen.getByText(/switch products/i) });
    for (const kit of getSwitchKits("qkit")) {
      expect(await screen.findByRole("menuitem", { name: kit.label })).toHaveAttribute(
        "href",
        kit.href,
      );
    }
  });

  async function openHelp(user: ReturnType<typeof userEvent.setup>) {
    await openByTouch(user);
    await user.pointer({
      keys: "[TouchA]",
      target: await screen.findByRole("menuitem", { name: /get help/i }),
    });
  }

  it("maps a known support category through", async () => {
    const user = setup();
    await openHelp(user);
    await user.click(await screen.findByRole("radio", { name: "Bug" }));
    await user.type(await screen.findByLabelText(/message/i), "help");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() =>
      expect(submitSupport).toHaveBeenCalledWith({ category: "bug", message: "help" }),
    );
  });

  it("narrows a missing support category to other", async () => {
    const user = setup({ supportCategories: {} });
    await openHelp(user);
    await user.type(await screen.findByLabelText(/message/i), "help");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() =>
      expect(submitSupport).toHaveBeenCalledWith({ category: "other", message: "help" }),
    );
  });

  it("narrows an unknown present support category to other", async () => {
    vi.resetModules();
    let onSubmit: ((d: { category?: string; message: string }) => Promise<void>) | undefined;
    vi.doMock("./account-menu", () => ({
      AccountMenu: (p: { getHelp: { onSubmit: typeof onSubmit } }) => {
        onSubmit = p.getHelp.onSubmit;
        return null;
      },
    }));
    const { LandingAccountNav: Isolated } = await import("./landing-account-nav");
    render(
      <Isolated
        kit="qkit"
        dashboardHref="/dashboard"
        user={{ name: "Manfred" }}
        signOutAction={signOutAction}
        supportCategories={CATEGORIES}
        actions={{ submitSupport, submitFeedback }}
      />,
    );
    await onSubmit?.({ category: "bogus", message: "help" });
    expect(submitSupport).toHaveBeenCalledWith({ category: "other", message: "help" });
    vi.doUnmock("./account-menu");
  });

  it("toasts a failed support action by default", async () => {
    submitSupport.mockResolvedValue({ success: false, error: "No luck" });
    const user = setup();
    await openHelp(user);
    await user.type(await screen.findByLabelText(/message/i), "help");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("No luck"));
  });

  it("uses the generic message when the action gives no error", async () => {
    submitSupport.mockResolvedValue({ success: false });
    const user = setup();
    await openHelp(user);
    await user.type(await screen.findByLabelText(/message/i), "help");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Something went wrong. Please try again."),
    );
  });

  it("falls back to the generic message for non-Error throws", async () => {
    submitSupport.mockRejectedValue("boom");
    const user = setup();
    await openHelp(user);
    await user.type(await screen.findByLabelText(/message/i), "help");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Something went wrong. Please try again."),
    );
  });

  it("custom onError replaces the toast", async () => {
    submitSupport.mockResolvedValue({ success: false, error: "No luck" });
    const onError = vi.fn();
    const user = setup({ onError });
    await openHelp(user);
    await user.type(await screen.findByLabelText(/message/i), "help");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect((onError.mock.calls[0][0] as Error).message).toBe("No luck");
    expect(toastError).not.toHaveBeenCalled();
  });

  async function openFeedback(user: ReturnType<typeof userEvent.setup>) {
    await openByTouch(user);
    await user.pointer({
      keys: "[TouchA]",
      target: await screen.findByRole("menuitem", { name: /feedback/i }),
    });
  }

  it("sends feedback as vendor with trimmed message", async () => {
    const user = setup();
    await openFeedback(user);
    await user.click(await screen.findByRole("radio", { name: "9" }));
    await user.type(screen.getByLabelText(/message|tell us|comment/i), "  great  ");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith({
        source: "vendor",
        nps: 9,
        message: "great",
      }),
    );
  });

  it("sends undefined message when feedback text is blank and nps defaults to 0", async () => {
    const user = setup();
    await openFeedback(user);
    await user.click(await screen.findByRole("radio", { name: "7" }));
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith({
        source: "vendor",
        nps: 7,
        message: undefined,
      }),
    );
  });

  it("toasts a failed feedback action", async () => {
    submitFeedback.mockResolvedValue({ success: false, error: "Nope" });
    const user = setup();
    await openFeedback(user);
    await user.click(await screen.findByRole("radio", { name: "7" }));
    await user.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Nope"));
  });
});

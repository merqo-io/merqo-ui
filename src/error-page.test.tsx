import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ErrorPage, GlobalError } from "./error-page";

const colors = {
  background: "white",
  foreground: "black",
  mutedForeground: "gray",
  primary: "orange",
  primaryForeground: "white",
};

describe("ErrorPage", () => {
  it("reports the error and retries by touch", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<ErrorPage error={error} reset={reset} wordmark={<b>Kit</b>} actions={<a href="/">Home</a>} />);
    expect(spy).toHaveBeenCalledWith("Unhandled error", error);
    expect(screen.getByText("Reference: abc123")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Try again" }) });
    expect(reset).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("uses a custom reporter and copy", () => {
    const onError = vi.fn();
    const error = new Error("x");
    render(
      <ErrorPage
        error={error}
        reset={() => {}}
        onError={onError}
        eyebrow="Oops"
        title="Custom"
        description="Desc"
        resetLabel="Retry"
      />,
    );
    expect(onError).toHaveBeenCalledWith(error);
    expect(screen.getByRole("heading", { name: "Custom" })).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText(/Reference/)).toBeNull();
  });
});

describe("GlobalError", () => {
  it("renders its own html and body with the kit colours", () => {
    const html = renderToStaticMarkup(
      <GlobalError reset={() => {}} colors={colors} fontFamily="serif" lang="en-SG" />,
    );
    expect(html).toContain('<html lang="en-SG">');
    expect(html).toContain("background:white");
    expect(html).toContain("color:black");
    expect(html).toContain("font-family:serif");
    expect(html).toContain("Something went wrong");
  });

  it("calls reset from the button by touch", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const { createRoot } = await import("react-dom/client");
    const { act } = await import("react");
    const root = createRoot(container);
    // html/body cannot nest in a div, so mount only the button path via a stub render.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      root.render(<GlobalError reset={reset} colors={colors} resetLabel="Go again" />);
    });
    errSpy.mockRestore();
    const button = container.querySelector("button") ?? document.querySelector("button");
    expect(button).not.toBeNull();
    await user.pointer({ keys: "[TouchA]", target: button as HTMLElement });
    expect(reset).toHaveBeenCalled();
    await act(async () => root.unmount());
    container.remove();
  });
});

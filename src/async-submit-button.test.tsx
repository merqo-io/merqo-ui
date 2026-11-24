import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AsyncSubmitButton } from "./async-submit-button";
import * as api from "./index";

describe("AsyncSubmitButton", () => {
  it("is part of the public API", () => {
    expect(api.AsyncSubmitButton).toBe(AsyncSubmitButton);
  });
  it("submits its form by touch", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AsyncSubmitButton pending={false}>Save</AsyncSubmitButton>
      </form>,
    );
    const user = userEvent.setup();
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Save" }),
    });
    expect(onSubmit).toHaveBeenCalled();
  });
  it("shows the pending label, disables and marks busy", () => {
    render(
      <AsyncSubmitButton pending pendingChildren="Saving…">
        Save
      </AsyncSubmitButton>,
    );
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("AsyncSubmitButton reduced motion", () => {
  it("spins only when motion is allowed and keeps the icon", () => {
    render(<AsyncSubmitButton pending>Save</AsyncSubmitButton>);
    const icon = screen.getByRole("button").querySelector("svg")!;
    const tokens = icon.getAttribute("class")!.split(" ");
    expect(tokens).toContain("motion-safe:animate-spin");
    expect(tokens).not.toContain("animate-spin");
  });
});

describe("AsyncSubmitButton touch and focus", () => {
  it("keeps the same horizontal padding while pending", () => {
    const pad = (el: HTMLElement) => el.className.split(" ").filter((t) => /px-/.test(t)).sort();
    const idle = render(<AsyncSubmitButton pending={false}>Save</AsyncSubmitButton>);
    const idlePad = pad(screen.getByRole("button"));
    idle.unmount();
    render(<AsyncSubmitButton pending>Save</AsyncSubmitButton>);
    expect(pad(screen.getByRole("button"))).toEqual(idlePad);
    expect(idlePad).toContain("has-[>svg]:px-4");
  });

  it("grows to 44px on coarse pointers and shows the shared focus ring", () => {
    render(<AsyncSubmitButton pending={false}>Save</AsyncSubmitButton>);
    const tokens = screen.getByRole("button", { name: "Save" }).className.split(" ");
    expect(tokens).toContain("pointer-coarse:h-11");
    expect(tokens).toContain("focus-visible:ring-[3px]");
    expect(tokens).toContain("focus-visible:ring-ring/50");
  });
});

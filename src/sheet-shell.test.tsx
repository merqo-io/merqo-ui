import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SheetShell, SheetMessageForm } from "./sheet-shell";

describe("SheetShell", () => {
  it("renders title, description and children when open", () => {
    render(
      <SheetShell open onOpenChange={() => {}} title="T" description="D">
        <p>body</p>
      </SheetShell>,
    );
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });
});

describe("SheetMessageForm", () => {
  it("wires the textarea, error and touch submit", async () => {
    const onSubmit = vi.fn();
    const onMessageChange = vi.fn();
    render(
      <SheetMessageForm
        messageId="m"
        message=""
        onMessageChange={onMessageChange}
        onSubmit={onSubmit}
        pending={false}
        errorMessage="Nope"
      >
        <span>extra</span>
      </SheetMessageForm>,
    );
    expect(screen.getByText("extra")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Nope");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Message"), "a");
    expect(onMessageChange).toHaveBeenCalledWith("a");
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Send" }),
    });
    expect(onSubmit).toHaveBeenCalled();
  });
});

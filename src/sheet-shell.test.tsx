import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SheetShell, SheetMessageForm, SheetConfirmation } from "./sheet-shell";

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
  it("wires the textarea, error and touch submit when the message is filled", async () => {
    const onSubmit = vi.fn();
    const onMessageChange = vi.fn();
    render(
      <SheetMessageForm
        messageId="m"
        message="hi"
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
    expect(onMessageChange).toHaveBeenCalledWith("hia");
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Send" }),
    });
    expect(onSubmit).toHaveBeenCalled();
  });

  it("submits a blank message when messageRequired is false", async () => {
    const onSubmit = vi.fn();
    render(
      <SheetMessageForm
        messageId="m"
        message=""
        onMessageChange={() => {}}
        onSubmit={onSubmit}
        pending={false}
        messageRequired={false}
      />,
    );
    const user = userEvent.setup();
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Send" }),
    });
    expect(onSubmit).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("SheetMessageForm touch target", () => {
  it("keeps the Send button at least 44px tall on coarse pointers", () => {
    render(
      <SheetMessageForm
        messageId="m"
        message=""
        onMessageChange={() => {}}
        onSubmit={() => {}}
        pending={false}
        errorMessage={null}
      />,
    );
    expect(screen.getByRole("button", { name: "Send" })).toHaveClass("pointer-coarse:h-11");
  });
});

describe("SheetMessageForm primitives", () => {
  it("renders the shared textarea and the Done button with focus rings", () => {
    render(
      <SheetMessageForm messageId="m" message="" onMessageChange={() => {}} onSubmit={() => {}} pending={false} />,
    );
    expect(screen.getByLabelText("Message")).toHaveAttribute("data-slot", "textarea");
    render(<SheetConfirmation title="Sent" body="Thanks" onDone={() => {}} />);
    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toHaveAttribute("data-slot", "button");
    expect(done.className.split(" ")).toContain("pointer-coarse:h-11");
  });
});

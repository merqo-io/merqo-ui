import { describe, it, expect, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackSheet } from "./feedback-sheet";

describe("FeedbackSheet", () => {
  it("renders nothing visible when closed", () => {
    render(
      <FeedbackSheet open={false} onOpenChange={() => {}} onSubmit={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the feedback form when open", () => {
    render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("calls onSubmit with the message and the given source/metric when the form is submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackSheet
        open
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        source="vendor"
        metric="nps"
      />,
    );

    await user.type(screen.getByLabelText(/message/i), "Great app!");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      message: "Great app!",
      source: "vendor",
      metric: "nps",
    });
  });

  it("does not call onSubmit when the message is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the sheet open on a confirmation after a successful submit, and closes only on Done", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackSheet open onOpenChange={onOpenChange} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText(/message/i), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    const status = await screen.findByRole("status");
    expect(within(status).getByText("Feedback sent")).toBeInTheDocument();
    expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(within(status).getByText("Feedback sent")).toHaveFocus();
    expect(document.activeElement).toBe(within(status).getByText("Feedback sent"));

    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Done" }),
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the draft message when closed without sending and reopened", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText(/message/i), "draft text");

    rerender(<FeedbackSheet open={false} onOpenChange={() => {}} onSubmit={onSubmit} />);
    rerender(<FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/message/i)).toHaveValue("draft text");
  });

  it("showNps: keeps a picked score when closed without sending and reopened", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} showNps />,
    );
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("radio", { name: "8" }) });

    rerender(<FeedbackSheet open={false} onOpenChange={() => {}} onSubmit={onSubmit} showNps />);
    rerender(<FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} showNps />);

    expect(screen.getByRole("radio", { name: "8" })).toHaveAttribute("aria-checked", "true");
  });

  it("reopens on an empty form, not the confirmation, after a send and a non-Done close", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText(/message/i), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await screen.findByRole("status");

    rerender(<FeedbackSheet open={false} onOpenChange={() => {}} onSubmit={onSubmit} />);
    rerender(<FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toHaveValue("");
  });

  it("a send that resolves after the sheet was closed leaves an empty form on the next open", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    const { rerender } = render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText(/message/i), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));
    rerender(<FeedbackSheet open={false} onOpenChange={() => {}} onSubmit={onSubmit} />);
    await act(async () => {
      resolve();
    });
    rerender(<FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toHaveValue("");
  });

  it("shows 'Write a message first' for a blank message, wires aria, and clears it on typing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /send/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Write a message first");
    const textarea = screen.getByLabelText(/message/i);
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", alert.id);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(textarea, "a");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(textarea).not.toHaveAttribute("aria-invalid", "true");
  });

  it("C3: shows an inline error and calls onError when onSubmit rejects, and does not close the sheet", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onError = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error("submit failed"));
    render(
      <FeedbackSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    await user.type(screen.getByLabelText(/message/i), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("submit failed")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("treats a Next.js redirect from onSubmit as navigation, not an error", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(
      Object.assign(new Error("NEXT_REDIRECT"), {
        digest: "NEXT_REDIRECT;push;/thanks;303;",
      }),
    );
    render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} onError={onError} />,
    );

    await user.type(screen.getByLabelText(/message/i), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmit).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(/NEXT_REDIRECT/)).not.toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
  });

  it("does not render the NPS score grid when showNps is not set", () => {
    render(<FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} />);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("showNps: renders an 11-button 0-10 score radiogroup", () => {
    render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} showNps />,
    );
    const group = screen.getByRole("radiogroup", {
      name: "How likely are you to recommend us?",
    });
    expect(screen.getByText("How likely are you to recommend us?")).toBeVisible();
    expect(
      screen.getByText("0 is not likely, 10 is very likely"),
    ).toBeVisible();
    expect(group).toHaveClass("grid-cols-6");
    const buttons = within(group).getAllByRole("radio");
    expect(buttons).toHaveLength(11);
    expect(screen.getByRole("radio", { name: "0" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "10" })).toBeInTheDocument();
  });

  it("showNps: npsLabel replaces the visible question and the group's accessible name", () => {
    render(
      <FeedbackSheet
        open
        onOpenChange={() => {}}
        onSubmit={vi.fn()}
        showNps
        npsLabel="Would you tell a friend?"
      />,
    );
    expect(
      screen.getByRole("radiogroup", { name: "Would you tell a friend?" }),
    ).toBeInTheDocument();
  });

  it("showNps: a touch pointer selects a score", async () => {
    const user = userEvent.setup();
    render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} showNps />,
    );
    const seven = screen.getByRole("radio", { name: "7" });
    await user.pointer({ keys: "[TouchA]", target: seven });
    expect(seven).toHaveAttribute("aria-checked", "true");
  });

  it("showNps: blocks submit and shows inline validation when no score is picked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={onSubmit} showNps />,
    );

    await user.type(screen.getByLabelText(/message/i), "Great app!");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Pick a score first")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("showNps: submits successfully with an empty message when a score is picked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <FeedbackSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        showNps
        source="vendor"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      message: "",
      source: "vendor",
      metric: undefined,
      nps: 9,
    });
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("showNps: includes the picked score in the onSubmit payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedbackSheet
        open
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        showNps
        source="vendor"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.type(screen.getByLabelText(/message/i), "Great app!");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      message: "Great app!",
      source: "vendor",
      metric: undefined,
      nps: 9,
    });
  });

  it("showNps: arrow keys move focus and selection between score pills", async () => {
    const user = userEvent.setup();
    render(
      <FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} showNps />,
    );

    screen.getByRole("radio", { name: "0" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "1" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "1" })).toHaveFocus();
  });

  it("uses the default title/description when none are given", () => {
    render(<FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} />);
    expect(screen.getByText("Feedback")).toBeInTheDocument();
    expect(screen.getByText("Tell us what's working, or what isn't.")).toBeInTheDocument();
  });

  it("uses the given title/description when provided", () => {
    render(
      <FeedbackSheet
        open
        onOpenChange={() => {}}
        onSubmit={vi.fn()}
        title="Share feedback"
        description="What's working, what's missing, what's broken?"
      />,
    );
    expect(screen.getByText("Share feedback")).toBeInTheDocument();
    expect(screen.getByText("What's working, what's missing, what's broken?")).toBeInTheDocument();
  });
});

describe("FeedbackSheet score error Alert", () => {
  it("shows the missing-score error in an Alert", async () => {
    const user = userEvent.setup();
    render(<FeedbackSheet open onOpenChange={() => {}} onSubmit={vi.fn()} showNps />);
    await user.type(screen.getByLabelText(/message/i), "Great app!");
    await user.click(screen.getByRole("button", { name: /send/i }));
    const alert = (await screen.findByText("Pick a score first")).closest("[role=alert]");
    expect(alert).toHaveAttribute("data-slot", "alert");
  });
});
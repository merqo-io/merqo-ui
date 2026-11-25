// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DownloadButton } from "./download-button";

describe("DownloadButton", () => {
  it("shows a pending state while onDownload runs, then resets", async () => {
    let resolve!: () => void;
    const onDownload = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<DownloadButton label="Download CSV" onDownload={onDownload} />);
    const btn = screen.getByRole("button", { name: "Download CSV" });
    await user.pointer({ keys: "[TouchA]", target: btn });
    expect(onDownload).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(btn).toBeDisabled());
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(document.querySelector('[role="status"]')).toBeNull();
    resolve();
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("uses pendingLabel while pending", async () => {
    let resolve!: () => void;
    const user = userEvent.setup();
    render(
      <DownloadButton
        label="Download CSV"
        pendingLabel="Preparing"
        onDownload={() => new Promise<void>((r) => (resolve = r))}
      />,
    );
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button"),
    });
    expect(await screen.findByRole("button", { name: "Preparing" })).toBeDisabled();
    resolve();
    await screen.findByRole("button", { name: "Download CSV" });
  });

  it("reports a failure to onError and re-enables", async () => {
    const err = new Error("nope");
    const onError = vi.fn();
    const user = userEvent.setup();
    render(
      <DownloadButton
        label="Go"
        onDownload={() => Promise.reject(err)}
        onError={onError}
      />,
    );
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button"),
    });
    await waitFor(() => expect(onError).toHaveBeenCalledWith(err));
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
  });
});

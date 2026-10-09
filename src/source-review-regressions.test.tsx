import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ImageUploader } from "./image-uploader";
import { commitPendingImages, isPendingImage } from "./pending-image";
import { DashboardTour } from "./dashboard-tour";
import { MoneyInput } from "./money-input";
import { PricingForm } from "./pricing-form";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function uploader(
  onUpload = vi.fn().mockResolvedValue("https://example.test/image.jpg"),
) {
  const onChange = vi.fn();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static readonly createObjectURL = vi.fn(() => "blob:owned-preview");
      static readonly revokeObjectURL = vi.fn();
    },
  );
  const props = {
    bucket: "images",
    pathPrefix: "owner",
    value: null,
    deferUpload: true,
    onChange,
    onUpload,
  };
  return { props, onChange };
}

async function pick(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]');
  if (!input) throw new Error("Missing file input");
  await act(async () => {
    fireEvent.change(input, {
      target: { files: [new File(["image"], "a.jpg", { type: "image/jpeg" })] },
    });
  });
}

describe("owned deferred previews", () => {
  it("retains retry data through failed save and releases only after replacement", async () => {
    const { props, onChange } = uploader();
    const { container, rerender } = render(
      <React.StrictMode>
        <ImageUploader {...props} />
      </React.StrictMode>,
    );
    await pick(container);
    const preview = onChange.mock.calls[0][0] as string;
    rerender(
      <React.StrictMode>
        <ImageUploader {...props} value={preview} />
      </React.StrictMode>,
    );
    await commitPendingImages([preview]);
    expect(isPendingImage(preview)).toBe(true);
    await commitPendingImages([preview]);
    expect(props.onUpload).toHaveBeenCalledTimes(2);
    rerender(
      <React.StrictMode>
        <ImageUploader {...props} value="https://example.test/saved.jpg" />
      </React.StrictMode>,
    );
    expect(isPendingImage(preview)).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(preview);
  });

  it("releases abandoned previews without cancelling an already captured commit", async () => {
    let finish: (url: string) => void = () => {};
    const onUpload = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    const { props, onChange } = uploader(onUpload);
    const { container, unmount } = render(<ImageUploader {...props} />);
    await pick(container);
    const preview = onChange.mock.calls[0][0] as string;
    const committing = commitPendingImages([preview]);
    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(isPendingImage(preview)).toBe(false);
    finish("https://example.test/saved.jpg");
    await expect(committing).resolves.toMatchObject({
      urls: ["https://example.test/saved.jpg"],
    });
  });

  it("does not register a preview when resize finishes after unmount", async () => {
    let finish: (result: {
      blob: Blob;
      ext: string;
      type: string;
    }) => void = () => {};
    const resizeImage = vi.fn(
      () =>
        new Promise<{ blob: Blob; ext: string; type: string }>((resolve) => {
          finish = resolve;
        }),
    );
    const { props, onChange } = uploader();
    const { container, unmount } = render(
      <ImageUploader {...props} resizeImage={resizeImage} />,
    );
    await pick(container);
    unmount();
    await act(async () => {
      finish({ blob: new Blob(["x"]), ext: "jpg", type: "image/jpeg" });
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(props.onUpload).not.toHaveBeenCalled();
  });
});

it.each(["1e308", "9007199254740992"])(
  "rejects unsafe monetary cents from %s",
  (input) => {
    const onCommit = vi.fn();
    const onSave = vi.fn();
    render(
      <>
        <MoneyInput cents={100} onCommit={onCommit} placeholder="Amount" />
        <PricingForm
          fields={[{ key: "price", label: "Price" }]}
          initial={{ values: { price: 100 }, currency: "SGD" }}
          onSave={onSave}
        />
      </>,
    );
    fireEvent.change(screen.getByPlaceholderText("Amount"), {
      target: { value: input },
    });
    fireEvent.change(screen.getByLabelText("Price"), {
      target: { value: input },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a valid/i)).toBeInTheDocument();
  },
);

it.each(["sync", "async"])(
  "contains %s tour persistence failure and failed replay",
  async (mode) => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const onFirstSeen = vi.fn(() => {
      if (mode === "sync") throw error;
      return Promise.reject(error);
    });
    const steps = vi.fn(() => {
      throw new Error("steps unavailable");
    });
    render(
      <DashboardTour
        steps={steps}
        seen={false}
        onFirstSeen={onFirstSeen}
        isHomeRoute
        navigateHome={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(log).toHaveBeenCalledWith("Onboarding tour failed", error),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Replay onboarding tour" }),
    );
    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(
        "Onboarding tour failed",
        expect.objectContaining({ message: "steps unavailable" }),
      ),
    );
  },
);

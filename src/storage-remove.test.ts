import { afterEach, describe, expect, it, vi } from "vitest";
import {
  removeImagesByUrl,
  removeReplacedImage,
  removeStorageObjects,
  replacedImageTarget,
  type StorageRemover,
} from "./storage-remove";

const base = "https://x.supabase.co/storage/v1/object/public";

function fakeClient(result: unknown = { error: null }) {
  const remove = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ remove });
  return { client: { storage: { from } } as unknown as StorageRemover, from, remove };
}

afterEach(() => vi.restoreAllMocks());

describe("removeStorageObjects", () => {
  it("removes the paths from the bucket", async () => {
    const { client, from, remove } = fakeClient();
    await removeStorageObjects(client, "b", ["a/1.png", "a/2.png"]);
    expect(from).toHaveBeenCalledWith("b");
    expect(remove).toHaveBeenCalledWith(["a/1.png", "a/2.png"]);
  });

  it("does nothing for an empty list", async () => {
    const { client, from } = fakeClient();
    await removeStorageObjects(client, "b", []);
    expect(from).not.toHaveBeenCalled();
  });

  it("logs a returned error and a thrown one without throwing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await removeStorageObjects(fakeClient({ error: { message: "denied" } }).client, "b", ["p"], {
      label: "QR image cleanup",
    });
    expect(spy).toHaveBeenCalledWith("QR image cleanup failed", "denied");
    const throwing = {
      storage: {
        from: () => ({
          remove: () => {
            throw new Error("net");
          },
        }),
      },
    } as unknown as StorageRemover;
    await removeStorageObjects(throwing, "b", ["p"]);
    expect(spy).toHaveBeenCalledWith("Image cleanup failed", expect.any(Error));
  });
});

describe("removeImagesByUrl", () => {
  it("skips URLs outside the bucket and empty values", async () => {
    const { client, remove } = fakeClient();
    await removeImagesByUrl(client, "booth-images", [
      `${base}/booth-images/v1/a.png`,
      `${base}/other/v1/b.png`,
      "https://lh3.googleusercontent.com/a.png",
      null,
      undefined,
    ]);
    expect(remove).toHaveBeenCalledWith(["v1/a.png"]);
  });

  it("keeps only the owner's folder when ownerFolder is set", async () => {
    const { client, remove } = fakeClient();
    await removeImagesByUrl(
      client,
      "booth-images",
      [`${base}/booth-images/v1/a.png`, `${base}/booth-images/v2/b.png`],
      { ownerFolder: "v1" },
    );
    expect(remove).toHaveBeenCalledWith(["v1/a.png"]);
  });

  it("makes no call when nothing qualifies", async () => {
    const { client, from } = fakeClient();
    await removeImagesByUrl(client, "b", ["nope"]);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("replacedImageTarget", () => {
  const buckets = ["vendor-images", "booth-images"];

  it("returns null when there is no previous or the same image", () => {
    const url = `${base}/vendor-images/v1/a.png`;
    expect(replacedImageTarget({ buckets, before: null, after: url })).toBeNull();
    expect(replacedImageTarget({ buckets, before: url, after: url })).toBeNull();
  });

  it("finds the owning bucket in order", () => {
    expect(
      replacedImageTarget({
        buckets,
        before: `${base}/booth-images/v1/a.png`,
        after: null,
        ownerFolder: "v1",
      }),
    ).toEqual({ bucket: "booth-images", path: "v1/a.png" });
  });

  it("refuses another owner's object and foreign URLs", () => {
    expect(
      replacedImageTarget({
        buckets,
        before: `${base}/vendor-images/v2/a.png`,
        after: null,
        ownerFolder: "v1",
      }),
    ).toBeNull();
    expect(
      replacedImageTarget({ buckets, before: "https://elsewhere.test/a.png", after: null }),
    ).toBeNull();
  });
});

describe("removeReplacedImage", () => {
  it("deletes the replaced object", async () => {
    const { client, from, remove } = fakeClient();
    await removeReplacedImage(client, {
      buckets: ["vendor-images"],
      before: `${base}/vendor-images/v1/a.png`,
      after: `${base}/vendor-images/v1/b.png`,
      ownerFolder: "v1",
    });
    expect(from).toHaveBeenCalledWith("vendor-images");
    expect(remove).toHaveBeenCalledWith(["v1/a.png"]);
  });

  it("does nothing when nothing was replaced", async () => {
    const { client, from } = fakeClient();
    await removeReplacedImage(client, { buckets: ["b"], before: null, after: null });
    expect(from).not.toHaveBeenCalled();
  });
});

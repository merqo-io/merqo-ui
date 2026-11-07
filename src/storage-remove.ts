import { storagePathFromPublicUrl } from "./storage-path";

/** Smallest slice of a Supabase client (browser, server or service role) that deletes objects. */
export type StorageRemover = {
  storage: {
    from(bucket: string): {
      remove(
        paths: string[],
      ): PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

export type RemoveStorageOptions = {
  /** Prefix of the log line when a delete fails. */
  label?: string;
};

/**
 * Best-effort delete of storage objects that nothing references any more.
 * Never throws: the save that orphaned them has already succeeded or failed,
 * and a leftover object is only wasted storage. Failures are logged by
 * message so a broken cleanup stays visible.
 */
export async function removeStorageObjects(
  client: StorageRemover,
  bucket: string,
  paths: readonly string[],
  { label = "Image cleanup" }: RemoveStorageOptions = {},
): Promise<void> {
  if (paths.length === 0) return;
  try {
    const { error } = await client.storage.from(bucket).remove([...paths]);
    if (error) console.error(`${label} failed`, error.message);
  } catch (error) {
    console.error(`${label} failed`, error);
  }
}

/**
 * Deletes the objects behind public URLs in one bucket. URLs that are not
 * public URLs in that bucket (an OAuth avatar, a pasted link) are skipped.
 * With `ownerFolder`, an object outside `<ownerFolder>/` is skipped too:
 * required when the client is service role, which no storage policy bounds.
 */
export async function removeImagesByUrl(
  client: StorageRemover,
  bucket: string,
  urls: readonly (string | null | undefined)[],
  options: RemoveStorageOptions & { ownerFolder?: string } = {},
): Promise<void> {
  const { ownerFolder, ...rest } = options;
  const paths = urls.flatMap((url) => {
    const path = storagePathFromPublicUrl(url, bucket);
    if (!path) return [];
    if (ownerFolder !== undefined && path.split("/")[0] !== ownerFolder) {
      return [];
    }
    return [path];
  });
  await removeStorageObjects(client, bucket, paths, rest);
}

export type ReplacedImageTarget = { bucket: string; path: string };

/**
 * The object a save stopped referencing, or null when there is nothing to
 * delete: no previous image, the same image kept, a URL outside `buckets`, or
 * (with `ownerFolder`) an object outside that folder. `buckets` are tried in
 * order; the first that owns the URL decides.
 */
export function replacedImageTarget(options: {
  buckets: readonly string[];
  before: string | null | undefined;
  after: string | null | undefined;
  ownerFolder?: string;
}): ReplacedImageTarget | null {
  const { buckets, before, after, ownerFolder } = options;
  if (!before || before === after) return null;
  for (const bucket of buckets) {
    const path = storagePathFromPublicUrl(before, bucket);
    if (!path) continue;
    if (ownerFolder !== undefined && path.split("/")[0] !== ownerFolder) {
      return null;
    }
    return { bucket, path };
  }
  return null;
}

/** Best-effort delete of the image a successful save replaced or cleared. */
export async function removeReplacedImage(
  client: StorageRemover,
  options: Parameters<typeof replacedImageTarget>[0] & RemoveStorageOptions,
): Promise<void> {
  const { label, ...target } = options;
  const found = replacedImageTarget(target);
  if (!found) return;
  await removeStorageObjects(client, found.bucket, [found.path], { label });
}

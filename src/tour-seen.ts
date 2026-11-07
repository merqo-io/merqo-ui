/** The two Storage methods the tour core needs, so a test or kit can pass its own. */
export interface TourSeenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): TourSeenStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Whether the tour stored under `key` has been seen. Storage that is missing
 * or blocked (private mode, SSR) reads as unseen, so the worst case is that a
 * tour shows once more. The kit owns the key; this package never invents one.
 */
export function readTourSeen(key: string, storage: TourSeenStorage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/** Marks the tour under `key` as seen with an ISO timestamp. Never throws. */
export function writeTourSeen(
  key: string,
  storage: TourSeenStorage | null = defaultStorage(),
  now: Date = new Date(),
): void {
  if (!storage) return;
  try {
    storage.setItem(key, now.toISOString());
  } catch {
    return;
  }
}

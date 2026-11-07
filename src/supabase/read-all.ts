type Page<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

// PostgREST caps a response at 1000 rows by default.
const PAGE_SIZE = 1000;
// A runaway query (a page function that ignores its range) must fail, not loop forever.
const MAX_PAGES = 1000;

/**
 * Reads a deterministically ordered query to the end instead of silently
 * truncating at the API row cap. `page(from, to)` is an inclusive range, as
 * `.range(from, to)` expects. A failed page throws rather than returning a
 * partial collection.
 */
export async function readAllRows<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber++) {
    const { data, error } = await page(rows.length, rows.length + PAGE_SIZE - 1);
    if (error || !data) {
      console.error("readAllRows: page failed", error?.message ?? "no data");
      throw new Error("Could not load complete query results");
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
  console.error("readAllRows: page limit reached", MAX_PAGES);
  throw new Error("Could not load complete query results");
}

/** `readAllRows` for route handlers that map a read failure to HTTP 503. */
export async function readAllRowsResult<T>(
  page: (from: number, to: number) => Page<T>,
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  try {
    return { data: await readAllRows(page), error: null };
  } catch {
    return { data: null, error: { message: "Could not load complete query results" } };
  }
}

/**
 * Saves a Blob through a transient anchor; browser-only. The object URL is
 * revoked after a short delay because some browsers (Safari) start the save
 * asynchronously and fail if the URL disappears in the same tick.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

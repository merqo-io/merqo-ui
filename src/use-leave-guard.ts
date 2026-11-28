"use client";

import { useCallback, useEffect } from "react";

const DEFAULT_MESSAGE = "Leave this page? Changes you made may not be saved.";

/** True when `href` is an http(s) page other than the current one. */
function isOtherPage(href: string): boolean {
  const next = new URL(href, window.location.href);
  // mailto:, tel: and similar hand off to another app and leave the page alone.
  if (next.protocol !== "http:" && next.protocol !== "https:") return false;
  const here = window.location;
  return !(
    next.origin === here.origin &&
    next.pathname === here.pathname &&
    next.search === here.search
  );
}

/**
 * A plain left click on a link that moves this tab to a different page, on this
 * site or another. Same-page links (a hash on the current URL), downloads, new
 * tab targets and modified clicks stay in or beside the current page.
 */
function leavingLink(event: MouseEvent): boolean {
  // An earlier capture handler already owns this click, so asking again would
  // double-prompt.
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  return isOtherPage(anchor.href);
}

/**
 * Asks before the user leaves the page while `when` is true. Covers a reload or
 * closed tab (the browser's own prompt) and clicks on links to another page,
 * including other sites; the click is caught on the document in the capture
 * phase, before a router link sees it, and stays put on "Cancel".
 *
 * The returned function asks the same question for navigation done in code:
 * `if (confirmLeave()) router.push(...)`. It is always true while `when` is
 * false. The browser's Back button is not covered; the App Router has no way
 * to hold it.
 */
export function useLeaveGuard(
  when: boolean,
  message: string = DEFAULT_MESSAGE,
): () => boolean {
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (!leavingLink(event)) return;
      if (window.confirm(message)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [when, message]);

  return useCallback(() => !when || window.confirm(message), [when, message]);
}

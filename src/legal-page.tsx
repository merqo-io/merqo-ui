import * as React from "react";
import { DefaultAppLink, type AppLinkComponent } from "./app-link";
import type { LegalDocType } from "./legal";
import { LegalDocument } from "./legal-document";

export const LEGAL_PAGE_TITLES: Record<LegalDocType, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  pilot: "Pilot Agreement",
};

/** `metadata` for a kit's terms or privacy page. */
export function legalPageMetadata(doc: LegalDocType): { title: string } {
  return { title: LEGAL_PAGE_TITLES[doc] };
}

export interface LegalPageProps {
  doc: LegalDocType;
  /** The kit whose schedule the terms show. Omit on the hub. */
  kit?: string;
  /** Kit wordmark rendered above the document, linked home. */
  wordmark?: React.ReactNode;
  homeHref?: string;
  /** Pass `next/link`'s `Link` for client-side navigation. */
  LinkComponent?: AppLinkComponent;
  className?: string;
}

/** Page body for `app/legal/terms` and `app/legal/privacy`. */
export function LegalPage({
  doc,
  kit,
  wordmark,
  homeHref = "/",
  LinkComponent = DefaultAppLink,
  className,
}: LegalPageProps): React.ReactElement {
  return (
    <main className={className}>
      {wordmark ? (
        <header className="mx-auto max-w-3xl px-5 pt-8">
          <LinkComponent href={homeHref} className="inline-flex min-h-11 items-center">
            {wordmark}
          </LinkComponent>
        </header>
      ) : null}
      <LegalDocument doc={doc} kit={kit} />
    </main>
  );
}

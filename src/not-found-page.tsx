import * as React from "react";
import { DefaultAppLink, type AppLinkComponent } from "./app-link";
import { Button } from "./ui/button";
import { StatusCard } from "./status-card";

export interface NotFoundProps {
  wordmark?: React.ReactNode;
  /** Large status code above the title, e.g. "404". Omitted by default. */
  code?: string;
  /** Image or illustration shown above the title. */
  media?: React.ReactNode;
  /** The kit's identity mark in the card's top-end corner; see `StatusCard`. */
  signature?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  homeHref?: string;
  homeLabel?: string;
  /** Replaces the default link home. */
  action?: React.ReactNode;
  /** Pass `next/link`'s `Link` for client-side navigation. */
  LinkComponent?: AppLinkComponent;
}

/** Body for a kit's `app/not-found.tsx`. Server-renderable. */
export function NotFound({
  wordmark,
  code,
  media,
  signature,
  title = "Page not found",
  description = "This link may be out of date, or the page it pointed to no longer exists.",
  homeHref = "/",
  homeLabel = "Back to home",
  action,
  LinkComponent = DefaultAppLink,
}: NotFoundProps): React.ReactElement {
  return (
    <StatusCard
      wordmark={wordmark}
      code={code}
      media={media}
      signature={signature}
      title={title}
      description={description}
    >
      {action ?? (
        <Button asChild className="h-11 w-full">
          <LinkComponent href={homeHref}>{homeLabel}</LinkComponent>
        </Button>
      )}
    </StatusCard>
  );
}

"use client";

import * as React from "react";

import { ElevatedCard } from "./elevated-card";
import { InfoTooltip } from "./info-tooltip";
import { cn } from "./lib/utils";
import { EYEBROW, GROUP, SECTION_TITLE } from "./recipes";

export interface SectionProps {
  /** Optional; omit for a heading that needs no pictogram. */
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  tooltip?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  /**
   * Overrides the default `<section>` shell entirely — e.g. a kit's own
   * bordered/textured card component. Receives the section's rendered
   * header+children as `content`; owns its own outer element and classes.
   * When set, `className` and the default bg-card/border/shadow classes do
   * NOT apply — pass any classes the wrapper needs inside the wrapper
   * function itself.
   */
  wrapper?: (content: React.ReactNode) => React.ReactNode;
  /**
   * Card chrome of the default shell. "default" is a flat bordered
   * group, "elevated" the `ElevatedCard` look, "none" no chrome at all.
   * Ignored when `wrapper` is set.
   */
  surface?: "default" | "elevated" | "none";
}

export function Section({
  icon,
  eyebrow,
  title,
  description,
  tooltip,
  className,
  wrapper,
  surface = "default",
  children,
}: SectionProps) {
  const content = (
    // flex flex-col gap-4 lives here, not just on the default <section> shell
    // below, so a `wrapper` swap-out (which owns its own outer classes) can't
    // silently drop the gap between the header and children — it did exactly
    // that in qkit's Ticket-wrapped usage before this was moved down.
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
              {icon}
            </span>
          ) : null}
          <div className="flex flex-col">
            {eyebrow ? (
              <span className={EYEBROW}>
                {eyebrow}
              </span>
            ) : null}
            <div className="flex items-center gap-1.5">
              <h3 className={SECTION_TITLE}>{title}</h3>
              {tooltip ? (
                <InfoTooltip content={tooltip} ariaLabel={`More about ${title}`} />
              ) : null}
            </div>
          </div>
        </div>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );

  if (wrapper) {
    return <>{wrapper(content)}</>;
  }

  if (surface === "elevated") {
    return (
      <ElevatedCard
        as="section"
        className={cn("text-card-foreground flex flex-col gap-4 p-6", className)}
      >
        {content}
      </ElevatedCard>
    );
  }

  return (
    <section
      className={cn(
        surface === "default" && cn(GROUP, "flex flex-col gap-4 p-6"),
        surface === "none" && "flex flex-col gap-4",
        className,
      )}
    >
      {content}
    </section>
  );
}

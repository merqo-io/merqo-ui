"use client";

import * as React from "react";
import { ContextAppLink } from "./app-link-provider";
import { toast } from "sonner";

import { AccountMenu, type AccountMenuLinkProps } from "./account-menu";
import type { FeedbackData } from "./feedback-sheet";
import type { SupportRequest } from "./help-sheet";
import { getSwitchKits } from "./kit-family";
import type { NavUser } from "./nav-user";
import { Button } from "./ui/button";

const DEFAULT_ERROR_MESSAGE =
  "Could not complete that. Check your connection and try again.";

type ActionResult = { success: boolean; error?: string };

export interface LandingAccountNavProps<C extends string = string> {
  /** Kit slug; the Switch products menu lists every other kit. */
  kit: string;
  dashboardHref: string;
  user: NavUser;
  signOutAction: () => Promise<void>;
  actions: {
    submitSupport(input: { category: C; message: string }): Promise<ActionResult>;
    submitFeedback(input: {
      source: "vendor";
      nps: number;
      message?: string;
    }): Promise<ActionResult>;
  };
  /** Category value to label; also the set of values `submitSupport` can receive. */
  supportCategories: Record<C, string>;
  /** Defaults to a sonner error toast. */
  onError?: (error: unknown) => void;
  /** Used when a failure carries no message of its own. */
  errorMessage?: string;
  LinkComponent?: React.ComponentType<AccountMenuLinkProps>;
}

function assertOk(res: ActionResult, fallback: string) {
  if (!res.success) throw new Error(res.error ?? fallback);
}

/**
 * Dashboard link plus `AccountMenu`, wired the same way in every kit's
 * landing page. Meant for `LandingNav`'s `end` slot.
 */
export function LandingAccountNav<C extends string = string>({
  kit,
  dashboardHref,
  user,
  signOutAction,
  actions,
  supportCategories,
  onError,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  LinkComponent,
}: LandingAccountNavProps<C>) {
  const handleError = onError ?? ((error: unknown) => {
    toast.error(error instanceof Error && error.message ? error.message : errorMessage);
  });
  const Link = LinkComponent ?? ContextAppLink;
  const categories = React.useMemo(
    () =>
      Object.entries<string>(supportCategories).map(([value, label]) => ({
        value,
        label,
      })),
    [supportCategories],
  );

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="min-h-11 sm:min-h-0">
        <Link href={dashboardHref}>Dashboard</Link>
      </Button>
      <AccountMenu
        vendor={{ name: user.name, avatarUrl: user.avatarUrl, subtitle: user.name }}
        signOutAction={signOutAction}
        switchKits={getSwitchKits(kit)}
        feedbackSource="vendor"
        feedbackMetric="nps"
        showNps
        onError={handleError}
        LinkComponent={LinkComponent}
        getHelp={{
          type: "form",
          categories,
          onSubmit: async (data: SupportRequest) => {
            const category =
              data.category !== undefined &&
              Object.hasOwn(supportCategories, data.category)
                ? (data.category as C)
                : ("other" as C);
            assertOk(await actions.submitSupport({ category, message: data.message }), errorMessage);
          },
        }}
        onFeedbackSubmit={async (data: FeedbackData) => {
          const message = data.message.trim();
          assertOk(
            await actions.submitFeedback({
              source: "vendor",
              nps: data.nps ?? 0,
              message: message === "" ? undefined : message,
            }),
            errorMessage,
          );
        }}
      />
    </>
  );
}

import type { ComponentProps } from "react";

import { cn } from "./lib/utils";
import { PRESS } from "./recipes";

// One hover (darken), one pressed state that fires on touch (colour step plus
// a small scale that reduced motion drops), one focus ring. No lift or glow.
export function PressButton({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn(
        PRESS,
        "inline-flex min-h-11 w-full items-center justify-center rounded-lg border-[1.5px] border-foreground bg-foreground px-5 text-[0.9375rem] font-semibold text-background hover:bg-foreground/85 active:bg-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  );
}

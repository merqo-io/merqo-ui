"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import { Checkbox } from "./ui/checkbox";

export interface TermsAcceptanceCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  basePath?: string;
  className?: string;
}

const LINK_CLASS =
  "text-primary rounded-sm underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function TermsAcceptanceCheckbox({
  checked,
  onCheckedChange,
  basePath = "/legal",
  className,
}: TermsAcceptanceCheckboxProps) {
  const id = React.useId();
  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={id}
        className="flex items-start gap-2 text-sm pointer-coarse:min-h-11 pointer-coarse:items-center"
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(next) => onCheckedChange(next === true)}
          className="mt-0.5 pointer-coarse:mt-0"
        />
        <span>
          I have read and agree to the{" "}
          <a href={`${basePath}/terms`} target="_blank" rel="noreferrer" className={LINK_CLASS}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href={`${basePath}/privacy`} target="_blank" rel="noreferrer" className={LINK_CLASS}>
            Privacy Policy
          </a>
          .
        </span>
      </label>
    </div>
  );
}

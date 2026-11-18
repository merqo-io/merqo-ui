"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "./lib/utils";
import { Input, type InputProps } from "./ui/input";

type LabelProps =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-label"?: string; "aria-labelledby": string };

export type SearchFieldProps = Omit<
  InputProps,
  "type" | "value" | "defaultValue" | "aria-label" | "aria-labelledby"
> &
  LabelProps & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Classes for the wrapper; `className` goes to the input. */
    wrapperClassName?: string;
  };

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      value,
      defaultValue,
      onValueChange,
      onChange,
      onKeyDown,
      className,
      wrapperClassName,
      disabled,
      ...props
    },
    forwardedRef,
  ) {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState(defaultValue ?? "");
    const current = isControlled ? value : inner;

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const clear = () => {
      if (!isControlled) setInner("");
      onValueChange?.("");
      innerRef.current?.focus();
    };

    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          {...props}
          ref={setRefs}
          type="search"
          value={current}
          disabled={disabled}
          onChange={(e) => {
            if (!isControlled) setInner(e.target.value);
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.key === "Escape" && !e.defaultPrevented && current !== "") {
              e.preventDefault();
              clear();
            }
          }}
          className={cn(
            "pl-9 pr-11 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
            className,
          )}
        />
        {current !== "" && !disabled && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clear}
            className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    );
  },
);

export { SearchField };

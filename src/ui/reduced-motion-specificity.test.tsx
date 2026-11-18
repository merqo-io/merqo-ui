import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { compile } from "tailwindcss";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./dialog";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "./alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { Popover, PopoverContent } from "./popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

// animate-in and animate-out come from each kit's own CSS, so the test stubs
// them: only the selector shape matters for the cascade.
const STUB =
  "@tailwind utilities; @utility animate-in { animation-name: enter; } @utility animate-out { animation-name: exit; }";

type Rule = { specificity: number; important: boolean };

// build() accumulates candidates across calls, so each rule needs a fresh compile.
async function ruleFor(candidate: string): Promise<Rule> {
  const { build } = await compile(STUB);
  const css = build([candidate]);
  const selector = css
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith(".") && l.endsWith("{"));
  if (!selector) throw new Error(`no rule compiled for ${candidate}`);
  return {
    specificity:
      (selector.match(/(?<!\\)\./g) ?? []).length + (selector.match(/(?<!\\)\[/g) ?? []).length,
    important: css.includes("!important"),
  };
}

function Surfaces() {
  return (
    <>
      <Sheet open>
        <SheetContent>
          <SheetTitle>S</SheetTitle>
          <SheetDescription>D</SheetDescription>
        </SheetContent>
      </Sheet>
      <Dialog open>
        <DialogContent>
          <DialogTitle>D</DialogTitle>
          <DialogDescription>D</DialogDescription>
        </DialogContent>
      </Dialog>
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>A</AlertDialogTitle>
          <AlertDialogDescription>D</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu open>
        <DropdownMenuTrigger>m</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>i</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open>
        <PopoverContent>pop</PopoverContent>
      </Popover>
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>t</TooltipTrigger>
          <TooltipContent>tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Select open value="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

const SLOTS = [
  "sheet-content",
  "sheet-overlay",
  "dialog-content",
  "dialog-overlay",
  "alert-dialog-content",
  "alert-dialog-overlay",
  "dropdown-menu-content",
  "popover-content",
  "tooltip-content",
  "select-content",
];

describe("reduced-motion guards win the cascade", () => {
  it("is not out-ranked by the data-state animation rules", async () => {
    render(<Surfaces />);
    for (const slot of SLOTS) {
      const el = document.querySelector(`[data-slot=${slot}]`);
      expect(el, slot).not.toBeNull();
      const tokens = (el!.getAttribute("class") ?? "").split(/\s+/);
      const guards = tokens.filter((t) => t.startsWith("motion-reduce:") && t.includes("animate-none"));
      const animations = tokens.filter((t) => /animate-(in|out)$/.test(t));
      expect(guards.length, `${slot} has a guard`).toBeGreaterThan(0);
      for (const animation of animations) {
        const anim = await ruleFor(animation);
        for (const guard of guards) {
          const rule = await ruleFor(guard);
          expect(
            rule.important || rule.specificity >= anim.specificity,
            `${slot}: ${guard} loses to ${animation}`,
          ).toBe(true);
        }
      }
    }
  });
});

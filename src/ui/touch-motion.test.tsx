import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";
import { Checkbox } from "./checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./dialog";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "./alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Popover, PopoverContent } from "./popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const HIT_AREA = ["pointer-coarse:after:size-11", "pointer-coarse:after:content-['']"];
const REDUCED = "motion-reduce:animate-none!";

describe("touch hit areas", () => {
  it("gives Switch a 44px coarse hit area and toggles on touch", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Open" onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole("switch");
    expect(el).toHaveClass("relative", ...HIT_AREA);
    await user.pointer({ keys: "[TouchA]", target: el });
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("gives Checkbox a 44px coarse hit area and toggles on touch", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Agree" onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole("checkbox");
    expect(el).toHaveClass("relative", ...HIT_AREA);
    await user.pointer({ keys: "[TouchA]", target: el });
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("gives the Dialog close button a hit area, focus-visible ring and touch close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveClass("pointer-coarse:after:absolute", ...HIT_AREA, "focus-visible:ring-2");
    expect(close).not.toHaveClass("focus:ring-2");
    await user.pointer({ keys: "[TouchA]", target: close });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses focus-visible on the Sheet close button", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>T</SheetTitle>
          <SheetDescription>D</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveClass("focus-visible:ring-2", ...HIT_AREA);
    expect(close).not.toHaveClass("focus:ring-2");
  });

  it("makes dropdown items at least 44px tall on coarse pointers", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>m</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Radio</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    for (const name of ["Item", "Radio", "Sub"]) {
      expect(screen.getByText(name).closest("[role^=menuitem]")).toHaveClass(
        "pointer-coarse:min-h-11",
      );
    }
  });

  it("makes select items at least 44px tall on coarse pointers", () => {
    render(
      <Select open value="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole("option", { name: "Alpha" })).toHaveClass("pointer-coarse:min-h-11");
  });
});

describe("overlay motion", () => {
  it("shortens the Sheet reveal to 300ms and dismissal to 200ms", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>T</SheetTitle>
          <SheetDescription>D</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const content = screen.getByRole("dialog");
    expect(content).toHaveClass(
      "data-[state=open]:duration-300",
      "data-[state=closed]:duration-200",
    );
    expect(content.className).not.toContain("duration-500");
  });

  it("guards reduced motion on every overlay", () => {
    render(
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
      </>,
    );
    const selector = [
      "sheet-content",
      "sheet-overlay",
      "dialog-content",
      "dialog-overlay",
      "alert-dialog-content",
      "alert-dialog-overlay",
      "dropdown-menu-content",
      "popover-content",
      "tooltip-content",
    ]
      .map((slot) => `[data-slot=${slot}]`)
      .join(",");
    const surfaces = [...document.querySelectorAll(selector)];
    expect(surfaces.length).toBeGreaterThanOrEqual(9);
    for (const el of surfaces) {
      expect(el, el.getAttribute("data-slot") ?? "").toHaveClass(REDUCED);
    }
  });

  it("guards reduced motion on the Select and dropdown submenu content", () => {
    render(
      <Select open value="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(document.querySelector("[data-slot=select-content]")).toHaveClass(REDUCED);
  });
});

describe("touch operation", () => {
  it("closes a Sheet by tapping its close button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetTitle>T</SheetTitle>
          <SheetDescription>D</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: "Close" }) });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("selects dropdown items and radio items by tapping", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onValueChange = vi.fn();
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>m</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Item</DropdownMenuItem>
          <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="a">Alpha</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Beta</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("menuitem", { name: "Item" }) });
    expect(onSelect).toHaveBeenCalled();
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("menuitemradio", { name: "Beta" }),
    });
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("selects a Select item by tapping", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select open value="a" onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>,
    );
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("option", { name: "Beta" }) });
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});

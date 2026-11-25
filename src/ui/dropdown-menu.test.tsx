// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu rows", () => {
  it("gives every interactive row kind a 44px coarse-pointer height and wraps a group", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Plain</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Radio</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Nested</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.pointer({ keys: "[TouchA]", target: screen.getByText("Open") });
    for (const role of ["menuitem", "menuitemradio"]) {
      for (const row of screen.getAllByRole(role)) {
        expect(row).toHaveClass("pointer-coarse:min-h-11");
      }
    }
    expect(
      screen.getByText("Plain").closest("[data-slot=dropdown-menu-group]"),
    ).not.toBeNull();
  });
});

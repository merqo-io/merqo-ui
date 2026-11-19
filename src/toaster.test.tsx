import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toast } from "sonner";
import { Toaster } from "./providers";

describe("Toaster", () => {
  it("gives the action button a 44px hit area on coarse pointers", async () => {
    render(<Toaster />);
    act(() => {
      toast("Item removed", { action: { label: "Undo", onClick: () => {} } });
    });
    const button = await screen.findByRole("button", { name: "Undo" });
    expect(button.className).toContain("pointer-coarse:after:size-11");
    expect(button.className).toContain("relative");
  });
});

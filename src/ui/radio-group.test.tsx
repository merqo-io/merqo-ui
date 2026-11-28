// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RadioGroup, RadioGroupItem } from "./radio-group";

function Example({ onValueChange }: { onValueChange?: (v: string) => void }) {
  return (
    <RadioGroup defaultValue="card" onValueChange={onValueChange}>
      <label>
        <RadioGroupItem value="card" />
        Card
      </label>
      <label>
        <RadioGroupItem value="cash" />
        Cash
      </label>
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("renders the items with the default selected", () => {
    render(<Example />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Card" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Cash" })).not.toBeChecked();
  });

  it("moves the selection with the arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Cash" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenCalledWith("cash");
    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
  });

  it("selects by touch on the item and on its label row", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("radio", { name: "Cash" }),
    });
    expect(onValueChange).toHaveBeenLastCalledWith("cash");
    await user.pointer({ keys: "[TouchA]", target: screen.getByText("Card") });
    expect(onValueChange).toHaveBeenLastCalledWith("card");
  });

  it("keeps the item at size-4 with no coarse min-height", () => {
    render(<Example />);
    const item = screen.getByRole("radio", { name: "Card" });
    expect(item).toHaveClass("size-4");
    expect(item.className).not.toMatch(/pointer-coarse:min-h/);
  });
});

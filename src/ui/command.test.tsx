// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});

function Example({ onSelect }: { onSelect?: (v: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Search" />
      <CommandList>
        <CommandEmpty>No results</CommandEmpty>
        <CommandGroup heading="Fruit">
          <CommandItem onSelect={onSelect}>Apple</CommandItem>
          <CommandItem onSelect={onSelect}>Banana</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Veg">
          <CommandItem onSelect={onSelect}>Carrot</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

describe("Command", () => {
  it("renders groups and items", () => {
    render(<Example />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters by the typed query and shows the empty state", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.type(screen.getByPlaceholderText("Search"), "ban");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Banana")).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("Search"));
    await user.type(screen.getByPlaceholderText("Search"), "zzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("selects with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    await user.click(screen.getByPlaceholderText("Search"));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("Banana");
  });

  it("selects by touch", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByText("Carrot") });
    expect(onSelect).toHaveBeenCalledWith("Carrot");
  });

  it("gives items and the input row a 44px coarse target", () => {
    render(<Example />);
    expect(screen.getByText("Apple")).toHaveClass("pointer-coarse:min-h-11");
    const row = screen
      .getByPlaceholderText("Search")
      .closest("[data-slot=command-input-wrapper]");
    expect(row).toHaveClass("pointer-coarse:min-h-11");
  });
});

describe("CommandDialog", () => {
  it("renders the command inside a dialog when open", () => {
    render(
      <CommandDialog open onOpenChange={() => {}}>
        <CommandInput placeholder="Jump to" />
        <CommandList>
          <CommandItem>Home</CommandItem>
        </CommandList>
      </CommandDialog>,
    );
    expect(
      screen.getByRole("dialog", { name: "Command Palette" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jump to")).toBeInTheDocument();
  });

  it("names the dialog from a custom title", () => {
    render(
      <CommandDialog
        open
        onOpenChange={() => {}}
        title="Find a product"
        description="Search the catalogue"
      >
        <CommandInput placeholder="Jump to" />
      </CommandDialog>,
    );
    expect(
      screen.getByRole("dialog", { name: "Find a product" }),
    ).toBeInTheDocument();
  });
});

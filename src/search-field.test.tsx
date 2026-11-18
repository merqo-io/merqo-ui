import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchField } from "./search-field";

function Controlled({ onValueChange }: { onValueChange?: (v: string) => void }) {
  const [value, setValue] = React.useState("abc");
  return (
    <SearchField
      aria-label="Search things"
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange?.(v);
      }}
    />
  );
}

describe("SearchField", () => {
  it("renders a labelled search input with placeholder", () => {
    render(<SearchField aria-label="Search products" placeholder="Search products" />);
    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute("placeholder", "Search products");
  });

  it("hides the decorative icon from assistive tech", () => {
    const { container } = render(<SearchField aria-label="Search" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows no clear button until there is text, then reports typing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchField aria-label="Search" onValueChange={onValueChange} />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    await user.type(screen.getByRole("searchbox"), "hi");
    expect(onValueChange).toHaveBeenLastCalledWith("hi");
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  it("clears by touch, notifies and returns focus to the input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchField aria-label="Search" defaultValue="milk" onValueChange={onValueChange} />);
    const input = screen.getByRole("searchbox");
    const clear = screen.getByRole("button", { name: "Clear search" });
    await user.pointer({ keys: "[TouchA]", target: clear });
    expect(input).toHaveValue("");
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(input).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("gives the clear button a 44px hit area", () => {
    render(<SearchField aria-label="Search" defaultValue="x" />);
    expect(screen.getByRole("button", { name: "Clear search" })).toHaveClass("size-11");
  });

  it("clears on Escape only when there is text", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchField aria-label="Search" defaultValue="milk" onValueChange={onValueChange} />);
    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
    expect(onValueChange).toHaveBeenCalledWith("");
    onValueChange.mockClear();
    await user.keyboard("{Escape}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("works controlled: clear and Escape go through onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("abc");
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Clear search" }),
    });
    expect(input).toHaveValue("");
    expect(onValueChange).toHaveBeenLastCalledWith("");
    await user.type(input, "z");
    expect(input).toHaveValue("z");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
  });

  it("stays put when a controlled parent ignores the change", async () => {
    const user = userEvent.setup();
    render(<SearchField aria-label="Search" value="fixed" onValueChange={() => {}} />);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Clear search" }),
    });
    expect(screen.getByRole("searchbox")).toHaveValue("fixed");
  });

  it("forwards the ref and input props, and still calls onChange and onKeyDown", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <SearchField
        aria-label="Search"
        ref={ref}
        name="q"
        size="lg"
        onChange={onChange}
        onKeyDown={onKeyDown}
      />,
    );
    expect(ref.current).toBe(screen.getByRole("searchbox"));
    expect(ref.current).toHaveAttribute("name", "q");
    await user.type(ref.current!, "a");
    expect(onChange).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
    expect(ref.current).toHaveClass("h-11");
  });

  it("supports a callback ref", () => {
    const refFn = vi.fn();
    render(<SearchField aria-label="Search" ref={refFn} />);
    expect(refFn).toHaveBeenCalledWith(screen.getByRole("searchbox"));
  });

  it("hides the native cancel button so only one clear control exists", () => {
    render(<SearchField aria-label="Search" />);
    expect(screen.getByRole("searchbox").className).toContain(
      "[&::-webkit-search-cancel-button]:appearance-none",
    );
  });

  it("supports aria-labelledby instead of aria-label", () => {
    render(
      <>
        <span id="lbl">Find a customer</span>
        <SearchField aria-labelledby="lbl" />
      </>,
    );
    expect(screen.getByRole("searchbox", { name: "Find a customer" })).toBeInTheDocument();
  });

  it("hides the clear button when disabled", () => {
    render(<SearchField aria-label="Search" defaultValue="x" disabled />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });
});

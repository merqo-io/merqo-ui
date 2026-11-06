import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

describe("SegmentedControl", () => {
  it("renders a radiogroup with one radio per option", () => {
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value={null}
        onChange={() => {}}
        className="grid-cols-3 gap-1"
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Pick one" });
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(group).toBeInTheDocument();
  });

  it("marks the option matching `value` as checked, others not", () => {
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value="b"
        onChange={() => {}}
        className="grid-cols-3 gap-1"
      />,
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Gamma" })).toHaveAttribute("aria-checked", "false");
  });

  it("clicking an option calls onChange with its value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value={null}
        onChange={onChange}
        className="grid-cols-3 gap-1"
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("roving tabindex: only the checked option (or the first, if none checked) is a Tab stop", () => {
    const { rerender } = render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value={null}
        onChange={() => {}}
        className="grid-cols-3 gap-1"
      />,
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("radio", { name: "Gamma" })).toHaveAttribute("tabindex", "-1");

    rerender(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value="c"
        onChange={() => {}}
        className="grid-cols-3 gap-1"
      />,
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("radio", { name: "Gamma" })).toHaveAttribute("tabindex", "0");
  });

  it("ArrowRight moves focus and selection to the next option, wrapping past the last", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value="c"
        onChange={onChange}
        className="grid-cols-3 gap-1"
      />,
    );
    screen.getByRole("radio", { name: "Gamma" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("ArrowLeft moves focus and selection to the previous option, wrapping before the first", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value="a"
        onChange={onChange}
        className="grid-cols-3 gap-1"
      />,
    );
    screen.getByRole("radio", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("Home/End jump to the first/last option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value="b"
        onChange={onChange}
        className="grid-cols-3 gap-1"
      />,
    );
    screen.getByRole("radio", { name: "Beta" }).focus();
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith("c");

    onChange.mockClear();
    screen.getByRole("radio", { name: "Beta" }).focus();
    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith("a");
  });

  it("applies optionClassName to every option button", () => {
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value={null}
        onChange={() => {}}
        className="grid-cols-3 gap-1"
        optionClassName="tabular-nums"
      />,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveClass("tabular-nums");
    }
  });

  it("arrow keys skip disabled options and disabled options cannot be clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const withDisabled = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta", disabled: true },
      { value: "c", label: "Gamma" },
    ];
    render(
      <SegmentedControl ariaLabel="Pick one" options={withDisabled} value="a" onChange={onChange} />,
    );
    screen.getByRole("radio", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("c");
    await user.click(screen.getByRole("radio", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio", { name: "Beta" })).toBeDisabled();
  });

  it("starts the Tab stop on the first enabled option", () => {
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={[
          { value: "a", label: "Alpha", disabled: true },
          { value: "b", label: "Beta" },
        ]}
        value={null}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute("tabindex", "0");
  });

  it("renders the track look by default and the pill grid look on request", () => {
    const { rerender } = render(
      <SegmentedControl ariaLabel="g" options={options} value="a" onChange={() => {}} size="sm" className="grid grid-cols-3" />,
    );
    expect(screen.getByRole("radiogroup")).toHaveClass("rounded-lg", "text-xs", "grid");
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveClass("bg-primary/10");
    rerender(
      <SegmentedControl ariaLabel="g" options={options} value="a" onChange={() => {}} variant="pill" />,
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("does nothing on arrows when every option is disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="g"
        options={[{ value: "a", label: "Alpha", disabled: true }]}
        value={null}
        onChange={onChange}
      />,
    );
    const group = screen.getByRole("radiogroup");
    group.tabIndex = 0;
    group.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

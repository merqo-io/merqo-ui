import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

  it("never reports a disabled option as checked; the Tab stop falls to the first enabled one", () => {
    render(
      <SegmentedControl
        ariaLabel="Pick one"
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta", disabled: true },
        ]}
        value="b"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute("tabindex", "0");
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
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveClass("text-primary");
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

describe("SegmentedControl coarse pointer height", () => {
  it.each(["track", "pill"] as const)("%s options reach 44px on touch", (variant) => {
    render(
      <SegmentedControl
        ariaLabel="x"
        size="sm"
        variant={variant}
        value="a"
        onChange={() => {}}
        options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
      />,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveClass("pointer-coarse:min-h-11");
    }
  });
});

describe("SegmentedControl pressed feedback", () => {
  it.each(["track", "pill"] as const)("%s options show a pressed state on touch, guarded for reduced motion", async (variant) => {
    const user = userEvent.setup();
    render(
      <SegmentedControl
        ariaLabel="x"
        variant={variant}
        value="a"
        onChange={() => {}}
        options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
      />,
    );
    const [selected, other] = screen.getAllByRole("radio");
    for (const radio of [selected, other]) {
      expect(radio.className).toMatch(/(^|\s)active:bg-/);
      expect(radio).toHaveClass("motion-reduce:transition-none");
      expect(radio.className).not.toMatch(/scale|translate/);
    }
    await user.pointer({ keys: "[TouchA]", target: other });
    expect(other).toHaveClass("active:bg-primary/10");
  });
});

describe("SegmentedControl focus", () => {
  it("shows a focus ring on every option in both variants", () => {
    for (const variant of ["track", "pill"] as const) {
      const { unmount } = render(
        <SegmentedControl ariaLabel="x" options={options} value="a" onChange={() => {}} variant={variant} />,
      );
      for (const radio of screen.getAllByRole("radio")) {
        const tokens = radio.className.split(" ");
        expect(tokens).toContain("focus-visible:ring-[3px]");
        expect(tokens).toContain("pointer-coarse:min-h-11");
      }
      unmount();
    }
  });
});

describe("SegmentedControl sliding pill", () => {
  function track(value: string | null) {
    return (
      <SegmentedControl
        ariaLabel="Pick one"
        options={options}
        value={value}
        onChange={() => {}}
      />
    );
  }

  it("renders one decorative indicator that eases between options", () => {
    const { container } = render(track("a"));
    const pill = container.querySelector("[data-slot='segmented-indicator']");
    expect(pill).not.toBeNull();
    expect(pill).toHaveAttribute("aria-hidden", "true");
    expect(pill).toHaveClass("pointer-events-none", "duration-200", "ease-out", "motion-reduce:duration-1!");
  });

  it("keeps the tint on the checked button while the indicator has no size", () => {
    render(track("b"));
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveClass("bg-primary/10");
  });

  describe("with layout", () => {
    const widths: Record<string, number> = { Alpha: 40, Beta: 50, Gamma: 60 };
    const lefts: Record<string, number> = { Alpha: 0, Beta: 40, Gamma: 90 };
    let resize: (() => void) | null = null;

    beforeEach(() => {
      for (const [prop, source] of [
        ["offsetLeft", lefts],
        ["offsetWidth", widths],
      ] as const) {
        Object.defineProperty(HTMLElement.prototype, prop, {
          configurable: true,
          get(this: HTMLElement) {
            return source[this.textContent ?? ""] ?? 0;
          },
        });
      }
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        configurable: true,
        get(this: HTMLElement) {
          return this.textContent ? 30 : 0;
        },
      });
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(cb: () => void) {
            resize = cb;
          }
          observe() {}
          disconnect() {}
        },
      );
    });

    afterEach(() => {
      for (const prop of ["offsetLeft", "offsetWidth", "offsetHeight"]) {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
      }
      vi.unstubAllGlobals();
      resize = null;
    });

    const pillOf = (container: HTMLElement) =>
      container.querySelector<HTMLElement>("[data-slot='segmented-indicator']")!;

    it("snaps on mount, drops the button tint and sizes the pill", () => {
      const { container } = render(track("a"));
      const pill = pillOf(container);
      expect(pill).toHaveClass("transition-none");
      expect(pill.style.width).toBe("40px");
      expect(screen.getByRole("radio", { name: "Alpha" })).not.toHaveClass("bg-primary/10");
    });

    it("slides when the checked option changes", () => {
      const { container, rerender } = render(track("a"));
      rerender(track("c"));
      const pill = pillOf(container);
      expect(pill.style.transform).toBe("translate(90px, 0px)");
      expect(pill.style.width).toBe("60px");
      expect(pill).not.toHaveClass("transition-none");
    });

    it("snaps on a resize-only re-measure", () => {
      const { container, rerender } = render(track("a"));
      rerender(track("b"));
      expect(pillOf(container)).not.toHaveClass("transition-none");
      widths.Beta = 70;
      act(() => resize?.());
      expect(pillOf(container).style.width).toBe("70px");
      expect(pillOf(container)).toHaveClass("transition-none");
      widths.Beta = 50;
    });
  });

  it("renders no indicator when nothing is checked or in the pill variant", () => {
    const { container, rerender } = render(track(null));
    expect(container.querySelector("[data-slot='segmented-indicator']")).toBeNull();
    rerender(
      <SegmentedControl ariaLabel="Pick" options={options} value="a" onChange={() => {}} variant="pill" />,
    );
    expect(container.querySelector("[data-slot='segmented-indicator']")).toBeNull();
  });

  it("selects by touch", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SegmentedControl ariaLabel="Pick" options={options} value="a" onChange={onChange} />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("radio", { name: "Gamma" }) });
    expect(onChange).toHaveBeenCalledWith("c");
  });
});

describe("SegmentedControl link mode", () => {
  const links = [
    { label: "Today", href: "/today", selected: true },
    { label: "Week", href: "/week" },
  ];

  it("renders a labelled nav of links with aria-current on the selected one", () => {
    render(<SegmentedControl ariaLabel="Range" options={links} />);
    expect(screen.getByRole("navigation", { name: "Range" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/today");
    expect(screen.getByRole("link", { name: "Week" })).not.toHaveAttribute("aria-current");
  });

  it("uses finger-sized links and a custom LinkComponent", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    const Custom = ({ href, children, ...rest }: React.ComponentProps<"a">) => (
      <a href={href} data-custom="1" onClick={onClick} {...rest}>
        {children}
      </a>
    );
    render(<SegmentedControl ariaLabel="Range" options={links} LinkComponent={Custom} variant="pill" />);
    const week = screen.getByRole("link", { name: "Week" });
    expect(week).toHaveAttribute("data-custom", "1");
    expect(week.className).toContain("pointer-coarse:min-h-11");
    await user.pointer({ keys: "[TouchA]", target: week });
    expect(onClick).toHaveBeenCalled();
  });

  it("track variant also keeps the coarse tap target", () => {
    render(<SegmentedControl ariaLabel="Range" options={links} size="sm" />);
    expect(screen.getByRole("link", { name: "Week" }).className).toContain("pointer-coarse:min-h-11");
  });
});

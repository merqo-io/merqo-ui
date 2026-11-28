// @vitest-environment jsdom
import { createRef, useReducer } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceStory, type DeviceStoryHandle } from "./device-story";

function mockMedia({ wide, reduced }: { wide: boolean; reduced: boolean }) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("min-width") ? wide : reduced,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const STEPS = [
  { n: 1, tab: "Order", who: "Customer", heading: "Place", body: "b1", try: "t1" },
  { n: 2, tab: "Serve", who: "Vendor", heading: "Serve", body: "b2" },
];

function baseProps() {
  return {
    eyebrow: "eyebrow",
    heading: "heading",
    intro: "intro",
    steps: STEPS,
    step: 1,
    devices: [
      {
        id: "d-phone",
        label: "Phone",
        lit: true,
        tabSubtitle: "sub",
        node: <p>phone screen</p>,
      },
      {
        id: "d-board",
        label: "Board",
        lit: false,
        cued: true,
        tabFlash: true,
        node: <p>board screen</p>,
      },
    ],
    focus: "d-phone",
    announcement: "Order placed",
    onStepSelect: vi.fn(),
    onScrollStep: vi.fn(),
    onFocusChange: vi.fn(),
  };
}

function Harness() {
  const [focus, setFocus] = useReducer(
    (_: string, next: string) => next,
    "d-phone",
  );
  return (
    <DeviceStory
      {...baseProps()}
      focus={focus}
      onFocusChange={setFocus}
    />
  );
}

beforeEach(() => mockMedia({ wide: false, reduced: false }));
afterEach(() => vi.restoreAllMocks());

describe("DeviceStory narrow", () => {
  it("switches the device on touch and keeps tab semantics", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const phone = screen.getByRole("tab", { name: /Phone/ });
    const board = screen.getByRole("tab", { name: /Board/ });
    expect(phone).toHaveAttribute("aria-selected", "true");
    expect(phone).toHaveAttribute("aria-controls", "d-phone");
    expect(board).toHaveAttribute("aria-selected", "false");
    expect(board).toHaveAttribute("aria-controls", "d-board");
    expect(document.getElementById("d-board")).toHaveAttribute("data-off");

    await user.pointer({ keys: "[TouchA]", target: board });
    expect(board).toHaveAttribute("aria-selected", "true");
    expect(phone).toHaveAttribute("aria-selected", "false");
    expect(document.getElementById("d-board")).not.toHaveAttribute("data-off");
    expect(document.getElementById("d-phone")).toHaveAttribute("data-off");
  });

  it("marks only a hidden cued tab and flashes its subtitle", () => {
    const props = baseProps();
    props.devices[1].tabSubtitle = "new";
    const { rerender } = render(<DeviceStory {...props} />);
    const board = screen.getByRole("tab", { name: /Board/ });
    expect(board).toHaveAttribute("data-cue");
    expect(screen.getByText("new")).toHaveClass("text-primary");
    expect(screen.getByRole("tab", { name: /Phone/ })).not.toHaveAttribute(
      "data-cue",
    );
    rerender(<DeviceStory {...props} focus="d-board" />);
    expect(screen.getByRole("tab", { name: /Board/ })).not.toHaveAttribute(
      "data-cue",
    );
  });

  it("reports stepper taps with the step number and marks the active one", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DeviceStory {...props} />);
    const group = screen.getByRole("group", { name: "Steps" });
    const second = group.querySelectorAll("button")[1];
    expect(group.querySelectorAll("button")[0]).toHaveAttribute(
      "aria-current",
      "true",
    );
    await user.pointer({ keys: "[TouchA]", target: second });
    expect(props.onStepSelect).toHaveBeenCalledWith(2);
  });

  it("renders no tab list for one device", () => {
    const props = baseProps();
    render(<DeviceStory {...props} devices={[props.devices[0]]} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByText("phone screen")).toBeInTheDocument();
    expect(document.getElementById("d-phone")).not.toHaveAttribute("data-off");
  });

  it("carries the announcement in one polite live region", () => {
    const { container } = render(<DeviceStory {...baseProps()} />);
    const live = container.querySelectorAll("[aria-live]");
    expect(live).toHaveLength(1);
    expect(live[0]).toHaveTextContent("Order placed");
  });

  it("shows the try-it line only for steps that have one", () => {
    render(<DeviceStory {...baseProps()} />);
    expect(screen.getAllByText("Try it")).toHaveLength(1);
  });

  it("omits the intro when none is given", () => {
    const props = baseProps();
    render(<DeviceStory {...props} intro={undefined} />);
    expect(screen.queryByText("intro")).toBeNull();
  });
});

describe("DeviceStory replay", () => {
  it("renders nothing without a replay prop", () => {
    render(<DeviceStory {...baseProps()} />);
    expect(screen.queryByRole("button", { name: "Again" })).toBeNull();
  });

  it("hides the button but keeps its space until visible", () => {
    const props = baseProps();
    const { rerender } = render(
      <DeviceStory {...props} replay={{ label: "Again", visible: false }} />,
    );
    expect(screen.getByText("Again")).toHaveClass("invisible");
    rerender(
      <DeviceStory {...props} replay={{ label: "Again", visible: true }} />,
    );
    expect(screen.getByText("Again")).not.toHaveClass("invisible");
  });

  it("cues the button and calls onReplay on touch", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    const { container } = render(
      <DeviceStory
        {...baseProps()}
        onReplay={onReplay}
        replay={{ label: "Again", visible: true, cued: true }}
      />,
    );
    expect(container.querySelectorAll("section > div [data-cue]")).not.toHaveLength(0);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Again" }),
    });
    expect(onReplay).toHaveBeenCalledOnce();
  });
});

describe("DeviceStory wide", () => {
  function setup(reduced: boolean) {
    mockMedia({ wide: true, reduced });
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });
    const props = baseProps();
    const ref = createRef<DeviceStoryHandle>();
    const view = render(<DeviceStory {...props} ref={ref} />);
    const items = view.container.querySelectorAll("li");
    return { props, ref, items };
  }

  it("reports the step whose top passed the viewport middle", () => {
    const { props, items } = setup(false);
    const tops = [-300, 200];
    items.forEach((el, i) => {
      el.getBoundingClientRect = () => ({ top: tops[i] }) as DOMRect;
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(props.onScrollStep).toHaveBeenLastCalledWith(2);
  });

  it("follows a step with smooth scroll, then ignores picks while locked", () => {
    const { props, ref, items } = setup(false);
    items[1].getBoundingClientRect = () =>
      ({ top: 900, bottom: 1100, height: 200 }) as DOMRect;
    items[0].getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    props.onScrollStep.mockClear();
    act(() => ref.current?.followStep(2));
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(props.onScrollStep).not.toHaveBeenCalled();
  });

  it("scrolls without animation under reduced motion", () => {
    const { ref, items } = setup(true);
    items[1].getBoundingClientRect = () =>
      ({ top: 900, bottom: 1100, height: 200 }) as DOMRect;
    act(() => ref.current?.followStep(2));
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "auto" }),
    );
  });

  it("does not scroll when the step already spans the middle", () => {
    const { ref, items } = setup(false);
    items[0].getBoundingClientRect = () =>
      ({ top: 100, bottom: 700, height: 600 }) as DOMRect;
    act(() => ref.current?.followStep(1));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("ignores unknown steps", () => {
    const { ref } = setup(false);
    act(() => ref.current?.followStep(9));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

describe("DeviceStory narrow follow", () => {
  it("never scrolls below 960px", () => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const ref = createRef<DeviceStoryHandle>();
    render(<DeviceStory {...baseProps()} ref={ref} />);
    act(() => ref.current?.followStep(2));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

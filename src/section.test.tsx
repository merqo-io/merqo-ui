import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Info } from "lucide-react";
import { Section } from "./section";
import { EYEBROW, GROUP, SECTION_TITLE } from "./recipes";

describe("Section", () => {
  it("renders eyebrow, title, and children", () => {
    render(
      <Section icon={<Info />} eyebrow="Just for you" title="Display name">
        <div>field content</div>
      </Section>,
    );
    expect(screen.getByText("Just for you")).toBeInTheDocument();
    expect(screen.getByText("Display name")).toBeInTheDocument();
    expect(screen.getByText("field content")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = render(
      <Section icon={<Info />} eyebrow="e" title="t">
        <div />
      </Section>,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders icon as a passed-in element, not a component reference", () => {
    render(
      <Section icon={<span data-testid="my-icon" />} title="Stall name">
        <p>content</p>
      </Section>,
    );
    expect(screen.getByTestId("my-icon")).toBeInTheDocument();
  });

  it("renders without an eyebrow when none is given", () => {
    render(
      <Section icon={<span />} title="Stall name">
        <p>content</p>
      </Section>,
    );
    expect(screen.queryByText(/eyebrow/i)).not.toBeInTheDocument();
    // No eyebrow-styled element rendered at all - the header still shows only the title.
    expect(screen.getByText("Stall name")).toBeInTheDocument();
  });

  it("renders a description when provided, omits it when not", () => {
    const { rerender } = render(
      <Section icon={<Info />} eyebrow="e" title="t" description="extra info">
        <div />
      </Section>,
    );
    expect(screen.getByText("extra info")).toBeInTheDocument();

    rerender(
      <Section icon={<Info />} eyebrow="e" title="t">
        <div />
      </Section>,
    );
    expect(screen.queryByText("extra info")).not.toBeInTheDocument();
  });

  it("renders an InfoTooltip trigger when a tooltip is provided, omits it when not", () => {
    const { rerender } = render(
      <Section icon={<Info />} eyebrow="e" title="Display name" tooltip="more detail">
        <div />
      </Section>,
    );
    expect(
      screen.getByRole("button", { name: "More about Display name" }),
    ).toBeInTheDocument();

    rerender(
      <Section icon={<Info />} eyebrow="e" title="Display name">
        <div />
      </Section>,
    );
    expect(
      screen.queryByRole("button", { name: "More about Display name" }),
    ).not.toBeInTheDocument();
  });

  it("renders a ReactNode tooltip's content when the tooltip is opened", async () => {
    const user = userEvent.setup();
    render(
      <Section
        icon={<span />}
        title="Stall name"
        tooltip={
          <span>
            Rich <strong data-testid="tooltip-rich-content">content</strong>
          </span>
        }
      >
        <p>content</p>
      </Section>,
    );
    await user.hover(screen.getByRole("button", { name: /more about stall name/i }));
    expect(await screen.findByTestId("tooltip-rich-content")).toBeInTheDocument();
  });

  it("opens the tooltip on a touch tap, where hover never fires", async () => {
    const user = userEvent.setup();
    render(
      <Section icon={<span />} title="Stall name" tooltip="extra detail">
        <p>content</p>
      </Section>,
    );
    const trigger = screen.getByRole("button", { name: "More about Stall name" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.pointer({ keys: "[TouchA]", target: trigger });

    expect(await screen.findByRole("tooltip")).toHaveTextContent("extra detail");
  });

  it("closes the tooltip when the trigger is tapped again", async () => {
    const user = userEvent.setup();
    render(
      <Section icon={<span />} title="Stall name" tooltip="extra detail">
        <p>content</p>
      </Section>,
    );
    const trigger = screen.getByRole("button", { name: "More about Stall name" });
    await user.pointer({ keys: "[TouchA]", target: trigger });
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.pointer({ keys: "[TouchA]", target: trigger });

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("gives the tooltip icon a 44px touch area on touch devices", () => {
    render(
      <Section icon={<span />} title="Stall name" tooltip="extra detail">
        <p>content</p>
      </Section>,
    );
    expect(
      screen.getByRole("button", { name: "More about Stall name" }),
    ).toHaveClass("relative", "pointer-coarse:after:size-11");
  });

  it("opens the tooltip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <Section icon={<span />} title="Stall name" tooltip="extra detail">
        <p>content</p>
      </Section>,
    );

    await user.tab();

    expect(
      screen.getByRole("button", { name: "More about Stall name" }),
    ).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("extra detail");
  });

  it("merges a custom className onto the root element", () => {
    const { container } = render(
      <Section icon={<Info />} eyebrow="e" title="t" className="custom-class">
        <div />
      </Section>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
    // still carries the base neutral card classes
    expect(container.firstChild).toHaveClass("rounded-xl", "border", "bg-card");
  });

  it("is a flat in-page group by default; only surface=elevated lifts", () => {
    const { container, rerender } = render(
      <Section icon={<Info />} eyebrow="e" title="t">
        <div />
      </Section>,
    );
    expect((container.firstChild as HTMLElement).className).not.toMatch(/shadow/);
    rerender(
      <Section icon={<Info />} eyebrow="e" title="t" surface="elevated">
        <div />
      </Section>,
    );
    expect(container.firstChild).toHaveClass("shadow-sm");
  });

  it("never uses a literal color, font, or radius value", () => {
    const { container } = render(
      <Section icon={<Info />} eyebrow="e" title="t">
        <div />
      </Section>,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/rounded-\[/);
  });

  it("wrapper: renders the wrapper's own output instead of the default <section> shell", () => {
    render(
      <Section
        icon={<span />}
        title="Stall name"
        wrapper={(content) => <article data-testid="custom-shell">{content}</article>}
      >
        <p>content</p>
      </Section>,
    );
    expect(screen.getByTestId("custom-shell")).toBeInTheDocument();
    expect(screen.getByText("Stall name")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("wrapper: the default section shell's classes are not applied when wrapper is set", () => {
    const { container } = render(
      <Section
        icon={<span />}
        title="Stall name"
        wrapper={(content) => <article>{content}</article>}
      >
        <p>content</p>
      </Section>,
    );
    expect(container.querySelector("section")).not.toBeInTheDocument();
    expect(container.querySelector("article")).toBeInTheDocument();
  });

  it("no wrapper: still renders the default <section> shell (regression guard)", () => {
    const { container } = render(
      <Section icon={<span />} title="Stall name">
        <p>content</p>
      </Section>,
    );
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("wrapper: still keeps a gap between header and children even though the default section shell (and its own gap-4) is bypassed", () => {
    const { container } = render(
      <Section
        icon={<span />}
        title="Stall name"
        wrapper={(content) => <article data-testid="custom-shell">{content}</article>}
      >
        <p>content</p>
      </Section>,
    );
    const shell = screen.getByTestId("custom-shell");
    expect(shell.firstElementChild).toHaveClass("flex", "flex-col", "gap-4");
    expect(container.querySelector("header")?.parentElement).toBe(
      shell.firstElementChild,
    );
  });
});

describe("Section surface", () => {
  it("keeps a flat group shell without a surface prop", () => {
    const { container } = render(
      <Section icon={<Info />} title="t">
        <div />
      </Section>,
    );
    expect(container.querySelector("section")).toHaveClass("bg-card", "rounded-xl");
  });

  it('surface="elevated" applies the ElevatedCard chrome', () => {
    const { container } = render(
      <Section icon={<Info />} title="t" surface="elevated" className="mine">
        <div />
      </Section>,
    );
    const shell = container.querySelector("section");
    expect(shell).toHaveClass("bg-card", "border", "p-6", "mine");
    expect(shell).toHaveClass("rounded-2xl");
    expect(shell).not.toHaveClass("rounded-lg");
  });

  it('surface="none" drops the card chrome', () => {
    const { container } = render(
      <Section icon={<Info />} title="t" surface="none" className="mine">
        <div />
      </Section>,
    );
    const shell = container.querySelector("section");
    expect(shell).not.toHaveClass("bg-card");
    expect(shell).toHaveClass("mine");
  });
});

describe("Section surface none", () => {
  it("carries no padding or default-surface classes", () => {
    const { container } = render(
      <Section icon={<Info />} title="t" surface="none">
        <div />
      </Section>,
    );
    const shell = container.querySelector("section") as HTMLElement;
    expect(shell.className).toBe("flex flex-col gap-4");
  });
});

describe("Section type", () => {
  it("uses the eyebrow and section title recipes", () => {
    render(
      <Section icon={<Info />} eyebrow="Eyebrow" title="Title">
        <div />
      </Section>,
    );
    expect(screen.getByText("Eyebrow")).toHaveClass(...EYEBROW.split(" "));
    expect(screen.getByText("Title")).toHaveClass(...SECTION_TITLE.split(" "));
  });
});

describe("Section shape", () => {
  it("takes its corners from the kit radius token", () => {
    const { container } = render(
      <Section icon={<Info />} title="t">
        <div />
      </Section>,
    );
    const shell = container.querySelector("section") as HTMLElement;
    expect(shell).toHaveClass(...GROUP.split(" "));
    expect(shell.className).not.toMatch(/rounded-(\[|lg|2xl)|shadow/);
  });
});

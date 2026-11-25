import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";
import { Spinner } from "./spinner";
import * as primitives from "../primitives";

describe("Empty", () => {
  it("renders every part with its slot", () => {
    const { container } = render(
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg />
          </EmptyMedia>
          <EmptyTitle>No orders</EmptyTitle>
          <EmptyDescription>Share your link.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button>Share</button>
        </EmptyContent>
      </Empty>,
    );
    for (const slot of [
      "empty",
      "empty-header",
      "empty-icon",
      "empty-title",
      "empty-description",
      "empty-content",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(screen.getByText("No orders")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("EmptyMedia defaults to the bare variant", () => {
    const { container } = render(<EmptyMedia />);
    expect(container.firstElementChild).toHaveAttribute("data-variant", "default");
    expect(container.firstElementChild).not.toHaveClass("bg-muted");
  });
});

describe("Spinner", () => {
  it("is a labelled status that stops under reduced motion", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toHaveClass("motion-safe:animate-spin");
    expect(spinner.getAttribute("class")).not.toMatch(/(^|\s)animate-spin/);
  });

  it("takes a size override", () => {
    render(<Spinner className="size-6" />);
    expect(screen.getByRole("status")).toHaveClass("size-6");
    expect(screen.getByRole("status")).not.toHaveClass("size-4");
  });
});

describe("Item", () => {
  it("renders a row with media, content and actions", () => {
    render(
      <ItemGroup>
        <Item variant="outline">
          <ItemHeader>Head</ItemHeader>
          <ItemMedia variant="icon">
            <svg />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Nasi lemak</ItemTitle>
            <ItemDescription>Fried chicken</ItemDescription>
          </ItemContent>
          <ItemActions>
            <button>Edit</button>
          </ItemActions>
          <ItemFooter>Foot</ItemFooter>
        </Item>
        <ItemSeparator />
        <Item asChild>
          <a href="/x">Link row</a>
        </Item>
      </ItemGroup>,
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Nasi lemak")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Link row" });
    expect(link).toHaveAttribute("data-slot", "item");
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});

describe("primitives entry", () => {
  it("exports the new parts", () => {
    for (const name of [
      "Empty",
      "EmptyHeader",
      "EmptyMedia",
      "EmptyTitle",
      "EmptyDescription",
      "EmptyContent",
      "Spinner",
      "Item",
      "ItemGroup",
      "ItemSeparator",
      "ItemMedia",
      "ItemContent",
      "ItemTitle",
      "ItemDescription",
      "ItemActions",
      "ItemHeader",
      "ItemFooter",
    ]) {
      expect(primitives).toHaveProperty(name);
    }
  });
});

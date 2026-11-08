import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as primitives from "./primitives";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  badgeVariants,
  buttonVariants,
  cn,
} from "./primitives";

describe("@merqo/ui/primitives", () => {
  it("exports every shared primitive and cn", () => {
    for (const name of [
      "cn",
      "Badge",
      "badgeVariants",
      "Button",
      "buttonVariants",
      "Card",
      "Checkbox",
      "Dialog",
      "Input",
      "Label",
      "Select",
      "Switch",
      "Tabs",
      "Textarea",
      "Tooltip",
      "TooltipProvider",
    ]) {
      expect(primitives).toHaveProperty(name);
    }
  });

  it("keeps the other private ui modules out of the public surface", () => {
    expect(primitives).not.toHaveProperty("Sheet");
    expect(primitives).not.toHaveProperty("AlertDialog");
    expect(primitives).not.toHaveProperty("Popover");
  });

  it("cn merges conflicting Tailwind classes", () => {
    expect(cn("px-2", false, "px-4")).toBe("px-4");
  });
});

describe("Button", () => {
  it("gives every size a 44px or taller target on coarse pointers", () => {
    const sizes = [
      "default",
      "xs",
      "sm",
      "lg",
      "icon",
      "icon-xs",
      "icon-sm",
      "icon-lg",
    ] as const;
    for (const size of sizes) {
      expect(buttonVariants({ size })).toMatch(/pointer-coarse:(h|size)-1[12]/);
    }
    expect(buttonVariants({ size: "lg" })).toContain("pointer-coarse:h-12");
  });

  it("fires onClick on a touch tap and renders asChild as the child element", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Save</Button>
        <Button asChild variant="link" size="sm">
          <a href="/next">Next</a>
        </Button>
      </>,
    );
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Save" }),
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    const link = screen.getByRole("link", { name: "Next" });
    expect(link).toHaveAttribute("data-variant", "link");
    expect(link).toHaveAttribute("data-size", "sm");
  });
});

describe("Badge", () => {
  it("covers the shadcn variants plus muted and success", () => {
    for (const variant of [
      "default",
      "secondary",
      "destructive",
      "outline",
      "ghost",
      "link",
      "muted",
      "success",
    ] as const) {
      render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toHaveAttribute("data-variant", variant);
    }
    expect(badgeVariants({ variant: "muted" })).toContain("bg-muted");
    expect(badgeVariants()).toContain("bg-primary");
  });

  it("renders asChild as the child element", () => {
    render(
      <Badge asChild>
        <a href="/x">Linked</a>
      </Badge>,
    );
    expect(screen.getByRole("link", { name: "Linked" })).toHaveAttribute(
      "data-slot",
      "badge",
    );
  });
});

describe("Input, Textarea and Label", () => {
  it("grows the input on coarse pointers and wires the label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
        <Textarea aria-label="Notes" />
      </>,
    );
    const input = screen.getByLabelText("Name");
    expect(input).toHaveClass("pointer-coarse:h-11");
    await user.pointer({ keys: "[TouchA]", target: input });
    await user.keyboard("hello");
    expect(input).toHaveValue("hello");
    await user.type(screen.getByLabelText("Notes"), "note");
    expect(screen.getByLabelText("Notes")).toHaveValue("note");
  });
});

describe("Switch", () => {
  it("toggles on a touch tap in both sizes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <>
        <Switch aria-label="Alerts" onCheckedChange={onCheckedChange} />
        <Switch aria-label="Small" size="sm" />
      </>,
    );
    const toggle = screen.getByRole("switch", { name: "Alerts" });
    await user.pointer({ keys: "[TouchA]", target: toggle });
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: "Small" })).toHaveAttribute(
      "data-size",
      "sm",
    );
  });
});

describe("Checkbox", () => {
  it("checks on a touch tap and through its label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox aria-label="Agree" />
        <Checkbox id="b" />
        <Label htmlFor="b">Remember me</Label>
      </>,
    );
    const agree = screen.getByRole("checkbox", { name: "Agree" });
    await user.pointer({ keys: "[TouchA]", target: agree });
    expect(agree).toBeChecked();
    await user.pointer({ keys: "[TouchA]", target: screen.getByText("Remember me") });
    expect(screen.getByRole("checkbox", { name: "Remember me" })).toBeChecked();
  });
});

describe("Tabs", () => {
  it("switches panel on a touch tap", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">One</TabsTrigger>
          <TabsTrigger value="b">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel one</TabsContent>
        <TabsContent value="b">Panel two</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Panel one")).toBeVisible();
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("tab", { name: "Two" }),
    });
    expect(screen.getByText("Panel two")).toBeVisible();
    expect(screen.queryByText("Panel one")).not.toBeInTheDocument();
  });
});

describe("Select", () => {
  it("opens and picks an option by touch", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="Plan" size="default">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Plans</SelectLabel>
            <SelectItem value="free">Free</SelectItem>
            <SelectSeparator />
            <SelectItem value="pro">Pro</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole("combobox", { name: "Plan" });
    expect(trigger).toHaveClass("pointer-coarse:data-[size=default]:h-11");
    await user.pointer({ keys: "[TouchA]", target: trigger });
    const option = await screen.findByRole("option", { name: "Pro" });
    await user.pointer({ keys: "[TouchA]", target: option });
    expect(onValueChange).toHaveBeenCalledWith("pro");
  });
});

describe("Dialog", () => {
  it("opens from a touch tap on the trigger and closes with its close button", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Body copy</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <span>footer</span>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Open" }),
    });
    expect(await screen.findByRole("dialog", { name: "Title" })).toBeInTheDocument();
    const close = screen.getAllByRole("button", { name: /close/i })[0];
    await user.pointer({ keys: "[TouchA]", target: close });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Card", () => {
  it("renders every slot", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Heading</CardTitle>
          <CardDescription>Sub</CardDescription>
          <CardAction>Act</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Foot</CardFooter>
      </Card>,
    );
    for (const slot of ["card", "card-header", "card-title", "card-description", "card-action", "card-content", "card-footer"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });
});

describe("Tooltip", () => {
  it("reveals on keyboard focus and a touch tap never hides the trigger's own name", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="Help">?</button>
        </TooltipTrigger>
        <TooltipContent>Helpful words</TooltipContent>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Help" });
    await user.pointer({ keys: "[TouchA]", target: trigger });
    expect(trigger).toBeInTheDocument();
    fireEvent.focus(trigger);
    const shown = await screen.findAllByText("Helpful words");
    expect(shown.length).toBeGreaterThan(0);
  });
});

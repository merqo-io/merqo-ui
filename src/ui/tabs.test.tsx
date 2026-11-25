// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function Example() {
  return (
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b">Beta</TabsTrigger>
      </TabsList>
      <TabsContent value="a">One</TabsContent>
      <TabsContent value="b">Two</TabsContent>
    </Tabs>
  );
}

describe("Tabs motion", () => {
  it("eases the active colour and tint over the state duration, near-zero under reduced motion", () => {
    render(<Example />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
      "transition-[color,background-color]",
      "duration-200",
      "ease-out",
      "motion-reduce:duration-1",
      "data-[state=inactive]:active:text-foreground",
    );
  });

  it("still switches by touch", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("tab", { name: "Beta" }) });
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("data-state", "active");
  });
});

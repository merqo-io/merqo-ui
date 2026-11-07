import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, AvatarIdentity, initials } from "./avatar";

describe("initials", () => {
  it("takes the first two letters of a single word", () => {
    expect(initials("manfred")).toBe("MA");
  });
  it("takes first and last initial of several words", () => {
    expect(initials("Ada Byron Lovelace")).toBe("AL");
  });
  it("splits on dots, dashes and underscores", () => {
    expect(initials("ada.lovelace")).toBe("AL");
  });
  it("falls back to a bullet for an empty name", () => {
    expect(initials("   ")).toBe("•");
  });
});

describe("Avatar", () => {
  it("shows initials when there is no photo", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });
  it("shows the photo when avatarUrl is set", () => {
    const { container } = render(<Avatar name="Ada" avatarUrl="/a.png" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/a.png");
    expect(screen.queryByText("AD")).not.toBeInTheDocument();
  });
});

describe("AvatarIdentity", () => {
  it("renders the avatar before the name, with the name hidden below sm and truncated", () => {
    const { container } = render(<AvatarIdentity name="Ada Lovelace" />);
    const root = container.firstElementChild as HTMLElement;
    const [avatar, label] = Array.from(root.children);
    expect(avatar).toHaveTextContent("AL");
    expect(label).toHaveTextContent("Ada Lovelace");
    expect(label).toHaveClass("hidden", "sm:inline", "truncate");
  });
  it("renders a different label than the initials source", () => {
    render(<AvatarIdentity name="Ada" label="Ada's Stall" />);
    expect(screen.getByText("Ada's Stall")).toBeInTheDocument();
  });
  it("renders the avatar alone when label is null", () => {
    const { container } = render(<AvatarIdentity name="Ada" label={null} />);
    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});

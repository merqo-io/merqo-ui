import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomerTelegramConnect } from "./customer-telegram-connect";

describe("CustomerTelegramConnect", () => {
  it("renders nothing without a deep link", () => {
    const { container } = render(<CustomerTelegramConnect deepLink={null} linkLabel="Get notified" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the link and disclosure from props", () => {
    render(
      <CustomerTelegramConnect
        deepLink="https://t.me/bot?start=abc"
        linkLabel="Get notified on Telegram"
        disclosure="We message you about your order."
      />,
    );
    const link = screen.getByRole("link", { name: "Get notified on Telegram" });
    expect(link).toHaveAttribute("href", "https://t.me/bot?start=abc");
    expect(link).toHaveClass("min-h-11");
    expect(screen.getByText("We message you about your order.")).toBeInTheDocument();
  });

  it.each(["javascript:alert(1)", "http://t.me/x", "not a url", "//t.me/x"])(
    "renders nothing for %s",
    (deepLink) => {
      const { container } = render(<CustomerTelegramConnect deepLink={deepLink} linkLabel="Go" />);
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("accepts a tg: link", () => {
    render(<CustomerTelegramConnect deepLink="tg://resolve?domain=bot" linkLabel="Go" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "tg://resolve?domain=bot");
  });

  it("omits the disclosure when none is given", () => {
    render(<CustomerTelegramConnect deepLink="https://t.me/x" linkLabel="Go" />);
    expect(document.querySelector("p")).toBeNull();
  });
});

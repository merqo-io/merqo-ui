import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("renders role alert with title and description", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Failed</AlertTitle>
        <AlertDescription>Try again</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("text-destructive");
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
  });

  it("defaults to the card look and lets a caller override the role", () => {
    render(<Alert role="status">Saved</Alert>);
    const el = screen.getByRole("status");
    expect(el.className).toContain("bg-card");
    expect(el.className).not.toContain("text-destructive");
  });
});

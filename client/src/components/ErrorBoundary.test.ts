import { describe, expect, it } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("converts an unexpected render failure into the safe 500 recovery state", () => {
    const error = new Error("simulated render failure");
    expect(ErrorBoundary.getDerivedStateFromError(error)).toEqual({ hasError: true, error });
  });
});

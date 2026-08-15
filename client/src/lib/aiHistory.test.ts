import { describe, expect, it } from "vitest";
import { restoreAiMessages, toStoredAiMessages } from "./aiHistory";

describe("AI history transcript safeguards", () => {
  it("does not persist system messages alongside a user conversation", () => {
    expect(toStoredAiMessages([{ role: "system", content: "private instruction" }, { role: "user", content: "hello" }, { role: "assistant", content: "hi" }])).toEqual([{ role: "user", content: "hello" }, { role: "assistant", content: "hi" }]);
  });

  it("restores only valid user and assistant transcript entries", () => {
    expect(restoreAiMessages([{ role: "assistant", content: "okay" }, { role: "system", content: "no" }, { role: "user", content: 5 }, null])).toEqual([{ role: "assistant", content: "okay" }]);
  });
});

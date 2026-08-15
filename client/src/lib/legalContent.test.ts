import { describe, expect, it } from "vitest";
import { legalPolicies, legalPolicyBySlug } from "./legalContent";

describe("legal policy content", () => {
  it("provides the complete public policy set", () => {
    expect(legalPolicies.map((policy) => policy.slug)).toEqual(["privacy-policy", "terms", "acceptable-use", "cookies"]);
    expect(legalPolicyBySlug("privacy-policy")?.sections.length).toBeGreaterThan(2);
  });
});

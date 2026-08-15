import { describe, expect, it } from "vitest";
import { linkIconHostname, linkIconPath, linkMonogram } from "./linkIdentity";

describe("Useful Links identity helpers", () => {
  it("uses only public HTTP(S) hostnames for same-origin icon requests", () => {
    expect(linkIconHostname("https://www.nidw.gov.bd/verify?foo=bar")).toBe("www.nidw.gov.bd");
    expect(linkIconPath("https://github.com/atakanaltok/awesome-useful-websites")).toBe("/api/link-icon/github.com");
    expect(linkIconHostname("javascript:alert(1)")).toBeNull();
    expect(linkIconHostname("not a url")).toBeNull();
  });

  it("creates a readable fallback monogram for unavailable icons", () => {
    expect(linkMonogram("Bangladesh NID")).toBe("BN");
    expect(linkMonogram("  bKash ")).toBe("B");
  });
});

import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, isApiRateLimitExempt, securityHeaders } from "./httpSecurity";

describe("HTTP security policy", () => {
  it("blocks framing and plugins while allowing required application resources", () => {
    const policy = buildContentSecurityPolicy(false);
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(policy).toContain("connect-src 'self' https: wss:");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("permits Vite development tooling without weakening production policy", () => {
    const policy = buildContentSecurityPolicy(true);
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain(" ws:");
    expect(securityHeaders["X-Frame-Options"]).toBe("DENY");
    expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("reserves the exemption for the authenticated Heartbeat endpoint only", () => {
    expect(isApiRateLimitExempt("/scheduled/dailyChallenge")).toBe(true);
    expect(isApiRateLimitExempt("/trpc/auth.me")).toBe(false);
    expect(isApiRateLimitExempt("/ai/stream")).toBe(false);
    expect(isApiRateLimitExempt("/oauth/callback")).toBe(false);
  });

  it("keeps the browser policy compatible with storage and streaming resources", () => {
    const policy = buildContentSecurityPolicy(false);
    expect(policy).toContain("img-src 'self' data: blob: https:");
    expect(policy).toContain("connect-src 'self' https: wss:");
    expect(policy).toContain("worker-src 'self' blob:");
  });
});

import { describe, expect, it } from "vitest";
import { createCloudflareRelayCredentials, relayOnlyIceServers } from "./turnCredentials";

describe("Cloudflare TURN credentials", () => {
  it("can mint a short-lived ICE server response without exposing the permanent key", async () => {
    const iceServers = await createCloudflareRelayCredentials(600);
    expect(iceServers.length).toBeGreaterThan(0);
    expect(iceServers.every((server) => server.urls.every((url) => /^turns?:/i.test(url)))).toBe(true);
  }, 15_000);

  it("removes STUN, malformed, and credential-less entries from a provider response", () => {
    expect(relayOnlyIceServers({ iceServers: [{ urls: ["stun:stun.cloudflare.com:3478", "turns:turn.cloudflare.com:443?transport=tcp"], username: "ephemeral", credential: "secret" }, { urls: "turn:turn.cloudflare.com:3478", username: "", credential: "" }] })).toEqual([{ urls: ["turns:turn.cloudflare.com:443?transport=tcp"], username: "ephemeral", credential: "secret" }]);
  });
});

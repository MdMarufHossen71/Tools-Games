import { describe, expect, it } from "vitest";
import { isRelayCandidate, parseRelaySignals, relayOnlyConfiguration, serializeRelaySignal } from "./relayOnly";

describe("relay-only multiplayer safeguards", () => {
  it("filters all non-TURN servers and forces relay transport", () => {
    const configuration = relayOnlyConfiguration([{ urls: ["stun:example.org", "turn:relay.example.org:3478"], username: "short", credential: "lived" }]);
    expect(configuration.iceTransportPolicy).toBe("relay");
    expect(configuration.iceServers).toEqual([{ urls: ["turn:relay.example.org:3478"], username: "short", credential: "lived" }]);
  });

  it("accepts only relay candidates and never host or server-reflexive candidates", () => {
    expect(isRelayCandidate("candidate:1 1 udp 1 203.0.113.10 3478 typ relay")).toBe(true);
    expect(isRelayCandidate("candidate:2 1 udp 1 192.168.1.8 5000 typ host")).toBe(false);
    expect(isRelayCandidate("candidate:3 1 udp 1 198.51.100.1 5000 typ srflx")).toBe(false);
  });

  it("round-trips chunked signaling without accepting incomplete data", () => {
    const chunks = serializeRelaySignal({ type: "offer", sdp: { type: "offer", sdp: "v=0\r\n".repeat(400) } }, "2ee27f86-8ac4-4d9f-a2bd-7f9138b9cf09");
    expect(parseRelaySignals(chunks.slice(1))).toEqual([]);
    expect(parseRelaySignals(chunks)).toMatchObject([{ id: "2ee27f86-8ac4-4d9f-a2bd-7f9138b9cf09", signal: { type: "offer" } }]);
  });
});

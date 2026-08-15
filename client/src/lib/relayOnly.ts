export type RelayIceServer = { urls: string[]; username: string; credential: string };

export type RelaySignal =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "candidate"; candidate: RTCIceCandidateInit };

const SIGNAL_PREFIX = "__THSIG1:";

export function relayOnlyConfiguration(iceServers: RelayIceServer[]): RTCConfiguration {
  return {
    iceServers: iceServers
      .map((server) => ({ ...server, urls: server.urls.filter((url) => /^turns?:/i.test(url)) }))
      .filter((server) => server.urls.length > 0),
    iceTransportPolicy: "relay",
  };
}

export function isRelayCandidate(candidate: string | null | undefined) {
  return Boolean(candidate && /\btyp relay\b/i.test(candidate) && !/\btyp (host|srflx|prflx)\b/i.test(candidate));
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function serializeRelaySignal(signal: RelaySignal, id = crypto.randomUUID()) {
  const encoded = toBase64(JSON.stringify(signal));
  const maxChunkLength = 400;
  const total = Math.ceil(encoded.length / maxChunkLength);
  return Array.from({ length: total }, (_, index) => `${SIGNAL_PREFIX}${id}:${index + 1}/${total}:${encoded.slice(index * maxChunkLength, (index + 1) * maxChunkLength)}`);
}

export function parseRelaySignals(bodies: string[]) {
  const groups = new Map<string, { total: number; parts: Map<number, string> }>();
  for (const body of bodies) {
    const match = body.match(/^__THSIG1:([a-zA-Z0-9-]{8,80}):(\d+)\/(\d+):([A-Za-z0-9+/=]+)$/);
    if (!match) continue;
    const [, id, rawIndex, rawTotal, chunk] = match;
    const index = Number(rawIndex); const total = Number(rawTotal);
    if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1 || total > 24 || index < 1 || index > total) continue;
    const group = groups.get(id) ?? { total, parts: new Map<number, string>() };
    if (group.total !== total) continue;
    group.parts.set(index, chunk); groups.set(id, group);
  }
  const signals: Array<{ id: string; signal: RelaySignal }> = [];
  for (const [id, group] of Array.from(groups.entries())) {
    if (group.parts.size !== group.total) continue;
    try {
      const payload = fromBase64(Array.from({ length: group.total }, (_, index) => group.parts.get(index + 1) ?? "").join(""));
      const signal = JSON.parse(payload) as RelaySignal;
      if ((signal.type === "offer" || signal.type === "answer") && typeof signal.sdp?.sdp === "string") signals.push({ id, signal });
      if (signal.type === "candidate" && typeof signal.candidate?.candidate === "string" && isRelayCandidate(signal.candidate.candidate)) signals.push({ id, signal });
    } catch { /* malformed signaling payloads are intentionally ignored */ }
  }
  return signals;
}

export function isRelaySignalMessage(body: string) { return body.startsWith(SIGNAL_PREFIX); }

export type RelayIceServer = { urls: string[]; username: string; credential: string };

export function relayOnlyIceServers(value: unknown): RelayIceServer[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { iceServers?: unknown }).iceServers)) return [];
  return (value as { iceServers: unknown[] }).iceServers.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as { urls?: unknown; username?: unknown; credential?: unknown };
    const urls = (Array.isArray(candidate.urls) ? candidate.urls : [candidate.urls]).filter((url): url is string => typeof url === "string" && /^turns?:/i.test(url));
    if (!urls.length || typeof candidate.username !== "string" || !candidate.username.trim() || typeof candidate.credential !== "string" || !candidate.credential.trim()) return [];
    return [{ urls, username: candidate.username, credential: candidate.credential }];
  });
}

export async function createCloudflareRelayCredentials(ttl = 1800): Promise<RelayIceServer[]> {
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;
  if (!keyId || !apiToken) throw new Error("TURN relay credentials are not configured");
  const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ttl: Math.max(300, Math.min(ttl, 3600)) }),
  });
  if (!response.ok) throw new Error("TURN relay credential generation failed");
  const iceServers = relayOnlyIceServers(await response.json());
  if (!iceServers.length) throw new Error("TURN provider returned no relay servers");
  return iceServers;
}

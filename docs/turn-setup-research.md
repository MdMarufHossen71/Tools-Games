# Cloudflare TURN research

Research captured 15 August 2026 from Cloudflare’s official Realtime documentation.

Cloudflare Realtime TURN can be used with a Cloudflare account. The service is listed as free when paired with Cloudflare Realtime SFU; when used alone, Cloudflare documents a rate of **US$0.05 per GB of egress**, with the first **1,000 GB per month free**. This is therefore suitable for a small relay-only browser-game launch without a paid plan, subject to Cloudflare’s current account and usage terms.

Create a TURN key in the Cloudflare Dashboard or via Cloudflare’s API, then generate short-lived TURN credentials from that key. The permanent TURN key must stay server-side and must not be shipped to the browser. The application should use the generated URL, username, and credential in a relay-only `RTCPeerConnection` configuration.

## Official sources

- https://developers.cloudflare.com/realtime/turn/
- https://developers.cloudflare.com/realtime/turn/generate-credentials/
- https://developers.cloudflare.com/realtime/sfu/pricing/
- https://developers.cloudflare.com/realtime/turn/faq/

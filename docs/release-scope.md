# ToolsHUB Release Scope

**Release baseline: 15 August 2026.** This document distinguishes the production-ready launch scope from deliberate follow-up enhancements. It is intended to keep the public product description, administrator expectations, and future development work accurate.

## Delivered Platform Scope

ToolsHUB launches as a multilingual, responsive platform with **244 tool catalogue entries**, **45 game catalogue entries** (including eight playable browser games), an AI conversation workspace, a blog, a 2,173-record Useful Links Library, and authenticated secure-data utilities. The platform UI is available in English, বাংলা, Hindi, Urdu, Arabic, Spanish, French, and German, with explicit RTL handling for Urdu and Arabic.

The encrypted vault now includes an in-browser **Generate** action. It obtains the generated value from the Web Crypto random-number API, enforces a 12-character minimum, never sends the plaintext value to the server for generation, and encrypts the saved vault record client-side.

| Area | Released capability | Explicit follow-up boundary |
|---|---|---|
| Tool catalogue | 244 discoverable catalogue records, private browser-local workspaces, and 62 dedicated local operations across text, encoding, data, color, file, and creative utilities. | Catalogue records without a dedicated operation retain the common workspace fallback; additional tool-specific processors are a future catalogue expansion. |
| Cloud Clipboard | Authenticated cross-device clipboard CRUD with protected persistence. | One-time burn-link delivery is not included in this release. |
| Cloud Notes | Authenticated note creation, editing, deletion, and owner-scoped revision history. | Full-text search, sharing, export formats, folders/tags/colors, and storage-backed attachments are follow-up features. |
| AI Suite | Streaming chat, transparent guest/member request limits, safety messaging, and authenticated conversation history. | Standalone text, code, and image helper screens are follow-up interfaces; they are not represented as separately implemented tools. |
| Tests | `pnpm check` and `pnpm test` passed: **61 assertions in 29 test files**. Coverage includes daily-challenge handling, relay-only WebRTC rules, security headers, privacy helpers, multilingual integrity, catalogue integrity, explicit local-operation execution, game persistence, links and filtered states, short links, password generation, and error recovery. | Additional end-to-end and expanded helper-path coverage can be added as the platform evolves. |

## Social Authentication Limitation

ToolsHUB retains the built-in Manus OAuth flow. Google, GitHub, Facebook, identity linking, and social sign-in buttons are **not shipped** because the available free template authentication provider does not expose a compatible Google or GitHub provider flow. No paid service, external client secret, or substitute identity system was added merely to claim the feature. Existing authenticated cloud features work through Manus OAuth.

> This is a documented platform limitation rather than a partially enabled or misleading sign-in control. If compatible free built-in providers become available, social identity linking should be designed as a separate security-reviewed change.

## Branding and Responsive Audit

The release review confirmed the ToolsHUB wordmark, requested tagline, guest upgrade prompt, hero identity, blog identity, footer treatment, and administrator label across the shared shell and representative public routes. Mobile screenshots at 375px verified the collapsed navigation and usable visual hierarchy for Home, Blog, Useful Links, Privacy, and My Data. The shared shell also retains its `/` global-search shortcut and Escape-to-close behavior for its two transient menus. Feedback uses the site’s accessible live-announcement toast component, while controls retain accessible labels for icon-only actions.

The final development-service restart completed normally with **zero TypeScript errors**, which also cleared the previously stale short-link module diagnostic; the current server export graph loaded successfully.

## Publication Requirements

The project must be published from the project interface after the release checkpoint has been created. After publication, create the daily challenge task against the live deployment and bind the returned task UID exactly as described in [`daily-challenge-deployment.md`](./daily-challenge-deployment.md):

```bash
manus-heartbeat create --name daily-challenge --cron "0 0 0 * * *" --path /api/scheduled/dailyChallenge
```

The code intentionally does not use `setInterval` or `node-cron`; daily challenge rotation only becomes active when this deployed Heartbeat task is configured.

## Administrator Access

Administrator access is role-gated. To designate the site owner or another trusted account, update the relevant authenticated user record's `role` to `admin` through the database management interface or an approved SQL operation. No static administrator password or seeded credential exists.

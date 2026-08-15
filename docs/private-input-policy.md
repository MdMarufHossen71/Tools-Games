# ToolsHUB private-input persistence policy

## Default browser-tool policy

Browser-tool input and output are **memory-only**. `toolInputPrivacyPolicy` explicitly returns `false` for persistence and marks state for clearing on a tool-route transition. Tool content must not be written to browser storage, URLs, analytics payloads, or ordinary application APIs.

This applies to the reusable browser ToolPage workspace, including pasted text, generated values, and local calculations. Copy and download operations are delegated to the visitor's browser and do not create ToolsHUB cloud records.

## Declared exceptions

The following routes are separate, authenticated cloud features rather than ordinary browser tools. They persist only the specific data needed for their stated purpose and show their own security context in the interface.

| Feature | Persistence behaviour | Protection |
|---|---|---|
| Secure File Share | Stores encrypted metadata and an S3 object until expiry or removal. | Access token, optional bcrypt password, expiry, download limit, and encrypted metadata. |
| URL Shortener | Stores the encrypted destination and link analytics. | AES-GCM encrypted destination with owner-scoped administration. |
| Cloud Clipboard | Stores an explicitly created clipboard record. | Server-side encryption and owner-scoped access. |
| Notes | Stores a user-created note and version history. | Authenticated owner scope and application controls. |
| Password Vault | Stores an explicitly saved encrypted vault record. | Client-side AES-GCM encryption with a PBKDF2-derived key before upload. |
| AI conversations | Stores a signed-in visitor's selected conversation history. | Owner-scoped records; system messages are excluded from storage. |
| Game progress | Stores authenticated score and session metadata when a visitor saves progress. | Server-side validation and account scoping. |

> The policy does not claim that an internet browser can prevent a visitor from manually copying, downloading, or sharing their own content. It limits what ToolsHUB itself persists by default.

## Review checklist

When adding a new browser tool, keep its working state in React memory and reuse `toolInputPrivacyPolicy`. A new server request, browser-storage write, or persistent URL parameter for tool content requires a documented exception, a clear user-facing notice, and relevant test coverage.

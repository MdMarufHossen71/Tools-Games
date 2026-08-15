# Useful Links Library seed audit

The supplied `links_structured.json` was parsed without modifying its URLs. It contains **2,108 unique URLs** organised under 62 source-category groups: 30 `awesome` categories and 32 `osint` categories. The companion CSV is retained as an equivalent source for later administrative imports.

| Library section | Source identifier | Categories | Records | Description handling |
|---|---:|---:|---:|---|
| Everyday Useful Websites | `awesome` | 30 | 1,409 | Retain supplied description when present. |
| OSINT & Research Tools | `osint` | 32 | 699 | Generate an English one-line description of no more than 12 words when blank. |

All records are initially marked `verified = false`. This avoids representing a source URL as live without an individual availability check. The public interface does not display a verification badge for those records. The supplied URL string is stored exactly as received; a SHA-256 digest is used solely to enforce URL uniqueness.

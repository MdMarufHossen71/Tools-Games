# Mailmeteor Public Tool Catalogue — Compatibility Map

**Review date:** 15 August 2026. This is a feature-level compatibility assessment of the publicly listed tool names and descriptions on Mailmeteor's tool pages. It is **not** a request or plan to copy Mailmeteor branding, design, wording, backend services, data sources, or paid product behavior. ToolsHUB will use its own catalogue records, interface, validation rules, and original descriptions.

## Important Email-Alias Limitation

Gmail dot and plus addressing can create alternate delivery addresses for a qualifying existing Gmail mailbox. It does **not** create new Gmail accounts, credentials, inboxes, or permission to bypass another service's identity, promotion, or account-creation rules. The ToolsHUB implementation will state this directly and will produce aliases in the browser only.

## Public Catalogue Assessment

| Publicly listed capability | ToolsHUB approach | Release suitability |
|---|---|---|
| Gmail Generator / Gmail Alias Checker | Local Gmail dot and plus alias variation generator plus format guidance. | Add as a browser-local tool with an anti-evasion disclosure. |
| Email Checker | Syntax, domain-shape, disposable-pattern, and typo heuristics only. No claim that a mailbox exists. | Add as a browser-local validator. |
| Email Extractor | Extract email-shaped text from user-supplied content locally. | Add as a browser-local utility. |
| Email Permutator | Generate conventional name-based address candidates from user-provided names and domains. | Add as a browser-local drafting helper; no lookup claim. |
| Remove Duplicates | Local list deduplication. | Already represented; audit and retain. |
| Mailto Link Generator | Create a `mailto:` URL from user-provided fields locally. | Add as a browser-local utility. |
| Email Size Calculator | Estimate UTF-8 text size and basic attachment overhead locally. | Add as a browser-local estimator. |
| HTML to Text Converter | Strip markup and decode entities locally. | Add as a browser-local converter. |
| Email Signature Generator | Compose a plain-text or HTML signature from user-provided details locally. | Add as a browser-local generator. |
| Spam Checker / Subject Line Tester | Heuristic wording and length guidance only; no deliverability guarantee. | Add as a browser-local advisory tool. |
| AI Email Writer / Response / Letter / Grammar / Summarizers / Subject Line Generator / Cold Email AI | Use the existing ToolsHUB AI Suite for opt-in drafting and transformation, clearly disclosing model limitations and request limits. | Map as AI-assisted tools, not copied workflows. |
| Email Finder / Reverse Lookup / LinkedIn Email Finder | Would imply finding personal contact data or external data brokerage. | Do not add as a finder/lookup service. A user-provided-text extractor is sufficient. |
| Blacklist Checker / Email Reputation / Best Time to Send / SMTP Tester / SPF Record Checker | Require external network data or authentication and cannot be truthfully reproduced with browser-local checks. | Defer pending a vetted data provider and explicit privacy/security design. |
| Gmail/Outlook status, export, mail merge, no-code editor, EmbedLite, templates gallery | These are product or integration workflows rather than discrete browser-local utilities. | Do not represent as equivalent tools in this release; evaluate separately if the user requests a connected mail platform. |

## Original ToolsHUB Additions in This Expansion

ToolsHUB now ships the practical, browser-local subset: **Gmail Alias Variations, Email Syntax Advisor, Email Extractor, Email Pattern Builder, Mailto Link Builder, Email Size Estimator, HTML to Text, Email Signature Builder, Spam Wording Advisor, and Subject Line Advisor**. Each uses original labels and descriptions, preserves the platform's memory-only tool-input policy, works without login, and exposes clear limits rather than external-data claims.

The Gmail utility produces no more than seven same-inbox Gmail-style variations per request and labels them as aliases—not new accounts. The pattern builder produces only unverified conventions from values supplied by the visitor; it neither locates people nor verifies that an address exists. The wording and subject helpers offer limited local heuristics, not spam, blacklist, inbox-placement, reputation, delivery, or open-rate predictions.

## Public Sources Reviewed

The public catalogue lists email, drafting, AI, deliverability, validation, integration, and status utilities. [Mailmeteor’s tool catalogue](https://mailmeteor.com/tools/) was used solely to identify the publicly labelled capability areas. Its [Gmail Generator](https://mailmeteor.com/tools/gmail-generator) demonstrates dot-address variation for an existing mailbox. Its [Email Permutator](https://mailmeteor.com/email-permutator) takes a supplied first name, last name, and domain and emits conventional address patterns; ToolsHUB will label its original equivalent as a **pattern generator**, not a verified-address finder. Its [Spam Checker](https://mailmeteor.com/spam-checker) uses pasted email text; ToolsHUB will provide only local wording flags and explicitly state that it cannot predict inbox placement, blacklist status, or deliverability.

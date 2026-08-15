export type LegalPolicy = {
  slug: "privacy-policy" | "terms" | "acceptable-use" | "cookies";
  title: string;
  summary: string;
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
};

export const legalPolicies: LegalPolicy[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: "How ToolsHUB handles browser-local work, account information, optional cloud features, and safety reports.",
    sections: [
      { heading: "Plain-language summary", paragraphs: ["Most free tools process your input in your browser. We do not sell personal information or use browser-tool input for advertising profiles."] },
      { heading: "Information we process", paragraphs: ["When you sign in, ToolsHUB receives the account information provided through Manus OAuth, such as your account identifier and profile details. Server-backed features process only the information needed to provide that feature."], bullets: ["Tool input normally remains in the current tab until you clear it, change tools, or close the tab.", "Notes, shares, clipboard items, short links, and support reports that are stored server-side are protected using encryption at rest where the feature supports stored content.", "Basic security and rate-limit logs may be processed to protect the service from abuse."] },
      { heading: "Multiplayer and AI", paragraphs: ["Multiplayer uses relay-only WebRTC configuration: direct host and server-reflexive connections are disabled so other players do not receive your local or public IP address. AI requests are sent to the configured AI service only when you choose to submit a prompt. AI responses may be inaccurate and should not be treated as professional advice."] },
      { heading: "Your choices", paragraphs: ["You can use public tools without signing in, avoid server-backed features, remove saved content where a delete control is provided, and contact us about a privacy request through the reporting page. No security measure is absolute; keep your device and browser up to date."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Use",
    summary: "The rules for using ToolsHUB’s free tools, games, AI features, and optional account services.",
    sections: [
      { heading: "Acceptance and eligibility", paragraphs: ["By accessing ToolsHUB, you agree to these Terms and the Privacy Policy. If you do not agree, do not use the service. You are responsible for ensuring that use of the service is permitted where you live." ] },
      { heading: "Service availability", paragraphs: ["ToolsHUB is provided on an as-available basis. Features may change, be limited, or be removed for security, maintenance, legal, or product reasons. We do not promise uninterrupted operation, data permanence, or error-free output." ] },
      { heading: "Your responsibility", paragraphs: ["You are responsible for your uploads, text, game names, messages, and use of generated output. Verify important calculations, conversions, AI answers, and external links before relying on them." ], bullets: ["Do not upload or share material you do not have permission to use.", "Do not rely on ToolsHUB as medical, legal, financial, emergency, or safety-critical advice.", "Keep download links, room codes, and account access confidential."] },
      { heading: "Accounts and enforcement", paragraphs: ["Do not bypass security controls, rate limits, or access restrictions. We may suspend or restrict accounts or access that appears abusive, unlawful, unsafe, or harmful to other users or the service." ] },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use",
    summary: "Activities that are not allowed when using ToolsHUB tools, games, AI, multiplayer, file sharing, or links.",
    sections: [
      { heading: "Do not misuse the platform", paragraphs: ["You must not use ToolsHUB to harm people, systems, or services; infringe rights; or evade applicable law."], bullets: ["No malware, credential theft, phishing, spam, harassment, doxxing, or deception.", "No unauthorised access, scanning, exploitation, or collection of personal data.", "No illegal content, sexual exploitation, child-safety violations, or content that promotes violence or terrorism.", "No attempt to overload, reverse engineer, bypass limits, scrape at scale, or interfere with the platform or other users."] },
      { heading: "AI, files, and external links", paragraphs: ["Do not use AI tools or file sharing to create, distribute, or automate prohibited activity. External links are provided by third parties; review their terms and privacy practices before using them." ] },
      { heading: "Reporting", paragraphs: ["Use the report page to flag suspected abuse, a privacy issue, a broken link, or a security concern. Reports are reviewed in good faith; do not submit knowingly false reports." ] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie & Local Storage Notice",
    summary: "The browser storage ToolsHUB uses to keep the service working and remember your choices.",
    sections: [
      { heading: "Essential storage", paragraphs: ["ToolsHUB uses essential session cookies when you sign in. These are needed to keep an authenticated session and apply account protections." ] },
      { heading: "Preferences and local processing", paragraphs: ["Your language, theme, optional visual effects, and in-progress browser-tool state may be kept in local storage or current-tab memory so your workspace behaves consistently. Browser-local tools do not need to upload your input to work when local processing is stated." ] },
      { heading: "Managing storage", paragraphs: ["You can clear cookies and local storage in your browser settings. Doing so may sign you out and reset preferences or current tool state. ToolsHUB does not use browser storage to create advertising profiles." ] },
    ],
  },
];

export const legalPolicyBySlug = (slug: string) => legalPolicies.find((policy) => policy.slug === slug);

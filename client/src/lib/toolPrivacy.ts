/**
 * Browser-tool inputs are intentionally ephemeral.  ToolsHUB does not write
 * their content to localStorage, sessionStorage, the URL, analytics, or APIs.
 * A route transition always clears the in-memory input state.
 */
export const toolInputPrivacyPolicy = {
  retention: "memory-only" as const,
  shouldPersist: () => false,
  clearOnToolChange: true,
};

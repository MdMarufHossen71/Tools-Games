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

/** Applies the no-retention policy whenever a visitor moves between tools. */
export function inputAfterToolChange(previousSlug: string | undefined, nextSlug: string | undefined, currentInput: string) {
  if (toolInputPrivacyPolicy.clearOnToolChange && previousSlug !== nextSlug) return "";
  return currentInput;
}

/** Cobalt Workshop design reminder: presets are familiar developer palettes translated into a coherent, low-distraction product surface. */
export type ThemeTokens = { background: string; surface: string; text: string; primary: string; secondary: string; border: string };
export type ThemePreset = { id: string; name: string; isDark: boolean; tokens: ThemeTokens; custom?: boolean };
export const themePresets: ThemePreset[] = [
  { id: "light", name: "Light", isDark: false, tokens: { background: "#f7f9fc", surface: "#ffffff", text: "#172033", primary: "#2563eb", secondary: "#0ea5e9", border: "#d9e1ef" } },
  { id: "dark", name: "Dark", isDark: true, tokens: { background: "#101722", surface: "#192333", text: "#e6edf7", primary: "#4f8cff", secondary: "#38bdf8", border: "#2b3b50" } },
  { id: "developer-blue", name: "Developer Blue", isDark: true, tokens: { background: "#1e1e2e", surface: "#29293d", text: "#cdd6f4", primary: "#4dabf7", secondary: "#89b4fa", border: "#45475a" } },
  { id: "developer-green", name: "Developer Green", isDark: true, tokens: { background: "#0d1117", surface: "#161b22", text: "#c9d1d9", primary: "#3fb950", secondary: "#58a6ff", border: "#30363d" } },
  { id: "monokai", name: "Monokai", isDark: true, tokens: { background: "#272822", surface: "#3e3d32", text: "#f8f8f2", primary: "#a6e22e", secondary: "#f92672", border: "#5d5c50" } },
  { id: "dracula", name: "Dracula", isDark: true, tokens: { background: "#282a36", surface: "#343746", text: "#f8f8f2", primary: "#bd93f9", secondary: "#ff79c6", border: "#4d5065" } },
  { id: "nord", name: "Nord", isDark: true, tokens: { background: "#2e3440", surface: "#3b4252", text: "#eceff4", primary: "#88c0d0", secondary: "#81a1c1", border: "#4c566a" } },
  { id: "solarized-dark", name: "Solarized Dark", isDark: true, tokens: { background: "#002b36", surface: "#073642", text: "#e8e3d7", primary: "#b58900", secondary: "#2aa198", border: "#24505a" } },
  { id: "gruvbox", name: "Gruvbox", isDark: true, tokens: { background: "#282828", surface: "#3c3836", text: "#ebdbb2", primary: "#fabd2f", secondary: "#fe8019", border: "#665c54" } },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", isDark: true, tokens: { background: "#1e1e2e", surface: "#313244", text: "#cdd6f4", primary: "#cba6f7", secondary: "#89b4fa", border: "#585b70" } },
  { id: "ocean-dark", name: "Ocean Dark", isDark: true, tokens: { background: "#0b1426", surface: "#111f38", text: "#dcecff", primary: "#0ea5e9", secondary: "#22d3ee", border: "#23405e" } },
  { id: "midnight-purple", name: "Midnight Purple", isDark: true, tokens: { background: "#1a1025", surface: "#271a36", text: "#f0e7ff", primary: "#a78bfa", secondary: "#e879f9", border: "#48305f" } },
];
export const fallbackTokens = themePresets[0].tokens;
export const isThemeTokens = (value: unknown): value is ThemeTokens => !!value && typeof value === "object" && ["background", "surface", "text", "primary", "secondary", "border"].every((key) => /^#[0-9A-Fa-f]{6}$/.test((value as Record<string, unknown>)[key] as string));

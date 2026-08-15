import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { translations, type Locale } from "@/i18n";

const state = vi.hoisted(() => ({ language: "es" as Locale, location: "/tools/json-formatter" }));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  useLocation: () => [state.location, vi.fn()],
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/contexts/AppSettingsContext", () => ({
  useSettings: () => ({ language: state.language, t: (key: keyof typeof translations.en) => translations[state.language][key] ?? key }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { platform: { config: { useQuery: () => ({ data: { hiddenToolSlugs: [] } }) } } },
}));

import ToolPage from "./ToolPage";

function renderWorkspace(language: Locale, location: string) {
  state.language = language;
  state.location = location;
  return renderToStaticMarkup(<ToolPage />);
}

describe("ToolPage mobile workspace", () => {
  beforeEach(() => { state.language = "es"; state.location = "/tools/json-formatter"; });

  it("renders localized shared guidance for a non-Bangla LTR workspace and Arabic RTL copy", () => {
    const spanish = renderWorkspace("es", "/tools/json-formatter");
    expect(spanish).toContain(translations.es["workspace.noOutput"]);
    expect(spanish).toContain(translations.es["tool.run"]);
    expect(spanish).toContain(translations.es["tool.output"]);

    const arabic = renderWorkspace("ar", "/tools/pdf-metadata");
    expect(arabic).toContain('<div class="site-frame tool-page workspace-pdf" dir="rtl">');
    expect(arabic).toContain(translations.ar["workspace.choose"]);
    expect(arabic).toContain(translations.ar["workspace.active"]);
    expect(arabic).toContain('accept="application/pdf,.pdf"');
  });

  it("renders category-specific file acceptance and numeric/data entry controls", () => {
    expect(renderWorkspace("en", "/tools/pdf-metadata")).toContain('accept="application/pdf,.pdf"');
    expect(renderWorkspace("en", "/tools/audio-trimmer")).toContain('accept="audio/*,video/*"');
    expect(renderWorkspace("en", "/tools/file-to-base64")).toContain('accept="*/*"');
    expect(renderWorkspace("en", "/tools/calculator")).toContain('inputMode="decimal"');
    expect(renderWorkspace("en", "/tools/json-formatter")).toContain('inputMode="text"');
  });

  it("replaces the requested math routes with dedicated keyboard-friendly calculator workspaces", () => {
    const calculator = renderWorkspace("en", "/tools/calculator");
    expect(calculator).toContain('aria-label="Calculator"');
    expect(calculator).toContain('class="calculator-keys"');
    expect(calculator).not.toContain('<textarea');
    expect(renderWorkspace("en", "/tools/scientific-calculator")).toContain('class="scientific-actions"');
    expect(renderWorkspace("bn", "/tools/percentage-calculator")).toContain("শতকরা ক্যালকুলেটর");
    expect(renderWorkspace("en", "/tools/area-calculator")).toContain("Rectangle");
    expect(renderWorkspace("en", "/tools/trigonometry")).toContain("Sine");
  });

  it("presents Image Crop as an active local canvas editor, not a guided placeholder", () => {
    const crop = renderWorkspace("en", "/tools/image-crop");
    expect(crop).toContain(translations.en["workspace.active"]);
    expect(crop).not.toContain(translations.en["workspace.guided"]);
  });
});

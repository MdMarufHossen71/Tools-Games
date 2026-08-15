import type { ToolCategoryId } from "@/data/catalog";

export type WorkspaceKind = "text" | "image" | "pdf" | "media" | "file" | "data" | "number";

export type WorkspaceModel = {
  kind: WorkspaceKind;
  acceptsFile: boolean;
  accept?: string;
  fileType?: string;
  inputMode?: "text" | "decimal";
};

export function getToolWorkspaceModel(category: ToolCategoryId): WorkspaceModel {
  switch (category) {
    case "images": return { kind: "image", acceptsFile: true, accept: "image/*", fileType: "image" };
    case "pdf": return { kind: "pdf", acceptsFile: true, accept: "application/pdf,.pdf", fileType: "PDF" };
    case "media": return { kind: "media", acceptsFile: true, accept: "audio/*,video/*", fileType: "audio or video" };
    case "files": return { kind: "file", acceptsFile: true, accept: "*/*", fileType: "file" };
    case "math":
    case "numbers":
    case "date-time": return { kind: "number", acceptsFile: false, inputMode: "decimal" };
    case "web-dev":
    case "crypto": return { kind: "data", acceptsFile: false, inputMode: "text" };
    default: return { kind: "text", acceptsFile: false, inputMode: "text" };
  }
}

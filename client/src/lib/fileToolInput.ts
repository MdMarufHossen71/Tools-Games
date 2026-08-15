export type FileInputMode = "data-url" | "text" | "name" | "size";

export function fileInputMode(slug: string): FileInputMode {
  if (slug === "file-to-text") return "text";
  if (slug === "file-type-identifier") return "name";
  if (slug === "file-size-converter") return "size";
  return "data-url";
}

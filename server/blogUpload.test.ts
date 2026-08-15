import { describe, expect, it } from "vitest";
import { blogCoverKey, decodeBlogCover } from "./blogUpload";

describe("blog cover uploads", () => {
  it("accepts supported image data URLs and creates a safe storage key", () => {
    const cover = decodeBlogCover("data:image/png;base64,aGVsbG8=");
    expect(cover.mimeType).toBe("image/png");
    expect(cover.bytes.toString()).toBe("hello");
    expect(blogCoverKey("My summer cover!.png", cover.extension)).toBe("blog/covers/my-summer-cover.jpg".replace(".jpg", ".png"));
  });

  it("rejects non-image input", () => {
    expect(() => decodeBlogCover("data:text/plain;base64,aGVsbG8=")).toThrow("Use a PNG, JPEG, or WebP image.");
  });
});

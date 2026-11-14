import { describe, expect, it } from "vitest";
import { acceptMessage, parseFromPreview, parseToPreview } from "@/lib/admin/preview-protocol";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";

const ORIGIN = "https://example.test";

describe("parseToPreview", () => {
  it("accepts a draft message with valid content", () => {
    const message = parseToPreview({ type: "draft", content: DEFAULT_CONTENT });
    expect(message).not.toBeNull();
    expect(message?.content).toEqual(DEFAULT_CONTENT);
  });

  it("rejects a draft message with invalid content", () => {
    expect(parseToPreview({ type: "draft", content: {} })).toBeNull();
    expect(parseToPreview({ type: "draft" })).toBeNull();
  });

  it("rejects anything that isn't a draft message", () => {
    expect(parseToPreview("x")).toBeNull();
    expect(parseToPreview(null)).toBeNull();
    expect(parseToPreview(undefined)).toBeNull();
    expect(parseToPreview({ type: "other" })).toBeNull();
    expect(parseToPreview({ type: "ready" })).toBeNull();
  });
});

describe("parseFromPreview", () => {
  it("accepts ready", () => {
    expect(parseFromPreview({ type: "ready" })).toEqual({ type: "ready" });
  });

  it("accepts an edit message with a known target", () => {
    expect(parseFromPreview({ type: "edit", target: "image:heroLeft" })).toEqual({
      type: "edit",
      target: "image:heroLeft",
    });
    expect(parseFromPreview({ type: "edit", target: "item:colour.roots" })).not.toBeNull();
  });

  it("rejects an edit message with an unknown or missing target", () => {
    expect(parseFromPreview({ type: "edit", target: "image:../../x" })).toBeNull();
    expect(parseFromPreview({ type: "edit", target: 42 })).toBeNull();
    expect(parseFromPreview({ type: "edit" })).toBeNull();
  });

  it("rejects anything else", () => {
    expect(parseFromPreview("ready")).toBeNull();
    expect(parseFromPreview(null)).toBeNull();
    expect(parseFromPreview({ type: "draft", content: DEFAULT_CONTENT })).toBeNull();
  });
});

describe("acceptMessage", () => {
  it("parses messages from the expected origin", () => {
    expect(acceptMessage(ORIGIN, ORIGIN, { type: "ready" }, parseFromPreview)).toEqual({
      type: "ready",
    });
  });

  it("ignores messages from any other origin", () => {
    expect(
      acceptMessage("https://evil.test", ORIGIN, { type: "ready" }, parseFromPreview),
    ).toBeNull();
    expect(
      acceptMessage("null", ORIGIN, { type: "draft", content: DEFAULT_CONTENT }, parseToPreview),
    ).toBeNull();
  });

  it("gives null for invalid data from the expected origin", () => {
    expect(acceptMessage(ORIGIN, ORIGIN, { type: "nope" }, parseFromPreview)).toBeNull();
  });
});

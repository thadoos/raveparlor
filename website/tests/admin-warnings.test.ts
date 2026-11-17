import { describe, expect, it } from "vitest";
import { contentWarnings } from "@/lib/admin/warnings";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import type { SiteContent } from "@/lib/content/schema";

function content(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}

function warningsFor(edit: (c: SiteContent) => void) {
  const draft = content();
  edit(draft);
  return contentWarnings(content(), draft);
}

describe("contentWarnings", () => {
  it("warns about every copy field that still names a removed barber", () => {
    const warnings = warningsFor((c) => {
      c.barbers.splice(1, 1);
    });
    expect(warnings.every((w) => w.kind === "staleBarberName")).toBe(true);
    expect(warnings.map((w) => w.message)).toEqual([
      "Cut & Style intro (paragraph 2) mentions John, who is no longer a barber.",
      "Cutting & Finishing description mentions John, who is no longer a barber.",
      "Cleansing & Styling note mentions John, who is no longer a barber.",
      "Up-do Hairdressing note mentions John, who is no longer a barber.",
    ]);
    expect(warnings.map((w) => w.target)).toEqual([
      { kind: "intro", category: "cut" },
      { kind: "item", category: "cut", item: "cutting" },
      { kind: "item", category: "cut", item: "cleansing" },
      { kind: "item", category: "cut", item: "updo" },
    ]);
  });

  it("gives no warnings when nobody is removed", () => {
    expect(contentWarnings(content(), content())).toEqual([]);
  });

  it("matches whole words only", () => {
    const published = content();
    published.barbers.push({
      id: "0e4c3f85-6d71-4f40-8d9e-4a5b6c7d8e94",
      name: "Al",
      days: "Mon",
      whatsApp: "447700900123",
    });
    const draft = content();
    draft.services.cut.intro[0] = "Also available for events.";
    expect(contentWarnings(published, draft)).toEqual([]);

    draft.services.cut.intro[0] = "Ask al, or anyone.";
    expect(contentWarnings(published, draft).map((w) => w.message)).toEqual([
      "Cut & Style intro (paragraph 1) mentions Al, who is no longer a barber.",
    ]);
  });
});

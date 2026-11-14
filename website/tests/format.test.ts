import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { buildSiteView } from "@/lib/content/view";
import { formatClosedDays, formatHoursSummary, formatWhatsAppLine } from "@/lib/format";

const site = buildSiteView(DEFAULT_CONTENT, "").site;

describe("site formatters", () => {
  it("formats the WhatsApp line from the site's number", () => {
    expect(formatWhatsAppLine(site)).toBe("WhatsApp 07789 096148");
  });

  it("summarises the opening hours with abbreviated days", () => {
    expect(formatHoursSummary(site, ", ")).toBe("Mon – Sat 10:00 – 19:00, Sun 10:00 – 18:00");
  });

  it("lists the closed days", () => {
    expect(formatClosedDays(site)).toBe("Closed Christmas Day, Boxing Day and New Year’s Day");
  });
});

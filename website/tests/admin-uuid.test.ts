import { describe, expect, it } from "vitest";
import { newId } from "@/lib/admin/uuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newId", () => {
  it("uses randomUUID when available", () => {
    expect(newId()).toMatch(V4);
  });

  it("falls back to getRandomValues outside secure contexts", () => {
    const insecure = { getRandomValues: crypto.getRandomValues.bind(crypto) };
    const ids = new Set(Array.from({ length: 50 }, () => newId(insecure)));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(V4);
  });
});

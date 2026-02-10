import { describe, it, expect } from "vitest";
import { SHORTCUTS, SECTIONS } from "./shortcuts.js";

describe("SHORTCUTS", () => {
  it("contains all expected shortcuts", () => {
    const keys = SHORTCUTS.map((s) => s.keys);
    expect(keys).toMatchInlineSnapshot(`
      [
        "↑/k",
        "↓/j",
        "/",
        "Esc",
        "r",
        "h",
        "u",
        "d",
        "b",
        "B",
        "x",
        "e",
        "c",
        "p",
        "?",
        "q",
      ]
    `);
  });

  it("has no duplicate keys", () => {
    const keys = SHORTCUTS.map((s) => s.keys);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every entry has non-empty keys, label, and section", () => {
    for (const s of SHORTCUTS) {
      expect(s.keys.length).toBeGreaterThan(0);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.section.length).toBeGreaterThan(0);
    }
  });

  it("? shortcut exists in General section", () => {
    const help = SHORTCUTS.find((s) => s.keys === "?");
    expect(help).toBeDefined();
    expect(help!.section).toBe("General");
  });

  it("every shortcut belongs to a known section", () => {
    const sectionSet = new Set<string>(SECTIONS);
    for (const s of SHORTCUTS) {
      expect(sectionSet.has(s.section)).toBe(true);
    }
  });
});

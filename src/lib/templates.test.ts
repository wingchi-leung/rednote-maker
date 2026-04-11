import { describe, it, expect } from "vitest";
import {
  getTemplate,
  getTemplateLayout,
  getCodeBackground,
  getDefaultStrongTextColor,
  TEMPLATES,
} from "./templates";

describe("getTemplate", () => {
  it("returns correct template for valid theme", () => {
    const t = getTemplate("classic");
    expect(t.id).toBe("classic");
    expect(t.colors.background).toBe("#FFFFFF");
  });

  it("throws for unknown theme", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => getTemplate("unknown" as any)).toThrow("Unknown theme: unknown");
  });
});

describe("getTemplateLayout", () => {
  it("returns default for classic", () => {
    expect(getTemplateLayout("classic")).toBe("default");
  });

  it("returns lennyCover for lennyCover", () => {
    expect(getTemplateLayout("lennyCover")).toBe("lennyCover");
  });

  it("returns appleNotes for appleNotes", () => {
    expect(getTemplateLayout("appleNotes")).toBe("appleNotes");
  });
});

describe("getCodeBackground", () => {
  it("returns default when not specified", () => {
    expect(getCodeBackground("classic")).toBe("rgba(0,0,0,0.05)");
  });

  it("returns custom value when specified", () => {
    expect(getCodeBackground("dark")).toBe("rgba(255,255,255,0.08)");
  });
});

describe("getDefaultStrongTextColor", () => {
  it("falls back to accent color when template does not define a custom value", () => {
    expect(getDefaultStrongTextColor("classic")).toBe("#0071E3");
  });
});

describe("TEMPLATES integrity", () => {
  it("all templates have required fields", () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.colors.background).toBeTruthy();
      expect(t.colors.text).toBeTruthy();
      expect(t.colors.accent).toBeTruthy();
      expect(["default", "appleNotes", "lennyCover"]).toContain(t.layout);
    }
  });

  it("all template IDs are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

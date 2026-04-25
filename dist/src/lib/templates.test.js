"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const templates_1 = require("./templates");
(0, vitest_1.describe)("getTemplate", () => {
    (0, vitest_1.it)("returns correct template for valid theme", () => {
        const t = (0, templates_1.getTemplate)("classic");
        (0, vitest_1.expect)(t.id).toBe("classic");
        (0, vitest_1.expect)(t.colors.background).toBe("#FFFFFF");
    });
    (0, vitest_1.it)("throws for unknown theme", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (0, vitest_1.expect)(() => (0, templates_1.getTemplate)("unknown")).toThrow("Unknown theme: unknown");
    });
});
(0, vitest_1.describe)("getTemplateLayout", () => {
    (0, vitest_1.it)("returns default for classic", () => {
        (0, vitest_1.expect)((0, templates_1.getTemplateLayout)("classic")).toBe("default");
    });
    (0, vitest_1.it)("returns lennyCover for lennyCover", () => {
        (0, vitest_1.expect)((0, templates_1.getTemplateLayout)("lennyCover")).toBe("lennyCover");
    });
    (0, vitest_1.it)("returns appleNotes for appleNotes", () => {
        (0, vitest_1.expect)((0, templates_1.getTemplateLayout)("appleNotes")).toBe("appleNotes");
    });
});
(0, vitest_1.describe)("getCodeBackground", () => {
    (0, vitest_1.it)("returns default when not specified", () => {
        (0, vitest_1.expect)((0, templates_1.getCodeBackground)("classic")).toBe("rgba(0,0,0,0.05)");
    });
    (0, vitest_1.it)("returns custom value when specified", () => {
        (0, vitest_1.expect)((0, templates_1.getCodeBackground)("dark")).toBe("rgba(255,255,255,0.08)");
    });
});
(0, vitest_1.describe)("getDefaultStrongTextColor", () => {
    (0, vitest_1.it)("falls back to accent color when template does not define a custom value", () => {
        (0, vitest_1.expect)((0, templates_1.getDefaultStrongTextColor)("classic")).toBe("#0071E3");
    });
});
(0, vitest_1.describe)("TEMPLATES integrity", () => {
    (0, vitest_1.it)("all templates have required fields", () => {
        for (const t of templates_1.TEMPLATES) {
            (0, vitest_1.expect)(t.id).toBeTruthy();
            (0, vitest_1.expect)(t.label).toBeTruthy();
            (0, vitest_1.expect)(t.colors.background).toBeTruthy();
            (0, vitest_1.expect)(t.colors.text).toBeTruthy();
            (0, vitest_1.expect)(t.colors.accent).toBeTruthy();
            (0, vitest_1.expect)(["default", "appleNotes", "lennyCover"]).toContain(t.layout);
        }
    });
    (0, vitest_1.it)("all template IDs are unique", () => {
        const ids = templates_1.TEMPLATES.map((t) => t.id);
        (0, vitest_1.expect)(new Set(ids).size).toBe(ids.length);
    });
});

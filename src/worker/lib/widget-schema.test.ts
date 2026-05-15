import { describe, expect, it } from "vitest";
import { RENDER_WIDGET_TOOL, validateWidget, WidgetValidationError } from "./widget-schema";

describe("widget-schema / validateWidget", () => {
  it("accepts a valid pricing widget", () => {
    const w = validateWidget({
      kind: "pricing",
      title: "Plans",
      payload: {
        plans: [
          {
            name: "Free",
            price: "$0",
            period: "/mo",
            features: ["10 PDFs", "Watermark"],
            ctaLabel: "Start",
            ctaHref: "/sign-up",
          },
          {
            name: "Pro",
            price: "$9",
            period: "/mo",
            features: ["Unlimited PDFs", "No watermark"],
            ctaLabel: "Upgrade",
            ctaHref: "/upgrade",
            highlight: true,
          },
        ],
      },
    });
    expect(w.kind).toBe("pricing");
  });

  it("accepts a valid faq widget", () => {
    const w = validateWidget({
      kind: "faq",
      payload: {
        items: [
          { q: "Is it free?", a: "Yes — 10 PDFs per month." },
          { q: "Does it watermark?", a: "Free plan only." },
        ],
      },
    });
    expect(w.kind).toBe("faq");
  });

  it("accepts a valid callout widget", () => {
    const w = validateWidget({
      kind: "callout",
      payload: { tone: "tip", markdown: "**Pro tip:** use `/improve` to polish drafts." },
    });
    expect(w.kind).toBe("callout");
  });

  it("rejects a widget with unknown kind", () => {
    expect(() => validateWidget({ kind: "wat", payload: {} })).toThrow(WidgetValidationError);
  });

  it("rejects a pricing widget with empty plans array", () => {
    expect(() =>
      validateWidget({ kind: "pricing", payload: { plans: [] } })
    ).toThrow(WidgetValidationError);
  });

  it("rejects a faq widget with malformed items", () => {
    expect(() =>
      validateWidget({ kind: "faq", payload: { items: [{ q: "" }] } })
    ).toThrow(WidgetValidationError);
  });

  it("rejects a cta widget missing href", () => {
    expect(() =>
      validateWidget({ kind: "cta", payload: { label: "Click" } })
    ).toThrow(WidgetValidationError);
  });

  it("preserves optional fields on round-trip", () => {
    const input = {
      kind: "card" as const,
      title: "Featured",
      caption: "This week",
      payload: { eyebrow: "New", heading: "Resume Pro", body: "Pixel-perfect.", href: "/templates/resume" },
    };
    const w = validateWidget(input);
    expect(w).toEqual(input);
  });

  it("RENDER_WIDGET_TOOL covers all 34 widget kinds in its enum", () => {
    const enumKinds = (RENDER_WIDGET_TOOL.input_schema.properties.kind as { enum: string[] }).enum;
    expect(enumKinds).toHaveLength(34);
    expect(new Set(enumKinds).size).toBe(34);
  });
});

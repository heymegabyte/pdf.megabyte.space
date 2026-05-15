import { z } from "zod";
import type { Widget } from "../../shared/ai-chat";

const calloutTone = z.enum(["info", "success", "warning", "danger", "tip"]);
const ctaVariant = z.enum(["primary", "secondary", "ghost"]);
const statusLevel = z.enum(["operational", "degraded", "outage", "maintenance"]);
const severity = z.enum(["info", "success", "warning", "danger"]);

const ctaPayload = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  external: z.boolean().optional(),
  variant: ctaVariant.optional(),
  prompt: z.string().max(500).optional(),
});

const linkItem = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(500),
  description: z.string().max(300).optional(),
  external: z.boolean().optional(),
});

const cardItem = z.object({
  eyebrow: z.string().max(60).optional(),
  heading: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  href: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
});

const photoItem = z.object({
  src: z.string().min(1).max(500),
  alt: z.string().min(1).max(200),
  credit: z.string().max(200).optional(),
  href: z.string().max(500).optional(),
});

const base = <K extends string, P extends z.ZodTypeAny>(kind: K, payload: P) =>
  z.object({
    kind: z.literal(kind),
    id: z.string().max(64).optional(),
    title: z.string().max(160).optional(),
    caption: z.string().max(400).optional(),
    payload,
  });

export const widgetSchema = z.discriminatedUnion("kind", [
  base("text", z.object({ text: z.string().min(1).max(4000) })),
  base("markdown", z.object({ markdown: z.string().min(1).max(8000) })),
  base("callout", z.object({ tone: calloutTone, markdown: z.string().min(1).max(2000) })),
  base("cta", ctaPayload),
  base("link-list", z.object({ items: z.array(linkItem).min(1).max(20) })),
  base("card", cardItem),
  base("card-grid", z.object({ items: z.array(cardItem).min(1).max(12) })),
  base(
    "pricing",
    z.object({
      plans: z
        .array(
          z.object({
            name: z.string().min(1).max(40),
            price: z.string().min(1).max(40),
            period: z.string().max(40).optional(),
            features: z.array(z.string().max(160)).min(1).max(20),
            ctaLabel: z.string().min(1).max(40),
            ctaHref: z.string().min(1).max(500),
            highlight: z.boolean().optional(),
          })
        )
        .min(1)
        .max(6),
    })
  ),
  base(
    "feature-grid",
    z.object({
      items: z
        .array(
          z.object({
            icon: z.string().max(60).optional(),
            heading: z.string().min(1).max(120),
            body: z.string().min(1).max(400),
          })
        )
        .min(1)
        .max(12),
    })
  ),
  base(
    "faq",
    z.object({
      items: z
        .array(z.object({ q: z.string().min(1).max(200), a: z.string().min(1).max(800) }))
        .min(1)
        .max(20),
    })
  ),
  base(
    "table",
    z.object({
      columns: z.array(z.string().max(80)).min(1).max(8),
      rows: z.array(z.array(z.string().max(200)).max(8)).min(1).max(40),
      emphasis: z.array(z.number().int().nonnegative()).max(20).optional(),
    })
  ),
  base(
    "code",
    z.object({
      language: z.string().max(30).optional(),
      code: z.string().min(1).max(8000),
      filename: z.string().max(160).optional(),
    })
  ),
  base(
    "stat-grid",
    z.object({
      items: z
        .array(
          z.object({
            label: z.string().min(1).max(80),
            value: z.string().min(1).max(40),
            sub: z.string().max(80).optional(),
          })
        )
        .min(1)
        .max(8),
    })
  ),
  base(
    "checklist",
    z.object({
      items: z
        .array(
          z.object({
            label: z.string().min(1).max(200),
            done: z.boolean().optional(),
            note: z.string().max(200).optional(),
          })
        )
        .min(1)
        .max(20),
    })
  ),
  base(
    "steps",
    z.object({
      items: z
        .array(z.object({ title: z.string().min(1).max(120), body: z.string().max(400).optional() }))
        .min(1)
        .max(12),
    })
  ),
  base("photo", photoItem),
  base(
    "gallery",
    z.object({
      items: z.array(photoItem).min(1).max(20),
      layout: z.enum(["grid", "carousel"]).optional(),
    })
  ),
  base(
    "video",
    z.object({
      src: z.string().min(1).max(500),
      poster: z.string().max(500).optional(),
      title: z.string().max(160).optional(),
      provider: z.enum(["mp4", "youtube", "vimeo"]).optional(),
    })
  ),
  base(
    "quote",
    z.object({
      text: z.string().min(1).max(800),
      cite: z.string().max(160).optional(),
      role: z.string().max(160).optional(),
      avatar: z.string().max(500).optional(),
    })
  ),
  base(
    "person",
    z.object({
      name: z.string().min(1).max(120),
      role: z.string().max(160).optional(),
      bio: z.string().max(600).optional(),
      avatar: z.string().max(500).optional(),
      href: z.string().max(500).optional(),
    })
  ),
  base(
    "sources",
    z.object({
      items: z
        .array(
          z.object({
            label: z.string().min(1).max(160),
            href: z.string().min(1).max(500),
            description: z.string().max(300).optional(),
            favicon: z.string().max(500).optional(),
          })
        )
        .min(1)
        .max(20),
    })
  ),
  base(
    "suggestions",
    z.object({
      items: z
        .array(z.object({ label: z.string().min(1).max(80), prompt: z.string().min(1).max(400) }))
        .min(1)
        .max(8),
    })
  ),
  base(
    "shortcommands",
    z.object({
      items: z
        .array(
          z.object({
            command: z.string().min(1).max(40),
            description: z.string().min(1).max(160),
            group: z.string().max(40).optional(),
          })
        )
        .min(1)
        .max(80),
    })
  ),
  base(
    "chart",
    z.object({
      kind: z.enum(["bar", "h-bar"]).optional(),
      unit: z.string().max(20).optional(),
      max: z.number().optional(),
      items: z
        .array(
          z.object({
            label: z.string().min(1).max(80),
            value: z.number(),
            sub: z.string().max(80).optional(),
            highlight: z.boolean().optional(),
          })
        )
        .min(1)
        .max(20),
    })
  ),
  base(
    "timeline",
    z.object({
      items: z
        .array(
          z.object({
            when: z.string().min(1).max(40),
            title: z.string().min(1).max(160),
            body: z.string().max(400).optional(),
            tag: z.string().max(40).optional(),
            href: z.string().max(500).optional(),
          })
        )
        .min(1)
        .max(20),
    })
  ),
  base(
    "rating",
    z.object({
      value: z.number().min(0).max(5),
      max: z.number().min(1).max(10).optional(),
      label: z.string().max(80).optional(),
      reviews: z.number().int().nonnegative().optional(),
    })
  ),
  base(
    "status",
    z.object({
      overall: statusLevel,
      items: z
        .array(z.object({ label: z.string().min(1).max(80), status: statusLevel, note: z.string().max(160).optional() }))
        .max(20)
        .optional(),
      href: z.string().max(500).optional(),
    })
  ),
  base(
    "form",
    z.object({
      action: z.string().max(500).optional(),
      submitLabel: z.string().max(40).optional(),
      fields: z
        .array(
          z.object({
            name: z.string().min(1).max(40),
            label: z.string().min(1).max(80),
            type: z.enum(["text", "email", "textarea", "url"]).optional(),
            placeholder: z.string().max(160).optional(),
            required: z.boolean().optional(),
          })
        )
        .min(1)
        .max(8),
    })
  ),
  base(
    "search-results",
    z.object({
      items: z
        .array(
          z.object({
            title: z.string().min(1).max(160),
            href: z.string().min(1).max(500),
            snippet: z.string().max(400).optional(),
            eyebrow: z.string().max(60).optional(),
            score: z.number().optional(),
          })
        )
        .min(1)
        .max(20),
      query: z.string().max(200).optional(),
    })
  ),
  base(
    "alert",
    z.object({
      severity,
      heading: z.string().min(1).max(160),
      body: z.string().max(600).optional(),
      action: z
        .object({
          label: z.string().min(1).max(60),
          href: z.string().max(500).optional(),
          prompt: z.string().max(400).optional(),
        })
        .optional(),
      dismissible: z.boolean().optional(),
    })
  ),
  base(
    "breadcrumb",
    z.object({
      items: z
        .array(z.object({ label: z.string().min(1).max(80), href: z.string().max(500).optional() }))
        .min(1)
        .max(8),
    })
  ),
  base(
    "multi-choice",
    z.object({
      question: z.string().max(200).optional(),
      items: z
        .array(
          z.object({
            label: z.string().min(1).max(80),
            prompt: z.string().min(1).max(400),
            description: z.string().max(200).optional(),
          })
        )
        .min(1)
        .max(8),
    })
  ),
  base(
    "before-after",
    z.object({
      before: z.object({ src: z.string().min(1).max(500), alt: z.string().min(1).max(200) }),
      after: z.object({ src: z.string().min(1).max(500), alt: z.string().min(1).max(200) }),
      beforeLabel: z.string().max(40).optional(),
      afterLabel: z.string().max(40).optional(),
      initial: z.number().min(0).max(100).optional(),
    })
  ),
  base(
    "document",
    z.object({
      filename: z.string().min(1).max(200),
      href: z.string().min(1).max(500),
      bytes: z.number().int().nonnegative().optional(),
      format: z.string().max(20).optional(),
      description: z.string().max(400).optional(),
    })
  ),
]);

export class WidgetValidationError extends Error {
  constructor(message: string, public readonly issues: z.ZodIssue[]) {
    super(message);
    this.name = "WidgetValidationError";
  }
}

export function validateWidget(input: unknown): Widget {
  const result = widgetSchema.safeParse(input);
  if (!result.success) {
    throw new WidgetValidationError(
      `Invalid widget payload: ${result.error.issues[0]?.message ?? "unknown"}`,
      result.error.issues
    );
  }
  return result.data as Widget;
}

export const RENDER_WIDGET_TOOL = {
  name: "render_widget",
  description:
    "Render a rich UI widget inline in the chat. Prefer this over markdown when the answer is a list of plans, FAQs, links, steps, stats, a table, a CTA, or any structured artifact. The widget appears immediately after any prose you've already streamed.",
  input_schema: {
    type: "object" as const,
    properties: {
      kind: {
        type: "string",
        enum: [
          "text", "markdown", "callout", "cta", "link-list", "card", "card-grid",
          "pricing", "feature-grid", "faq", "table", "code", "stat-grid",
          "checklist", "steps", "photo", "gallery", "video", "quote", "person",
          "sources", "suggestions", "shortcommands", "chart", "timeline",
          "rating", "status", "form", "search-results", "alert", "breadcrumb",
          "multi-choice", "before-after", "document",
        ],
        description: "Widget variant to render.",
      },
      title: { type: "string", description: "Optional widget heading." },
      caption: { type: "string", description: "Optional sub-caption under the title." },
      payload: {
        type: "object",
        description:
          "Variant-specific payload — see widget contracts. Server validates with Zod and rejects malformed payloads.",
      },
    },
    required: ["kind", "payload"],
  },
};

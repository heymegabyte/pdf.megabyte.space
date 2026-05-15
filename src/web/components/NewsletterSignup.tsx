import React, { useState } from "react";
import { Mail, ArrowRight, Check, Sparkles } from "lucide-react";
import { captureEvent } from "../lib/analytics";

interface Props {
  source?: string;
  variant?: "card" | "inline" | "footer";
  heading?: string;
  blurb?: string;
}

/**
 * Standalone newsletter signup, distinct from the podcast waitlist.
 * Lands subscribers in the general product-updates list with attribs.newsletter=true.
 * Three render variants: full card (homepage section), inline (sidebar/dock),
 * footer (slim, no halo). All three POST to /api/newsletter/subscribe.
 */
export function NewsletterSignup({
  source = "landing_newsletter",
  variant = "card",
  heading = "PDF craft, in your inbox.",
  blurb = "One short email when something useful ships — new templates, sharper prompts, the occasional war story. Unsubscribe in a click.",
}: Props): React.ReactElement {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      setErrorMsg("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setStatus("done");
      captureEvent("newsletter_signup", { source });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  };

  if (variant === "footer") {
    return (
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
        <label htmlFor={`nl-email-${source}`} className="sr-only">Email address</label>
        <input
          id={`nl-email-${source}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@work.com"
          disabled={status === "sending" || status === "done"}
          className="flex-1 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-line)] text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "sending" || status === "done"}
          className="btn btn-primary text-sm px-4 py-2 disabled:opacity-60"
        >
          {status === "done" ? (
            <><Check size={14} aria-hidden="true" /> Subscribed</>
          ) : status === "sending" ? "…" : "Subscribe"}
        </button>
        {status === "error" && (
          <p role="alert" className="text-xs text-red-400 mt-1">{errorMsg}</p>
        )}
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
          <Mail size={14} className="text-[var(--color-cyan)]" aria-hidden="true" />
          {heading}
        </p>
        <p className="text-xs text-[var(--color-muted)] mb-3 text-pretty">{blurb}</p>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor={`nl-email-inline-${source}`} className="sr-only">Email</label>
          <input
            id={`nl-email-inline-${source}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={status === "sending" || status === "done"}
            className="px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-line)] text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "sending" || status === "done"}
            className="btn btn-primary text-sm px-4 py-2 disabled:opacity-60 justify-center"
          >
            {status === "done" ? (
              <><Check size={14} aria-hidden="true" /> On the list</>
            ) : status === "sending" ? "Sending…" : <>Subscribe <ArrowRight size={12} aria-hidden="true" /></>}
          </button>
        </form>
        {status === "error" && (
          <p role="alert" className="text-xs text-red-400 mt-2">{errorMsg}</p>
        )}
        {status === "done" && (
          <p className="text-xs text-[var(--color-cyan)] mt-2">Confirmed. One email when there's something good.</p>
        )}
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24" id="newsletter">
      <div className="card relative overflow-hidden p-6 lg:p-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(50% 70% at 20% 50%, rgba(0,229,255,0.18), transparent 60%), radial-gradient(40% 60% at 80% 80%, rgba(124,58,237,0.18), transparent 65%)",
          }}
        />
        <div className="relative grid lg:grid-cols-[1fr_auto] items-center gap-8">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)] mb-3">
              <Sparkles size={14} aria-hidden="true" />
              The Megabyte PDF dispatch
            </p>
            <h2
              className="text-2xl lg:text-3xl font-bold mb-3 text-balance"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {heading}
            </h2>
            <p className="text-[var(--color-muted)] max-w-xl mb-5 text-pretty">{blurb}</p>
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <label htmlFor={`nl-email-card-${source}`} className="sr-only">Email address for product updates</label>
              <input
                id={`nl-email-card-${source}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@work.com"
                disabled={status === "sending" || status === "done"}
                className="flex-1 px-4 py-2.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-line)] text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "sending" || status === "done"}
                className="btn btn-primary text-sm px-5 py-2.5 disabled:opacity-60"
              >
                {status === "done" ? (
                  <><Check size={16} aria-hidden="true" /> On the list</>
                ) : status === "sending" ? "Sending…" : (
                  <>Subscribe <ArrowRight size={14} aria-hidden="true" /></>
                )}
              </button>
            </form>
            <p className="text-xs text-[var(--color-muted)] mt-3">
              About one email a month. No spam. Unsubscribe with one click — we use Listmonk, not Mailchimp.
            </p>
            {status === "error" && (
              <p role="alert" className="text-xs text-red-400 mt-2">{errorMsg}</p>
            )}
            {status === "done" && (
              <p className="text-xs text-[var(--color-cyan)] mt-2">
                Confirmed — welcome email on its way. Reply to it any time, it's a real inbox.
              </p>
            )}
          </div>
          <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-4">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-violet)] grid place-items-center shadow-lg">
              <Mail size={36} className="text-[#060610]" aria-hidden="true" />
            </div>
            <p className="text-xs text-[var(--color-muted)] text-center">~1 email<br />per month</p>
          </div>
        </div>
      </div>
    </section>
  );
}

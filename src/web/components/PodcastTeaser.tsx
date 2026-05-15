import React, { useEffect, useRef, useState } from "react";
import { Mic, ArrowRight, Check, Headphones, Rss, Play } from "lucide-react";
import { captureEvent } from "../lib/analytics";

interface Platform {
  name: string;
  href: string;
  label: string;
}

// Pre-launch placeholders — the RSS URL is the canonical one we'll publish to.
// Apple/Spotify/Overcast links will resolve once Episode 1 ships and we register
// the feed with each directory. Until then they all point at the RSS source so
// listeners can still subscribe via any reader of their choice.
const PODCAST_PLATFORMS: readonly Platform[] = [
  { name: "Apple", href: "/podcast/feed.xml", label: "Apple Podcasts" },
  { name: "Spotify", href: "/podcast/feed.xml", label: "Spotify" },
  { name: "Overcast", href: "/podcast/feed.xml", label: "Overcast" },
  { name: "RSS", href: "/podcast/feed.xml", label: "RSS feed" },
] as const;

const EPISODE_TEASERS: readonly { num: string; title: string; eta: string }[] = [
  { num: "Ep 01", title: "The one-prompt invoice", eta: "May 2026" },
  { num: "Ep 02", title: "Designing PDFs in chat", eta: "June 2026" },
  { num: "Ep 03", title: "Resumes that get read", eta: "June 2026" },
] as const;

// Procedural Web Audio "trailer chime" — 3-note brand motif (220Hz → 330Hz → 440Hz).
// Plays only on user gesture. Visualizer reads live FFT data from the same audio graph,
// so the bars are honest representations of real audio, not a fake animation. Stops
// after one pass to avoid annoying anyone.
async function playTrailerChime(canvas: HTMLCanvasElement | null): Promise<void> {
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  master.connect(analyser);

  const notes = [
    { freq: 220, start: 0, dur: 0.7 },
    { freq: 330, start: 0.45, dur: 0.7 },
    { freq: 440, start: 0.9, dur: 1.1 },
  ];
  const now = ctx.currentTime;
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = n.freq;
    gain.gain.setValueAtTime(0, now + n.start);
    gain.gain.linearRampToValueAtTime(0.18, now + n.start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + n.start);
    osc.stop(now + n.start + n.dur);
  }
  master.gain.linearRampToValueAtTime(1, now + 0.05);
  master.gain.setValueAtTime(1, now + 1.9);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

  const ctxEl = canvas?.getContext("2d");
  if (canvas && ctxEl) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const start = performance.now();
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctxEl.clearRect(0, 0, w, h);
      const bars = 28;
      const gap = 4 * dpr;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = (data[Math.floor((i / bars) * data.length)] ?? 0) / 255;
        const bh = Math.max(2 * dpr, v * h * 0.85);
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctxEl.fillStyle = i % 2 === 0 ? "#00E5FF" : "#7C3AED";
        ctxEl.globalAlpha = 0.65 + v * 0.35;
        ctxEl.fillRect(x, y, bw, bh);
      }
      ctxEl.globalAlpha = 1;
      if (performance.now() - start < 2400) requestAnimationFrame(tick);
      else ctx.close().catch(() => {});
    };
    requestAnimationFrame(tick);
  } else {
    setTimeout(() => ctx.close().catch(() => {}), 2400);
  }
}

export function PodcastTeaser(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 28;
      const gap = 4 * dpr;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const phase = i * 0.42 - t * 1.8;
        const v = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(phase)) * (0.6 + 0.4 * Math.sin(t * 0.7 + i * 0.13));
        const bh = Math.max(2 * dpr, v * h * 0.75);
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctx.fillStyle = i % 2 === 0 ? "#00E5FF" : "#7C3AED";
        ctx.globalAlpha = 0.35 + v * 0.35;
        ctx.fillRect(x, y, bw, bh);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
      const res = await fetch("/api/podcast/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setStatus("done");
      captureEvent("podcast_waitlist_signup");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24" id="podcast">
      <div className="card p-6 lg:p-10 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 50%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(40% 60% at 80% 20%, rgba(0,229,255,0.18), transparent 65%)",
          }}
        />
        <div className="relative grid lg:grid-cols-[1fr_auto] items-center gap-8">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-violet)] mb-3">
              <Mic size={14} aria-hidden="true" />
              The Megabyte PDF Podcast
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-balance" style={{ fontFamily: "var(--font-display)" }}>
              How to write a prompt that prints.
            </h2>
            <p className="text-[var(--color-muted)] max-w-xl mb-5 text-pretty">
              A short-form podcast on prompt craft, document design, and the people shipping
              real PDFs from chat. Episode 1 drops soon.
            </p>
            <canvas
              ref={canvasRef}
              className="w-full h-12 lg:h-14 mb-5 rounded-md"
              aria-label="Audio waveform preview"
            />
            <button
              type="button"
              onClick={() => {
                captureEvent("podcast_trailer_play");
                playTrailerChime(canvasRef.current);
              }}
              className="btn btn-ghost text-xs px-3 py-1.5 underline-hover mb-5"
              aria-label="Play 2-second brand trailer"
            >
              ▶ Play brand chime
            </button>
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <label htmlFor="podcast-email" className="sr-only">Email address for podcast waitlist</label>
              <input
                id="podcast-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={status === "sending" || status === "done"}
                className="flex-1 px-4 py-2.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-line)] text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-2 focus:ring-[var(--color-cyan)]/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "sending" || status === "done"}
                className="btn btn-primary text-sm px-5 py-2.5 disabled:opacity-60"
              >
                {status === "done" ? (
                  <>
                    <Check size={16} aria-hidden="true" /> On the list
                  </>
                ) : status === "sending" ? (
                  "Sending…"
                ) : (
                  <>
                    Notify me <ArrowRight size={14} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
            {status === "error" && (
              <p role="alert" className="text-xs text-red-400 mt-2">{errorMsg}</p>
            )}
            {status === "done" && (
              <p className="text-xs text-[var(--color-cyan)] mt-2">
                Confirmed — you'll get one email the day Episode 1 ships. Nothing else.
              </p>
            )}
            <div className="mt-6 pt-5 border-t border-[var(--color-line)]/60">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] mb-3 flex items-center gap-2">
                <Headphones size={12} aria-hidden="true" />
                Subscribe ahead — listen where you already are
              </p>
              <div className="flex flex-wrap gap-2">
                {PODCAST_PLATFORMS.map((p) => (
                  <a
                    key={p.name}
                    href={p.href}
                    onClick={() => captureEvent("podcast_platform_click", { platform: p.name })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] text-xs text-[var(--color-fg)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] transition motion-reduce:transition-none"
                    aria-label={`Subscribe via ${p.label}`}
                  >
                    {p.name === "RSS" ? (
                      <Rss size={12} aria-hidden="true" />
                    ) : (
                      <Play size={11} aria-hidden="true" />
                    )}
                    {p.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch justify-between gap-4 lg:w-72">
            <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-4">
              <div className="size-20 rounded-2xl bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-violet)] grid place-items-center shadow-lg">
                <Mic size={36} className="text-[#060610]" aria-hidden="true" />
              </div>
              <p className="text-xs text-[var(--color-muted)] text-center">Coming<br />May 2026</p>
            </div>
            <ul className="space-y-2" aria-label="Upcoming podcast episodes">
              {EPISODE_TEASERS.map((ep) => (
                <li
                  key={ep.num}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3 py-2 hover:border-[var(--color-violet)]/50 transition motion-reduce:transition-none"
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-violet)] font-semibold">
                    {ep.num} <span className="text-[var(--color-muted)] tracking-normal normal-case font-normal">· {ep.eta}</span>
                  </p>
                  <p className="text-xs text-[var(--color-fg)] mt-0.5 text-pretty">{ep.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

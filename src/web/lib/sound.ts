// Opt-in audio cues. Synthesized via Web Audio API — no asset loading.
// Stored preference: localStorage["megabyte-pdf:sound"] === "on".

const STORAGE_KEY = "megabyte-pdf:sound";

let ctx: AudioContext | null = null;
let unlocked = false;

function isOn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage?.getItem(STORAGE_KEY) === "on";
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function unlock() {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

if (typeof window !== "undefined") {
  const handler = () => {
    unlock();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
}

type Tone = { freq: number; durMs: number; type?: OscillatorType; gain?: number; attack?: number };

function tone({ freq, durMs, type = "sine", gain = 0.06, attack = 0.005 }: Tone, startOffsetMs = 0) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t0 = c.currentTime + startOffsetMs / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

export function isSoundOn(): boolean {
  return isOn();
}

export function setSoundOn(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  if (on) {
    unlock();
    play("toggle-on");
  }
}

type CueName =
  | "send"
  | "receive"
  | "success"
  | "error"
  | "publish"
  | "copy"
  | "toggle-on"
  | "snapshot";

export function play(name: CueName) {
  if (!isOn()) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  switch (name) {
    case "send":
      tone({ freq: 660, durMs: 90, type: "sine", gain: 0.05 });
      break;
    case "receive":
      tone({ freq: 880, durMs: 120, type: "sine", gain: 0.05 });
      tone({ freq: 1175, durMs: 140, type: "sine", gain: 0.04 }, 60);
      break;
    case "success":
      tone({ freq: 784, durMs: 100, gain: 0.06 });
      tone({ freq: 988, durMs: 140, gain: 0.06 }, 80);
      tone({ freq: 1318, durMs: 180, gain: 0.05 }, 180);
      break;
    case "error":
      tone({ freq: 220, durMs: 140, type: "triangle", gain: 0.05 });
      tone({ freq: 175, durMs: 180, type: "triangle", gain: 0.05 }, 90);
      break;
    case "publish":
      tone({ freq: 523, durMs: 120, gain: 0.05 });
      tone({ freq: 659, durMs: 140, gain: 0.05 }, 90);
      tone({ freq: 988, durMs: 200, gain: 0.05 }, 220);
      break;
    case "copy":
      tone({ freq: 1320, durMs: 60, type: "sine", gain: 0.04 });
      break;
    case "toggle-on":
      tone({ freq: 587, durMs: 70, gain: 0.05 });
      tone({ freq: 880, durMs: 90, gain: 0.05 }, 60);
      break;
    case "snapshot":
      tone({ freq: 440, durMs: 50, type: "square", gain: 0.04 });
      tone({ freq: 660, durMs: 70, type: "square", gain: 0.04 }, 50);
      break;
  }
}

const PALETTE = [
  "#00E5FF",
  "#50AAE3",
  "#7C3AED",
  "#FACC15",
  "#F472B6",
  "#34D399",
];

export function fireConfetti(count = 80, originX = 0.5) {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const startX = window.innerWidth * originX;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const angle = (Math.random() - 0.5) * Math.PI * 1.2;
    const spread = (Math.random() * 0.7 + 0.3) * window.innerWidth * 0.7;
    const cx = Math.sin(angle) * spread;
    const color = PALETTE[i % PALETTE.length];
    const left = startX + (Math.random() - 0.5) * 60;
    const dur = 1800 + Math.random() * 1600;
    const size = 6 + Math.random() * 6;
    piece.style.cssText =
      `left:${left}px;background:${color};` +
      `width:${size}px;height:${size * 1.6}px;` +
      `--cx:${cx}px;--dur:${dur}ms;` +
      `transform:translate3d(0,-10vh,0) rotate(${Math.random() * 360}deg);`;
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
  }
}

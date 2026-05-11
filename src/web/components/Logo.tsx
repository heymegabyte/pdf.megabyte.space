import { useId } from "react";

export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  const gradId = useId();
  return (
    <span
      className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}
      style={{ fontSize: size * 0.75, fontFamily: "var(--font-display)" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5FF" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="4" y="2" width="20" height="28" rx="3" fill={`url(#${gradId})`} />
        <path d="M18 2 L24 8 L18 8 Z" fill="#060610" opacity="0.25" />
        <path
          d="M9 11 H17 M9 16 H19 M9 21 H15"
          stroke="#060610"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
      <span>
        Megabyte<span className="text-[var(--color-cyan)]">PDF</span>
      </span>
    </span>
  );
}

import { useEffect, useRef } from "react";
import type { Command } from "./commands";

interface SlashMenuProps {
  query: string;
  results: Command[];
  highlight: number;
  onPick: (cmd: Command) => void;
  onHover: (i: number) => void;
}

/**
 * Filtered command palette rendered above the composer. Pure UI — keyboard
 * navigation lives in the parent so Enter/Tab/Arrow are intercepted before the
 * textarea sees them.
 */
export function SlashMenu({ query, results, highlight, onPick, onHover }: SlashMenuProps) {
  const listRef = useRef<HTMLUListElement | null>(null);

  // Keep highlighted row in view when arrow-keying.
  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  if (!results.length) {
    return (
      <div className="aichat-slash" role="listbox" aria-label="Slash commands">
        <div className="aichat-slash-empty">No commands match `{query}`</div>
      </div>
    );
  }

  return (
    <div className="aichat-slash" role="listbox" aria-label="Slash commands">
      <ul ref={listRef} className="aichat-slash-list">
        {results.map((c, i) => (
          <li
            key={c.name}
            role="option"
            aria-selected={i === highlight}
            className={`aichat-slash-item ${i === highlight ? "is-active" : ""}`}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(c);
            }}
          >
            <span className="aichat-slash-name">{c.name}</span>
            <span className="aichat-slash-desc">{c.description}</span>
            <span className="aichat-slash-group">{c.group}</span>
          </li>
        ))}
      </ul>
      <div className="aichat-slash-hint">
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        to navigate · <kbd>Enter</kbd> to run · <kbd>Esc</kbd> to dismiss
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { SlashMenu } from "./SlashMenu";
import type { Command } from "./commands";
import { filterCommands } from "./commands";
import type { StreamingPhase } from "./types";

const MAX_LEN = 6000;

interface ComposerProps {
  phase: StreamingPhase;
  onSend: (text: string) => void;
  onStop: () => void;
  onRunCommand: (cmd: Command, args: string) => void;
}

/**
 * Auto-resizing textarea + send button + slash-menu integration.
 * Enter submits | Shift+Enter newline | / opens the slash menu, Arrow keys
 * navigate it, Enter/Tab picks, Escape dismisses.
 */
export function Composer({ phase, onSend, onStop, onRunCommand }: ComposerProps) {
  const [value, setValue] = useState("");
  const [highlight, setHighlight] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const isStreaming = phase === "connecting" || phase === "streaming";

  const slashQuery = useMemo(() => {
    const v = value.trimStart();
    if (!v.startsWith("/")) return null;
    const space = v.indexOf(" ");
    return space === -1 ? v : v.slice(0, space);
  }, [value]);

  const results = useMemo<Command[]>(() => (slashQuery ? filterCommands(slashQuery) : []), [slashQuery]);

  // Reset highlight when query changes.
  useEffect(() => setHighlight(0), [slashQuery]);

  // Auto-resize.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [value]);

  const submit = useCallback(() => {
    const v = value.trim();
    if (!v) return;
    if (v.startsWith("/")) {
      const space = v.indexOf(" ");
      const head = (space === -1 ? v : v.slice(0, space)).toLowerCase();
      const args = space === -1 ? "" : v.slice(space + 1);
      const hit = filterCommands(head, 1)[0];
      if (hit && hit.name.toLowerCase() === head) {
        setValue("");
        onRunCommand(hit, args);
        return;
      }
    }
    setValue("");
    onSend(v);
  }, [value, onSend, onRunCommand]);

  const pick = useCallback(
    (cmd: Command) => {
      // If the user already typed args, preserve them.
      const v = value.trim();
      const space = v.indexOf(" ");
      const args = space === -1 ? "" : v.slice(space + 1);
      setValue("");
      onRunCommand(cmd, args);
    },
    [value, onRunCommand]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (slashQuery && results.length) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlight((h) => (h + 1) % results.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlight((h) => (h - 1 + results.length) % results.length);
          return;
        }
        if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
          e.preventDefault();
          const hit = results[highlight];
          if (hit) pick(hit);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setValue("");
          return;
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [slashQuery, results, highlight, pick, submit]
  );

  return (
    <div className="aichat-composer-shell">
      {slashQuery ? (
        <SlashMenu
          query={slashQuery}
          results={results}
          highlight={highlight}
          onPick={pick}
          onHover={setHighlight}
        />
      ) : null}
      <div className="aichat-composer">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={onKeyDown}
          placeholder={isStreaming ? "Streaming…" : "Ask anything · / for commands"}
          rows={1}
          aria-label="Message"
          spellCheck
          autoComplete="off"
          autoCorrect="off"
        />
        <div className="aichat-composer-actions">
          <div className="aichat-composer-count" aria-hidden={value.length < MAX_LEN - 200}>
            {value.length > MAX_LEN - 200 ? `${value.length}/${MAX_LEN}` : ""}
          </div>
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop streaming"
              className="aichat-composer-btn is-stop"
            >
              <Square size={14} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              aria-label="Send message"
              className="aichat-composer-btn is-send"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

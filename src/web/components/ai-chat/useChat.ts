import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Message, PageContext, StreamingPhase, Thread, ThreadStore, Widget } from "./types";
import { emptyStore, loadActiveId, loadStore, MAX_THREADS, saveActiveId, saveStore } from "./storage";

const ENDPOINT = "/api/assistant/chat";
const ID_PREFIX = "msg";

function genId(prefix: string = ID_PREFIX): string {
  const rnd = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

function deriveTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "New chat";
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}

function bumpThread(store: ThreadStore, thread: Thread): ThreadStore {
  const next: ThreadStore = {
    threads: { ...store.threads, [thread.id]: thread },
    order: [thread.id, ...store.order.filter((id) => id !== thread.id)],
    schemaVersion: 1,
  };
  if (next.order.length > MAX_THREADS) {
    const dropped = next.order.slice(MAX_THREADS);
    next.order = next.order.slice(0, MAX_THREADS);
    for (const id of dropped) delete next.threads[id];
  }
  return next;
}

export interface UseChatResult {
  store: ThreadStore;
  activeId: string | null;
  active: Thread | null;
  phase: StreamingPhase;
  error: string | null;

  /** Open or create a thread by id (creates a new one if id is null). */
  openThread: (id: string | null) => void;
  newThread: () => string;
  deleteThread: (id: string) => void;
  clearActive: () => void;
  clearAll: () => void;

  /** Streams a user message; pushes user+assistant messages onto the active thread. */
  send: (
    text: string,
    opts?: { widgets?: Widget[]; pageContext?: PageContext; suppressUser?: boolean }
  ) => Promise<void>;
  /** Pushes a fully-formed assistant message (used by /pricing /faq /help etc.). */
  pushAssistantWidgets: (intro: string | undefined, widgets: Widget[]) => void;
  /** Re-runs the last user prompt. */
  regenerate: () => Promise<void>;
  stop: () => void;
  copyLast: () => Promise<void>;
  /** Toggle thumbs feedback on a specific message id; passing the same verdict clears it. */
  setFeedback: (messageId: string, verdict: "up" | "down") => void;
}

export function useChat(): UseChatResult {
  const [store, setStore] = useState<ThreadStore>(() => loadStore());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId());
  const [phase, setPhase] = useState<StreamingPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => saveStore(store), [store]);
  useEffect(() => saveActiveId(activeId), [activeId]);

  const active = useMemo<Thread | null>(() => {
    if (!activeId) return null;
    return store.threads[activeId] ?? null;
  }, [activeId, store]);

  const ensureThread = useCallback(
    (firstUserText: string): Thread => {
      if (active) return active;
      const t: Thread = {
        id: genId("thr"),
        title: deriveTitle(firstUserText),
        messages: [],
        updatedAt: Date.now(),
      };
      setStore((s) => bumpThread(s, t));
      setActiveId(t.id);
      return t;
    },
    [active]
  );

  const openThread = useCallback((id: string | null) => {
    setActiveId(id);
    setError(null);
  }, []);

  const newThread = useCallback((): string => {
    const t: Thread = {
      id: genId("thr"),
      title: "New chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setStore((s) => bumpThread(s, t));
    setActiveId(t.id);
    setError(null);
    return t.id;
  }, []);

  const deleteThread = useCallback(
    (id: string) => {
      setStore((s) => {
        const threads = { ...s.threads };
        delete threads[id];
        const order = s.order.filter((x) => x !== id);
        return { threads, order, schemaVersion: 1 };
      });
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const clearActive = useCallback(() => {
    if (!activeId) return;
    setStore((s) => {
      const t = s.threads[activeId];
      if (!t) return s;
      return bumpThread(s, { ...t, messages: [], title: "New chat", updatedAt: Date.now() });
    });
  }, [activeId]);

  const clearAll = useCallback(() => {
    setStore(emptyStore());
    setActiveId(null);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setPhase("stopped");
  }, []);

  const pushAssistantWidgets = useCallback(
    (intro: string | undefined, widgets: Widget[]) => {
      const baseThread = active ?? {
        id: genId("thr"),
        title: deriveTitle(intro || widgets[0]?.title || "Quick answer"),
        messages: [],
        updatedAt: Date.now(),
      };
      const msg: Message = {
        id: genId(),
        role: "assistant",
        content: intro || "",
        ts: Date.now(),
        widgets,
      };
      const next: Thread = {
        ...baseThread,
        messages: [...baseThread.messages, msg],
        updatedAt: Date.now(),
        title: baseThread.title === "New chat" ? deriveTitle(intro || msg.content || baseThread.title) : baseThread.title,
      };
      setStore((s) => bumpThread(s, next));
      setActiveId(next.id);
    },
    [active]
  );

  const runStream = useCallback(
    async (thread: Thread, pageContext: PageContext | undefined) => {
      const requestId = genId("req");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setPhase("connecting");
      setError(null);
      const startedAt = Date.now();

      // Append a placeholder assistant message we stream into.
      const assistantId = genId();
      setStore((s) => {
        const t = s.threads[thread.id];
        if (!t) return s;
        const msg: Message = { id: assistantId, role: "assistant", content: "", ts: Date.now(), requestId };
        return bumpThread(s, { ...t, messages: [...t.messages, msg], updatedAt: Date.now() });
      });

      let res: Response;
      try {
        res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({
            messages: thread.messages
              .filter((m) => m.content)
              .map((m) => ({ role: m.role, content: m.content })),
            thread: thread.id,
            pageContext,
          }),
          signal: ctrl.signal,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Network error. Try again.");
        setPhase("errored");
        return;
      }

      if (!res.ok || !res.body) {
        let msg = "Assistant unavailable.";
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) msg = j.error;
        } catch {
          // ignore
        }
        setError(msg);
        setPhase("errored");
        setStore((s) => {
          const t = s.threads[thread.id];
          if (!t) return s;
          return bumpThread(s, {
            ...t,
            messages: t.messages.map((m) => (m.id === assistantId ? { ...m, errored: true, content: msg } : m)),
          });
        });
        return;
      }

      setPhase("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";
      const widgets: Widget[] = [];
      let suggestions: string[] | undefined;

      const flushAssistant = (patch: Partial<Message>) => {
        setStore((s) => {
          const t = s.threads[thread.id];
          if (!t) return s;
          return bumpThread(s, {
            ...t,
            messages: t.messages.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
          });
        });
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split(/\n\n/);
          buf = events.pop() ?? "";
          for (const raw of events) {
            if (!raw.trim()) continue;
            const lines = raw.split("\n");
            const evt = lines.find((l) => l.startsWith("event:"))?.slice(6).trim() ?? "message";
            const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
            if (!dataLine) continue;
            let payload: unknown;
            try {
              payload = JSON.parse(dataLine);
            } catch {
              continue;
            }
            if (evt === "token") {
              const t = (payload as { text?: string }).text || "";
              fullText += t;
              flushAssistant({ content: fullText });
            } else if (evt === "widget") {
              widgets.push(payload as Widget);
              flushAssistant({ widgets: [...widgets] });
            } else if (evt === "done") {
              const d = payload as { suggestions?: string[]; durationMs?: number };
              suggestions = d.suggestions;
              flushAssistant({
                suggestions: suggestions,
                widgets: widgets.length ? widgets : undefined,
                durationMs: d.durationMs ?? Date.now() - startedAt,
              });
              setPhase("idle");
            } else if (evt === "error") {
              const e = payload as { message?: string };
              setError(e.message || "Stream error.");
              flushAssistant({ errored: true });
              setPhase("errored");
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          flushAssistant({ stopped: true });
          setPhase("stopped");
          return;
        }
        setError("Stream interrupted.");
        flushAssistant({ errored: true });
        setPhase("errored");
      }
    },
    []
  );

  const send = useCallback<UseChatResult["send"]>(
    async (text, opts) => {
      const clean = text.trim();
      if (!clean && !opts?.widgets?.length) return;
      const thread = ensureThread(clean);

      let next: Thread = thread;
      if (!opts?.suppressUser && clean) {
        const userMsg: Message = { id: genId(), role: "user", content: clean, ts: Date.now() };
        next = {
          ...thread,
          messages: [...thread.messages, userMsg],
          updatedAt: Date.now(),
          title: thread.title === "New chat" ? deriveTitle(clean) : thread.title,
        };
        setStore((s) => bumpThread(s, next));
      }

      if (opts?.widgets?.length) {
        const widgetMsg: Message = {
          id: genId(),
          role: "assistant",
          content: "",
          ts: Date.now(),
          widgets: opts.widgets,
        };
        next = { ...next, messages: [...next.messages, widgetMsg], updatedAt: Date.now() };
        setStore((s) => bumpThread(s, next));
        return;
      }

      await runStream(next, opts?.pageContext);
    },
    [ensureThread, runStream]
  );

  const regenerate = useCallback(async () => {
    if (!active) return;
    const lastUser = [...active.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Drop messages after the last user message.
    const idx = active.messages.findIndex((m) => m.id === lastUser.id);
    const trimmed: Thread = {
      ...active,
      messages: active.messages.slice(0, idx + 1),
      updatedAt: Date.now(),
    };
    setStore((s) => bumpThread(s, trimmed));
    await runStream(trimmed, undefined);
  }, [active, runStream]);

  const setFeedback = useCallback(
    (messageId: string, verdict: "up" | "down") => {
      if (!activeId) return;
      setStore((s) => {
        const t = s.threads[activeId];
        if (!t) return s;
        return bumpThread(s, {
          ...t,
          messages: t.messages.map((m) =>
            m.id === messageId ? { ...m, feedback: m.feedback === verdict ? undefined : verdict } : m
          ),
          updatedAt: Date.now(),
        });
      });
    },
    [activeId]
  );

  const copyLast = useCallback(async () => {
    if (!active) return;
    const last = [...active.messages].reverse().find((m) => m.role === "assistant" && m.content);
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.content);
    } catch {
      // ignore
    }
  }, [active]);

  return {
    store,
    activeId,
    active,
    phase,
    error,
    openThread,
    newThread,
    deleteThread,
    clearActive,
    clearAll,
    send,
    pushAssistantWidgets,
    regenerate,
    stop,
    copyLast,
    setFeedback,
  };
}

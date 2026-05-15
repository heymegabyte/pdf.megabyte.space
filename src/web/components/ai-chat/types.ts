/**
 * Client-side types for the AI Chat panel — re-exports shared contracts
 * and adds storage-layer + UI-state types.
 */

import type { Widget, PageContext, ChatResponse } from "../../../shared/ai-chat";

export type { Widget, PageContext, ChatResponse } from "../../../shared/ai-chat";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  widgets?: Widget[];
  suggestions?: string[];
  sources?: ChatResponse["sources"];
  requestId?: string;
  durationMs?: number;
  stopped?: boolean;
  errored?: boolean;
  /** Per-message thumbs feedback — persisted to localStorage with the thread. */
  feedback?: "up" | "down";
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  context?: PageContext;
}

export interface ThreadStore {
  threads: Record<string, Thread>;
  order: string[];
  schemaVersion: 1;
}

export type StreamingPhase = "idle" | "connecting" | "streaming" | "stopped" | "errored";

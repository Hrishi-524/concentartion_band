/**
 * Centralized API configuration.
 *
 * Every backend call — REST or WebSocket — MUST go through the helpers
 * exported from this module so the base URL is defined in exactly one place.
 *
 * The URL is read from `NEXT_PUBLIC_BACKEND_URL` (defaults to localhost:8000).
 */

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

/** HTTP base (e.g. "http://localhost:8000") */
export const API_BASE = BACKEND_URL.replace(/\/+$/, "");

/**
 * WebSocket base derived from the HTTP URL.
 *   http://… → ws://…
 *   https://… → wss://…
 */
export const WS_BASE = API_BASE.replace(/^http/, "ws");

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------

/** POST JSON to `<API_BASE><path>` and return the parsed response. */
export async function postJSON<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** GET from `<API_BASE><path>` and return the parsed JSON. */
export async function getJSON<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// WebSocket helpers
// ---------------------------------------------------------------------------

/**
 * Build a full WebSocket URL for a given path + optional query params.
 *
 * @example
 *   wsUrl("/ws/eeg", { mode: "csv", file: "highfocus" })
 *   // → "ws://localhost:8000/ws/eeg?mode=csv&file=highfocus"
 */
export function wsUrl(
  path: string,
  params?: Record<string, string>,
): string {
  const base = `${WS_BASE}${path}`;
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
}

// ---------------------------------------------------------------------------
// Endpoint constants (keep all paths in one place)
// ---------------------------------------------------------------------------

export const ENDPOINTS = {
  /** WebSocket – single-user EEG stream */
  WS_EEG: "/ws/eeg",
  /** WebSocket – classroom aggregate stream */
  WS_CLASS: "/ws/class",
  /** POST – push raw EEG value from device */
  POST_EEG: "/eeg",
} as const;

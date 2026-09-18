"use client";

export type QueryStatus = "new" | "progress" | "resolved";

export type Query = {
  id: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  type: string;
  system: string;
  message: string;
  status: QueryStatus;
  date: string;
};

export type QueryDraft = Omit<Query, "id" | "status" | "date">;

const QKEY = "solaris_queries_v1";

/** Stable empty snapshot — also what the server render and hydration use. */
const EMPTY: Query[] = [];

const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedValue: Query[] = EMPTY;

function parse(raw: string | null): Query[] {
  try {
    return raw ? (JSON.parse(raw) as Query[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(QKEY);
  } catch {
    return null;
  }
}

/**
 * Snapshot must be referentially stable between changes, so the parsed list is
 * memoised against the raw string it came from.
 */
export function getQueries(): Query[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

export function getServerQueries(): Query[] {
  return EMPTY;
}

export function subscribeQueries(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

/** Writes the whole inbox; the store is the single writer for localStorage. */
export function writeQueries(list: Query[]) {
  try {
    localStorage.setItem(QKEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — keep working in memory */
  }
  emit();
}

// Saved transmissions for the Live TX app.
//
// Transmissions live in localStorage — no backend, no login, no cost.
// The pure functions (parse/serialize/add/remove/share text) are
// unit-tested; load/persist are thin localStorage wrappers.

export interface Transmission {
  id: string;
  createdAt: number; // epoch ms
  text: string; // "HELLO WORLD"
  morse: string; // ".... . .-.. .-.. --- / .-- --- ..."
}

const STORAGE_KEY = "morse-tx:transmissions";
const MAX_STORED = 30;

export function makeTransmission(text: string, morse: string): Transmission {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    text,
    morse,
  };
}

function isTransmission(x: unknown): x is Transmission {
  if (typeof x !== "object" || x === null) return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.createdAt === "number" &&
    typeof t.text === "string" &&
    typeof t.morse === "string"
  );
}

/** Parse stored JSON into a clean newest-first list. Never throws. */
export function parseTransmissions(raw: string | null): Transmission[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isTransmission)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function serializeTransmissions(list: Transmission[]): string {
  return JSON.stringify(list);
}

/** Prepend, de-dupe by id, cap length. */
export function addTransmission(
  list: Transmission[],
  t: Transmission,
  cap: number = MAX_STORED
): Transmission[] {
  return [t, ...list.filter((x) => x.id !== t.id)].slice(0, cap);
}

export function removeTransmission(
  list: Transmission[],
  id: string
): Transmission[] {
  return list.filter((x) => x.id !== id);
}

export function loadTransmissions(): Transmission[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    return parseTransmissions(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function persistTransmissions(list: Transmission[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeTransmissions(list));
  } catch {
    /* storage full or blocked — transmissions just won't persist */
  }
}

/** The text that gets shared — readable anywhere, no app needed. */
export function transmissionShareText(t: Transmission): string {
  return `📻 Morse TX transmission\n"${t.text}"\n${t.morse}\n— via morse-player.vercel.app`;
}

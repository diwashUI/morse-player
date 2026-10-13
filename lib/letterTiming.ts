// Per-letter timing for Morse playback (PARIS timing).
//
// wordTiming() gives each letter's start time so the UI can fingerspell
// in sync with the beeps — and so the video exporter can draw the same
// timeline. autoWpmForWord() picks a pace where even the shortest letter
// stays on screen long enough to read its hand sign.

import { textToMorse } from "./morse";

export interface LetterEvent {
  letter: string;
  startMs: number;
}

export interface WordTiming {
  events: LetterEvent[];
  /** Total word duration in ms (no trailing gap after the last letter). */
  totalMs: number;
}

/**
 * "HELLO" + morse + wpm → [{letter:'H', startMs:0}, …].
 * Returns no events when the morse doesn't align 1:1 with the word
 * (e.g. characters textToMorse skips).
 */
export function wordTiming(
  word: string,
  morse: string,
  wpm: number
): WordTiming {
  const codes = morse.split(" ");
  const chars = [...word];
  if (codes.length !== chars.length) return { events: [], totalMs: 0 };
  const unit = 1200 / wpm;
  const events: LetterEvent[] = [];
  let t = 0; // in units
  chars.forEach((ch, i) => {
    const syms = [...(codes[i] ?? "")].filter((s) => s === "." || s === "-");
    events.push({ letter: ch, startMs: t * unit });
    let dur = 0;
    syms.forEach((s, si) => {
      dur += s === "." ? 1 : 3;
      if (si < syms.length - 1) dur += 1; // intra-letter gap
    });
    t += dur;
    if (i < chars.length - 1) t += 3; // inter-letter gap
  });
  return { events, totalMs: t * unit };
}

/** Minimum time each hand sign stays readable, in ms. */
export const MIN_SIGN_MS = 900;

/**
 * Pick a WPM so the word's shortest letter still displays for at least
 * MIN_SIGN_MS (letter display time = its units + the following gap).
 * Clamped to 5–40 WPM.
 */
export function autoWpmForWord(word: string, minSignMs: number = MIN_SIGN_MS): number {
  const morse = textToMorse(word.toUpperCase());
  const codes = morse.split(" ").filter(Boolean);
  if (codes.length === 0) return 12;
  const units = codes
    .map((c) =>
      [...c]
        .filter((s) => s === "." || s === "-")
        .reduce((n, s) => n + (s === "." ? 1 : 3), 0)
    )
    .filter((u) => u > 0); // drop separators like "/"
  if (units.length === 0) return 12;
  const unitMs = minSignMs / (Math.min(...units) + 3);
  return Math.round(Math.min(40, Math.max(5, 1200 / unitMs)));
}

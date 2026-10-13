// Word queue + helpers for the Live Transmitter.
//
// The speech recognizer drips out an ever-growing *final* transcript.
// We consume it word by word: everything past `consumed` words is new.
// These pure functions are unit-tested; the hook wires them to the mic.

/** Split text into words, collapsing whitespace. */
export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Given the full accumulated final transcript and how many words we've
 * already consumed, return the newly finalized words plus the new count.
 * If the transcript shrank (recognizer reset), restarts from zero.
 */
export function newWords(
  transcript: string,
  consumed: number
): { words: string[]; consumed: number } {
  const words = splitWords(transcript);
  if (words.length < consumed) return { words, consumed: 0 };
  return { words: words.slice(consumed), consumed: words.length };
}

/** Tiny FIFO for words awaiting Morse playback. */
export class WordQueue {
  private items: string[] = [];

  push(word: string): void {
    if (word) this.items.push(word);
  }

  shift(): string | undefined {
    return this.items.shift();
  }

  peek(): string | undefined {
    return this.items[0];
  }

  get size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}

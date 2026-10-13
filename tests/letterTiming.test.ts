import { describe, expect, it } from "vitest";
import { autoWpmForWord, wordTiming } from "../lib/letterTiming";

describe("wordTiming", () => {
  it("times SOS at 20 WPM (unit = 60ms)", () => {
    // S = ... → 3u tones + 2u intra-gaps = 5u; O = --- → 9u + 2u = 11u;
    // 3u letter gaps. Total = 5+3+11+3+5 = 27u = 1620ms.
    const { events, totalMs } = wordTiming("SOS", "... --- ...", 20);
    expect(events.map((e) => e.letter)).toEqual(["S", "O", "S"]);
    expect(events[0].startMs).toBe(0);
    expect(events[1].startMs).toBe(8 * 60);
    expect(events[2].startMs).toBe(22 * 60);
    expect(totalMs).toBe(27 * 60);
  });

  it("returns no events when morse and word misalign", () => {
    const { events, totalMs } = wordTiming("HI!", ".... ..", 20);
    expect(events).toEqual([]);
    expect(totalMs).toBe(0);
  });

  it("handles a single letter", () => {
    const { events, totalMs } = wordTiming("E", ".", 20);
    expect(events).toEqual([{ letter: "E", startMs: 0 }]);
    expect(totalMs).toBe(60);
  });
});

describe("autoWpmForWord", () => {
  it("slows down for words with short letters", () => {
    // "E" = 1 unit → needs 900/4 = 225ms units → ~5 WPM
    expect(autoWpmForWord("E")).toBe(5);
  });

  it("goes faster when every letter is long", () => {
    // "SOS": min 3 units → 900/6 = 150ms → 8 WPM
    expect(autoWpmForWord("SOS")).toBe(8);
  });

  it("is case-insensitive and clamps to 5..40", () => {
    expect(autoWpmForWord("sos")).toBe(autoWpmForWord("SOS"));
    const w = autoWpmForWord("HELLO");
    expect(w).toBeGreaterThanOrEqual(5);
    expect(w).toBeLessThanOrEqual(40);
  });

  it("falls back for empty input", () => {
    expect(autoWpmForWord("")).toBe(12);
    expect(autoWpmForWord("   ")).toBe(12);
  });
});

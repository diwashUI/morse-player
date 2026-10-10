import { describe, expect, it } from "vitest";
import { morseToSchedule, scheduleDuration } from "../lib/audio";

// At 60 wpm the unit is exactly 20ms — keeps the arithmetic obvious.
const WPM = 60;
const U = 20;

describe("morseToSchedule", () => {
  it("times three dots with 1-unit gaps", () => {
    expect(morseToSchedule("...", WPM)).toEqual([
      { startMs: 0, endMs: U },
      { startMs: 2 * U, endMs: 3 * U },
      { startMs: 4 * U, endMs: 5 * U },
    ]);
  });

  it("makes a dash 3 units long", () => {
    expect(morseToSchedule("-", WPM)).toEqual([{ startMs: 0, endMs: 3 * U }]);
  });

  it("leaves a 3-unit gap between letters", () => {
    // ". ." → dot, 3-unit silence, dot
    expect(morseToSchedule(". .", WPM)).toEqual([
      { startMs: 0, endMs: U },
      { startMs: 4 * U, endMs: 5 * U },
    ]);
  });

  it("leaves a 7-unit gap between words", () => {
    // ". / ." → dot, 7-unit silence, dot
    expect(morseToSchedule(". / .", WPM)).toEqual([
      { startMs: 0, endMs: U },
      { startMs: 8 * U, endMs: 9 * U },
    ]);
  });

  it("handles the classic SOS", () => {
    const ev = morseToSchedule("... --- ...", WPM);
    expect(ev).toHaveLength(9);
    // first dot of S, first dash of O, first dot of final S
    expect(ev[0]).toEqual({ startMs: 0, endMs: U });
    expect(ev[3]).toEqual({ startMs: 8 * U, endMs: 11 * U });
    expect(ev[6]).toEqual({ startMs: 22 * U, endMs: 23 * U });
  });

  it("scales with wpm (20 wpm → 60ms unit)", () => {
    expect(morseToSchedule(".", 20)).toEqual([{ startMs: 0, endMs: 60 }]);
  });

  it("returns [] for empty input", () => {
    expect(morseToSchedule("", WPM)).toEqual([]);
    expect(morseToSchedule("   ", WPM)).toEqual([]);
  });

  it("ignores characters that are not dot/dash", () => {
    expect(morseToSchedule(".x.", WPM)).toEqual([
      { startMs: 0, endMs: U },
      { startMs: 2 * U, endMs: 3 * U },
    ]);
  });

  it("rejects non-positive wpm", () => {
    expect(() => morseToSchedule(".", 0)).toThrow();
    expect(() => morseToSchedule(".", -5)).toThrow();
  });
});

describe("scheduleDuration", () => {
  it("is the end of the last tone", () => {
    expect(scheduleDuration(morseToSchedule("... --- ...", WPM))).toBe(27 * U);
  });

  it("is 0 when there is nothing to play", () => {
    expect(scheduleDuration([])).toBe(0);
  });
});

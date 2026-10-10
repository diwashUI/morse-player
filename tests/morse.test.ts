import { describe, expect, it } from "vitest";
import { isMorseLike, morseToText, textToMorse } from "../lib/morse";

describe("textToMorse", () => {
  it("encodes SOS", () => {
    expect(textToMorse("SOS")).toBe("... --- ...");
  });

  it("is case-insensitive", () => {
    expect(textToMorse("sos")).toBe("... --- ...");
  });

  it("separates words with /", () => {
    expect(textToMorse("HI YOU")).toBe(".... .. / -.-- --- ..-");
  });

  it("encodes digits and punctuation", () => {
    expect(textToMorse("HI! 123")).toBe(".... .. -.-.-- / .---- ..--- ...--");
  });

  it("skips characters it doesn't know", () => {
    expect(textToMorse("A#B")).toBe(".- -...");
  });

  it("handles empty string", () => {
    expect(textToMorse("")).toBe("");
  });
});

describe("morseToText", () => {
  it("decodes SOS", () => {
    expect(morseToText("... --- ...")).toBe("SOS");
  });

  it("round-trips through the encoder", () => {
    const original = "HELLO WORLD 123";
    expect(morseToText(textToMorse(original))).toBe(original);
  });

  it("tolerates messy spacing", () => {
    expect(morseToText("...   --- ...")).toBe("SOS");
  });
});

describe("isMorseLike", () => {
  it("recognizes morse", () => {
    expect(isMorseLike("... --- ...")).toBe(true);
  });

  it("rejects plain text", () => {
    expect(isMorseLike("hello")).toBe(false);
  });
});

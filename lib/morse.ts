// The International Morse alphabet. Single source of truth —
// everything (encoder, decoder, chart) reads from this table.
export const MORSE_TABLE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--",
  "/": "-..-.", "&": ".-...", ":": "---...", ";": "-.-.-.",
  "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-",
  '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

// Reverse lookup, built once from the table above.
const REVERSE_TABLE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([ch, code]) => [code, ch])
);

/** "HELLO WORLD" → ".... . .-.. .-.. --- / .-- --- .-. .-.. -.." */
export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((ch) => (ch === " " ? "/" : MORSE_TABLE[ch] ?? ""))
    .filter(Boolean)
    .join(" ");
}

/** "... --- ..." → "SOS" (tolerates extra spaces) */
export function morseToText(morse: string): string {
  return morse
    .trim()
    .split(/\s*\/\s*/) // words are separated by /
    .map((word) =>
      word
        .split(/\s+/) // letters separated by whitespace
        .map((code) => REVERSE_TABLE[code] ?? "")
        .join("")
    )
    .join(" ");
}

/** Quick check: does this look like morse code? */
export function isMorseLike(input: string): boolean {
  const t = input.trim();
  return t.length > 0 && /^[.\-/\s]+$/.test(t);
}

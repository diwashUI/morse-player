# Morse Code Player 📻

Type text → get Morse code. Paste Morse → get text. Press play and hear it beeped
out loud with a flashing signal light.

## Run it

```bash
npm install
npm run dev    # → http://localhost:3000
npm test       # unit tests
npm run build  # production build
```

## How it's built

```
app/
  page.tsx              — page composition (no logic, just arranges components)
  layout.tsx            — title, theme shell
components/
  MorseInput.tsx        — textarea + encode/decode toggle
  MorseOutput.tsx       — live translation + copy button
  ReferenceChart.tsx    — A–Z 0–9 lookup grid
hooks/
  useMorsePlayer.ts     — play/stop state machine (Day 2)
lib/
  morse.ts              — the alphabet table + textToMorse / morseToText (pure logic)
  audio.ts              — Web Audio beep engine (Day 2)
tests/
  morse.test.ts         — unit tests for the conversion logic
```

Rules: `lib/` never touches the screen, `components/` never touch audio.
They talk through the hook. That's what keeps code maintainable.

## The timing spec

Standard PARIS Morse timing: dot = 1 unit, dash = 3 units, unit = `1200 / WPM` ms.
Tone: 650 Hz sine wave with 5 ms fade in/out (no speaker clicks).

## Roadmap

- [x] Day 1 — encode/decode logic + tests + UI skeleton
- [ ] Day 2 — sound player, signal light, WPM slider, click-to-hear chart
- [ ] Day 3 — polish, deploy, LinkedIn post

# Morse Code Player 📻

Type text → get Morse code. Paste Morse → get text. Press play and hear it beeped
out loud with a flashing signal light. Or tap the mic and just *say* it — speech
recognition transcribes, translates, and plays it back. On a phone, the camera
flashlight can blink the code in sync.

Live: https://morse-player.vercel.app

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
  page.tsx                 — page composition (no logic, just arranges components)
  layout.tsx               — title, theme shell
components/
  MorseInput.tsx           — textarea + encode/decode toggle + mic button
  MorseOutput.tsx          — live translation + copy button
  ReferenceChart.tsx       — A–Z 0–9 lookup grid, click any letter to hear it
  PlaybackControls.tsx     — play/stop + WPM slider
  TappingHand.tsx          — 👊 fist punching in sync with the beeps (+ glow ring)
  VoiceButton.tsx          — mic toggle (hidden where speech API is unsupported)
  TorchToggle.tsx          — camera flashlight toggle (hidden where unsupported)
hooks/
  useMorsePlayer.ts        — play/stop state machine, exactly one playback at a time
  useSpeechInput.ts        — mic → text via the free Web Speech API (Chrome/Edge)
lib/
  morse.ts                 — the alphabet table + textToMorse / morseToText (pure logic)
  audio.ts                 — Web Audio beep engine: PARIS timing → tone schedule → sound
  torch.ts                 — camera flashlight control via MediaDevices torch constraint
tests/
  morse.test.ts            — unit tests for the conversion logic
  audio.test.ts            — unit tests for the timing scheduler
```

Rules: `lib/` never touches the screen, `components/` never touch audio.
They talk through hooks. That's what keeps code maintainable.

## The timing spec

Standard PARIS Morse timing: dot = 1 unit, dash = 3 units, unit = `1200 / WPM` ms.
Tone: 650 Hz sine wave with 5 ms fade in/out (no speaker clicks).

## Browser notes

- **Mic**: needs Chrome/Edge + HTTPS + mic permission. Everywhere else the button hides itself.
- **Flashlight**: needs a phone with a flash (Android Chrome). Desktops report "no flash on this device".

## Roadmap

- [x] Day 1 — encode/decode logic + tests + UI skeleton
- [x] Day 2 — sound player, signal light, WPM slider, click-to-hear chart
- [x] Day 2.5 — voice input, torch flash sync
- [x] Deploy — live on Vercel
- [x] Hand-sign visual — tapping-hand animation 👊
- [ ] Day 3 — LinkedIn post with a video of it beeping your name

# Morse Code Player — Floor Plan

## 1. What it is

A single-page web app that translates text to Morse code and **plays it out loud**
with real beeps, plus a flashing light synced to the sound. Also translates Morse
back to text. Zero backend, zero API keys, zero cost — everything runs in the browser.

## 2. What it does (v1 scope)

- **Live encode:** type text → Morse appears instantly as you type
- **Decode mode:** paste `... --- ...` → get `SOS` back
- **Play:** beeps the message through your speakers (dot = short beep, dash = long beep)
- **Signal light:** a lamp that flashes in sync with every beep
- **Speed control:** 5–40 WPM slider (words per minute)
- **Reference chart:** A–Z, 0–9 grid — click any letter to hear it
- **Copy button:** one click to copy the Morse output

**Non-goals (explicitly out):** no backend, no database, no login, no user accounts.
Not every app needs a server — knowing when you don't is a senior skill.

## 3. Tech stack

| Layer    | Choice | Why |
|----------|--------|-----|
| Language | TypeScript | JavaScript with type labels — catches bugs before runtime |
| Frontend | React 19 via Next.js 16 (App Router) | Industry standard; Vercel deploys it in one click |
| Styling  | Tailwind CSS v4 | Utility classes, no CSS files to babysit |
| Sound    | Web Audio API (built into browsers) | Generates beeps with code — no audio files needed |
| Tests    | Vitest | Unit tests for the conversion logic |
| Extra dependencies | **none** | Pro move: no dependency bloat for a job 3 files can do |

## 4. Architecture (how pro coders structure it)

```
morse-player/
├── PLAN.md                  ← this file
├── README.md                ← setup + how it works (for visitors/recruiters)
├── app/
│   ├── layout.tsx           — page shell: title, dark theme, fonts
│   ├── page.tsx             — composition only: arranges components, no logic
│   └── globals.css          — Tailwind + keyframes (flash, rise animations)
├── components/              — UI pieces, each does one job
│   ├── MorseInput.tsx       — textarea + encode/decode toggle
│   ├── MorseOutput.tsx      — live translation display + copy button
│   ├── PlaybackControls.tsx — play/stop button + WPM slider
│   ├── SignalLight.tsx      — the flashing lamp (pure visual, takes on/off)
│   └── ReferenceChart.tsx   — A–Z 0–9 grid, click-to-hear
├── hooks/
│   └── useMorsePlayer.ts    — state machine: idle | playing; exposes play()/stop()
├── lib/                     — pure logic, zero UI (the testable core)
│   ├── morse.ts             — MORSE_TABLE, textToMorse(), morseToText()
│   └── audio.ts             — MorseAudioEngine: oscillator beeps with exact timing
└── tests/
    └── morse.test.ts        — unit tests: "SOS" → "... --- ...", round-trips, edge cases
```

**Rules the code follows:**
- `lib/` never touches the screen; `components/` never touches audio hardware.
  They talk through the hook. This separation is what makes code maintainable.
- Cancellation uses a generation counter (`useRef`) — the standard pattern for
  stopping async work cleanly.
- Commits follow conventional style: `feat:`, `fix:`, `chore:` — one milestone per commit.

## 5. The Morse timing spec (the real domain logic)

Standard PARIS timing, the same spec real telegraphs used:

- Unit length = `1200 / WPM` milliseconds (at 20 WPM, one unit = 60ms)
- Dot = 1 unit, Dash = 3 units
- Gap between symbols in a letter = 1 unit
- Gap between letters = 3 units
- Gap between words = 7 units
- Tone: 650 Hz sine wave, with 5ms fade in/out (prevents speaker "clicks")

The audio engine schedules each beep with `AudioContext.currentTime` and chains
them with `async/await`. A `onSignal(on/off)` callback fires with every beep —
that's what flashes the light in perfect sync.

## 6. Your learning map (what each file teaches you)

| File | Concepts you'll pick up |
|------|------------------------|
| `lib/morse.ts` | Objects as lookup tables, string methods, pure functions, unit tests |
| `tests/morse.test.ts` | What tests are, arrange-act-assert, why pros test logic not UI |
| `lib/audio.ts` | Web Audio API (OscillatorNode, GainNode), async/await, timing math |
| `hooks/useMorsePlayer.ts` | Custom hooks, state machines, `useRef` for cancellation |
| `components/*` | React props, composition, events, Tailwind styling |
| Deploy steps | git commits, GitHub push, Vercel deploy, env-free static hosting |

After each milestone, we review the diff together before moving on.

## 7. Milestones

- **Day 1 — Logic + skeleton UI:** `lib/morse.ts` + tests green, input/output/chart rendering ✅ (shipped Oct 10)
- **Day 2 — Sound:** `lib/audio.ts` + `useMorsePlayer`, play/stop, WPM slider, signal light ✅ (shipped Oct 10)
- **Day 2.5 — Voice + flash:** mic button (Web Speech API → text → morse → auto-play), camera torch blinks in sync, click-to-hear chart ✅ (shipped Oct 10)
- **Day 3 — Ship:** polish, `npm run build` green, deploy to Vercel, README, LinkedIn post
- **Open question:** hand-sign visual → decided: animated tapping hand 👊 (punches on every beep, glow ring doubles as the signal light). Camera gesture input parked as a possible future extra.

## 8. Definition of done

- [ ] `npm test` passes
- [ ] `npm run build` passes with zero errors
- [ ] Live URL on Vercel
- [ ] README explains what it is in 30 seconds
- [ ] LinkedIn post with a video of it beeping your name

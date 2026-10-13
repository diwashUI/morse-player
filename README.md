# Morse TX 📻

A real-time voice-to-Morse transmitter. Tap the mic, talk — your words stream
out as Morse beeps a few seconds behind your voice, like a live broadcast. The
punching fist, signal glow, and your phone's camera flashlight all fire in sync
with every dot and dash.

Stop transmitting and the message is **saved** — replay it, copy it, or share it
anywhere with one tap. Past transmissions live in your browser (localStorage,
no account, no server).

Live: https://morse-player.vercel.app

> Needs Chrome or Edge — real-time speech recognition only exists in Chromium
> browsers. Your phone's Chrome works great.

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
  page.tsx                 — header, torch toggle, LiveTransmitter
  layout.tsx               — title, theme shell
components/
  LiveTransmitter.tsx      — the whole app: transmit, log, save, share, replay, history
  TappingHand.tsx          — 👊 fist punching in sync with the beeps (+ glow ring)
  TorchToggle.tsx          — camera flashlight on/off
hooks/
  useLiveTransmitter.ts    — mic → words → queued Morse playback pump
lib/
  morse.ts                 — text ⇄ morse tables (PARIS timing)
  audio.ts                 — Web Audio beep engine (pure scheduler + player)
  torch.ts                 — camera flashlight control
  liveQueue.ts             — word consumption + FIFO queue (pure, tested)
  transmissions.ts         — saved transmissions: localStorage + share text
tests/                     — 39 unit tests (vitest)
```

## How the live transmitter works

1. **Listen** — the Web Speech API streams interim guesses and final words
   (Chrome auto-stops on silence, so the hook restarts it).
2. **Consume** — newly finalized words are diffed out of the growing transcript
   and converted to Morse.
3. **Pump** — words queue up and play back-to-back via `playMorse()`, trailing
   your voice by a few seconds. A "queued behind you" counter shows the lag.
4. **Save** — on stop, the transmission is stored in localStorage and shown
   with Share / Copy / Replay actions.

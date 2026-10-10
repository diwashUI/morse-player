// Web Audio beep engine for the Morse player.
//
// Two layers:
//   1. morseToSchedule() — pure function, no browser APIs. Turns a morse
//      string into timed tone events. This is what the tests cover.
//   2. playMorse() — drives a real AudioContext from that schedule.
//
// PARIS timing standard: one "unit" = 1200 / wpm milliseconds.
//   dot = 1 unit, dash = 3 units, gap between symbols = 1 unit,
//   gap between letters = 3 units, gap between words = 7 units.

/** One "sound on" period, in milliseconds from playback start. */
export interface ToneEvent {
  startMs: number;
  endMs: number;
}

/**
 * ".... . / ..." + wpm → [{startMs, endMs}, ...].
 * Letters are space-separated, words are "/"-separated
 * (exactly what textToMorse() produces).
 */
export function morseToSchedule(morse: string, wpm: number): ToneEvent[] {
  if (!Number.isFinite(wpm) || wpm <= 0) {
    throw new Error("wpm must be a positive number");
  }
  const unit = 1200 / wpm;
  const events: ToneEvent[] = [];
  let t = 0;

  const words = morse
    .split("/")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  words.forEach((word, wi) => {
    const letters = word.split(/\s+/);
    letters.forEach((letter, li) => {
      const symbols = [...letter].filter((s) => s === "." || s === "-");
      symbols.forEach((s, si) => {
        const dur = s === "." ? unit : 3 * unit;
        events.push({ startMs: t, endMs: t + dur });
        t += dur;

        const lastSymbol = si === symbols.length - 1;
        const lastLetter = li === letters.length - 1;
        const lastWord = wi === words.length - 1;
        if (!lastSymbol) t += unit;
        else if (!lastLetter) t += 3 * unit;
        else if (!lastWord) t += 7 * unit;
        // no trailing silence after the final tone
      });
    });
  });

  return events;
}

/** Total playback length in ms (0 for empty input). */
export function scheduleDuration(events: ToneEvent[]): number {
  return events.length === 0 ? 0 : events[events.length - 1].endMs;
}

export interface PlayOptions {
  /** Words per minute, default 20. */
  wpm?: number;
  /** Beep pitch in Hz, default 650. */
  frequency?: number;
  /** 0..1, default 0.4. */
  volume?: number;
  /** Fires on every tone on/off transition — drives the signal light, torch, hand. */
  onSignal?: (on: boolean) => void;
}

export interface Playback {
  stop: () => void;
  /** Resolves when playback finishes naturally or via stop(). */
  finished: Promise<void>;
}

/**
 * Play a morse string through the speakers. Must be called from a user
 * gesture (click/tap) or the browser blocks the AudioContext.
 */
export function playMorse(morse: string, opts: PlayOptions = {}): Playback {
  const { wpm = 20, frequency = 650, volume = 0.4, onSignal } = opts;
  const events = morseToSchedule(morse, wpm);

  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  void ctx.resume();

  const timeouts: number[] = [];
  let stopped = false;
  let resolveFinished!: () => void;
  const finished = new Promise<void>((res) => {
    resolveFinished = res;
  });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    timeouts.forEach((id) => window.clearTimeout(id));
    try {
      onSignal?.(false);
    } catch {
      /* listener errors must not break teardown */
    }
    // close() releases the audio hardware; resolve either way.
    ctx.close().then(resolveFinished, resolveFinished);
  };

  // Small headroom so the first tone never starts in the past.
  const t0 = ctx.currentTime + 0.06;

  events.forEach((ev) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;

    const start = t0 + ev.startMs / 1000;
    const end = t0 + ev.endMs / 1000;
    // 5ms ramps kill the click/pop at tone edges.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.005);
    gain.gain.setValueAtTime(volume, Math.max(start + 0.005, end - 0.005));
    gain.gain.linearRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.05);

    // Visuals (light, torch, hand) follow the same clock via timeouts.
    timeouts.push(
      window.setTimeout(() => {
        if (!stopped) onSignal?.(true);
      }, ev.startMs)
    );
    timeouts.push(
      window.setTimeout(() => {
        if (!stopped) onSignal?.(false);
      }, ev.endMs)
    );
  });

  // Natural end of playback.
  timeouts.push(
    window.setTimeout(() => {
      if (!stopped) stop();
    }, scheduleDuration(events) + 60)
  );

  return { stop, finished };
}

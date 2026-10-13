"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { textToMorse } from "../lib/morse";
import { playMorse, type Playback } from "../lib/audio";
import { newWords, WordQueue } from "../lib/liveQueue";

// Minimal structural types for the Web Speech API (same shape as
// useSpeechInput — TS's DOM lib doesn't ship these).
interface SpeechResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface SpeechResultList {
  readonly length: number;
  [index: number]: SpeechResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognition;

export interface LiveWord {
  id: number;
  text: string;
  morse: string;
}

interface UseLiveTransmitterOpts {
  wpm: number;
  frequency?: number;
  /** Fires on every tone on/off — torch, signal light, etc. */
  onSignal?: (on: boolean) => void;
  /** Cap on feed rows kept in state (oldest drop off). */
  maxFeed?: number;
}

const FEED_CAP = 60;

/**
 * Live Morse transmitter: talk → words are transcribed, converted to
 * Morse, and beeped out in order, trailing your voice like a broadcast.
 *
 * - Chrome/Edge only (Web Speech API). `supported` is false elsewhere.
 * - Auto-restarts recognition: Chrome kills it on silence/timeout.
 * - Playback is a chained pump: each word plays back-to-back via
 *   playMorse().finished, so the queue drains in order.
 */
export function useLiveTransmitter({
  wpm,
  frequency = 650,
  onSignal,
  maxFeed = FEED_CAP,
}: UseLiveTransmitterOpts) {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [feed, setFeed] = useState<LiveWord[]>([]);
  const [queued, setQueued] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Letter/word currently being beeped — drives the sign-language display. */
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const letterTimeoutsRef = useRef<number[]>([]);

  const recRef = useRef<SpeechRecognition | null>(null);
  const wantListeningRef = useRef(false);
  const consumedRef = useRef(0);
  const accRef = useRef(""); // accumulated final transcript, across restarts
  const queueRef = useRef<WordQueue>(new WordQueue());
  const pumpingRef = useRef(false);
  const playbackRef = useRef<Playback | null>(null);
  const idRef = useRef(0);
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;
  const freqRef = useRef(frequency);
  freqRef.current = frequency;
  const maxFeedRef = useRef(maxFeed);
  maxFeedRef.current = maxFeed;

  // Clear any pending letter-display timeouts (word finished or stopped).
  const clearLetterEvents = useCallback(() => {
    letterTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    letterTimeoutsRef.current = [];
    setCurrentLetter(null);
    setCurrentWord(null);
  }, []);

  /**
   * Fire setCurrentLetter as each letter's tones begin, so the UI can
   * fingerspell the word in sign language in sync with the beeps.
   * Pure timing math — no audio. Skipped if the morse doesn't align
   * 1:1 with the word's characters.
   */
  const scheduleLetterEvents = useCallback(
    (word: string, morse: string, wpm: number) => {
      const codes = morse.split(" ");
      const chars = [...word];
      if (codes.length !== chars.length) return;
      const unit = 1200 / wpm;
      let t = 0; // in units
      chars.forEach((ch, i) => {
        const syms = [...(codes[i] ?? "")].filter((s) => s === "." || s === "-");
        const startMs = t * unit;
        letterTimeoutsRef.current.push(
          window.setTimeout(() => setCurrentLetter(ch), startMs)
        );
        let dur = 0;
        syms.forEach((s, si) => {
          dur += s === "." ? 1 : 3;
          if (si < syms.length - 1) dur += 1; // intra-letter gap
        });
        t += dur;
        if (i < chars.length - 1) t += 3; // inter-letter gap
      });
      letterTimeoutsRef.current.push(
        window.setTimeout(() => {
          setCurrentLetter(null);
          setCurrentWord(null);
        }, t * unit)
      );
    },
    []
  );

  // Drain the word queue in order, one playMorse() per word.
  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    try {
      for (;;) {
        const word = queueRef.current.shift();
        setQueued(queueRef.current.size);
        if (!word || !wantListeningRef.current) break;
        const morse = textToMorse(word.toUpperCase());
        if (!morse.trim()) continue;
        setCurrentWord(word.toUpperCase());
        scheduleLetterEvents(word.toUpperCase(), morse, wpmRef.current);
        const pb = playMorse(morse, {
          wpm: wpmRef.current,
          frequency: freqRef.current,
          onSignal: (on) => {
            try {
              onSignalRef.current?.(on);
            } catch {
              /* visuals must never break playback */
            }
          },
        });
        playbackRef.current = pb;
        await pb.finished;
        playbackRef.current = null;
        clearLetterEvents();
      }
    } finally {
      pumpingRef.current = false;
      setQueued(queueRef.current.size);
    }
  }, [scheduleLetterEvents, clearLetterEvents]);

  const startRecognition = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (!finalText.trim()) return;

      // Consume only the words we haven't queued yet.
      const prev = consumedRef.current;
      const next = accRef.current
        ? `${accRef.current} ${finalText.trim()}`
        : finalText.trim();
      accRef.current = next;
      const { words, consumed } = newWords(next, prev);
      consumedRef.current = consumed;
      if (words.length === 0) return;

      const stamped: LiveWord[] = words.map((t) => ({
        id: ++idRef.current,
        text: t.toUpperCase(),
        morse: textToMorse(t.toUpperCase()),
      }));
      stamped.forEach((lw) => queueRef.current.push(lw.text));
      setQueued(queueRef.current.size);
      setFeed((f) => [...f, ...stamped].slice(-maxFeedRef.current));
      void pump();
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Mic blocked — allow microphone access and try again.");
        wantListeningRef.current = false;
      } else if (e.error && e.error !== "aborted" && e.error !== "no-speech") {
        setError("Speech hiccup — tap to stop and start again.");
      }
      // "no-speech"/"aborted" just end this session; onend restarts if wanted.
    };

    rec.onend = () => {
      recRef.current = null;
      setInterim("");
      if (wantListeningRef.current) {
        // Chrome stops recognition on silence — bring it back.
        window.setTimeout(() => {
          if (wantListeningRef.current) startRecognition();
        }, 250);
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Couldn't start listening.");
      recRef.current = null;
      wantListeningRef.current = false;
      setListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pump]);

  const start = useCallback(() => {
    if (!supported || wantListeningRef.current) return;
    setError(null);
    setFeed([]);
    setQueued(0);
    consumedRef.current = 0;
    accRef.current = "";
    queueRef.current.clear();
    wantListeningRef.current = true;
    startRecognition();
  }, [supported, startRecognition]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    playbackRef.current?.stop();
    playbackRef.current = null;
    pumpingRef.current = false;
    clearLetterEvents();
    queueRef.current.clear();
    setQueued(0);
    setInterim("");
    setListening(false);
    try {
      onSignalRef.current?.(false);
    } catch {
      /* noop */
    }
  }, [clearLetterEvents]);

  useEffect(
    () => () => {
      wantListeningRef.current = false;
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
      playbackRef.current?.stop();
    },
    []
  );

  return { supported, listening, interim, feed, queued, error, start, stop, currentLetter, currentWord };
}

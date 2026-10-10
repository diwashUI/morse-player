"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal structural types for the Web Speech API — TS's DOM lib doesn't
// ship these, and we only touch a small surface.
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

/**
 * Mic → text via the browser's free Web Speech API (Chrome/Edge only).
 * Streams interim results live; accumulates final transcripts.
 * `supported` is false where the API doesn't exist — hide the mic there.
 */
export function useSpeechInput() {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // final, accumulated
  const [interim, setInterim] = useState(""); // in-progress guess
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const start = useCallback(() => {
    if (!supported || recRef.current) return;
    setError(null);
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
      if (finalText.trim()) {
        setTranscript((t) => (t ? `${t} ${finalText.trim()}` : finalText.trim()));
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Mic blocked — allow microphone access and try again.");
      } else if (e.error && e.error !== "aborted" && e.error !== "no-speech") {
        setError("Speech hiccup — tap the mic and try again.");
      }
      setListening(false);
      recRef.current = null;
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Couldn't start listening.");
      recRef.current = null;
    }
  }, [supported]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  useEffect(
    () => () => {
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
    },
    []
  );

  return { supported, listening, transcript, interim, error, start, stop, reset };
}

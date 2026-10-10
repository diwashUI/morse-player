"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playMorse, type Playback } from "../lib/audio";

export type PlayerStatus = "idle" | "playing";

interface UseMorsePlayerOpts {
  wpm: number;
  frequency?: number;
  /** Extra listener for tone on/off — torch, hand animation, etc. */
  onSignal?: (on: boolean) => void;
}

/**
 * State machine around playMorse(): exactly one playback at a time,
 * restart-safe, and always cleaned up on unmount.
 */
export function useMorsePlayer({ wpm, frequency = 650, onSignal }: UseMorsePlayerOpts) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [signalOn, setSignalOn] = useState(false);
  const playbackRef = useRef<Playback | null>(null);
  // Ref so the latest listener is used without re-creating play().
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  const stop = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setStatus("idle");
    setSignalOn(false);
  }, []);

  const play = useCallback(
    (morse: string) => {
      if (!morse.trim()) return;
      playbackRef.current?.stop(); // restart if already playing
      setStatus("playing");
      const pb = playMorse(morse, {
        wpm,
        frequency,
        onSignal: (on) => {
          setSignalOn(on);
          try {
            onSignalRef.current?.(on);
          } catch {
            /* visual listeners must never break playback */
          }
        },
      });
      playbackRef.current = pb;
      void pb.finished.then(() => {
        if (playbackRef.current === pb) {
          playbackRef.current = null;
          setStatus("idle");
          setSignalOn(false);
        }
      });
    },
    [wpm, frequency]
  );

  useEffect(
    () => () => {
      playbackRef.current?.stop();
    },
    []
  );

  return { status, signalOn, play, stop, isPlaying: status === "playing" };
}

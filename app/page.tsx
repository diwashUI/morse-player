"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MorseInput from "@/components/MorseInput";
import MorseOutput from "@/components/MorseOutput";
import ReferenceChart from "@/components/ReferenceChart";
import PlaybackControls from "@/components/PlaybackControls";
import TappingHand from "@/components/TappingHand";
import VoiceButton from "@/components/VoiceButton";
import TorchToggle, { type TorchState } from "@/components/TorchToggle";
import LiveTransmitter from "@/components/LiveTransmitter";
import { morseToText, textToMorse } from "@/lib/morse";
import { requestTorch, type Torch } from "@/lib/torch";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useSpeechInput } from "@/hooks/useSpeechInput";

export default function Home() {
  const [text, setText] = useState("HELLO WORLD");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [tab, setTab] = useState<"translator" | "live">("translator");
  const [wpm, setWpm] = useState(20);
  const [torchState, setTorchState] = useState<TorchState>("off");
  const torchRef = useRef<Torch | null>(null);

  // Recompute only when text or mode changes — useMemo, not on every render.
  const result = useMemo(
    () => (mode === "encode" ? textToMorse(text) : morseToText(text)),
    [text, mode]
  );
  // In decode mode the result is plain text — convert back to morse to play it.
  const morseToPlay = mode === "encode" ? result : textToMorse(result);

  // Torch follows the same on/off signal as the beeps and the light.
  // Fire-and-forget: torch hardware is slow, never block the signal on it.
  const driveTorch = useCallback((on: boolean) => {
    const t = torchRef.current;
    if (!t) return;
    void (on ? t.on() : t.off());
  }, []);

  const player = useMorsePlayer({ wpm, onSignal: driveTorch });
  const speech = useSpeechInput();

  // While the mic is live, it owns the text field: stream interim
  // guesses, keep the final transcript when it stops.
  useEffect(() => {
    if (!speech.listening && !speech.transcript && !speech.interim) return;
    const live =
      speech.transcript +
      (speech.interim ? (speech.transcript ? " " : "") + speech.interim : "");
    setText(live.toUpperCase());
  }, [speech.transcript, speech.interim, speech.listening]);

  const startVoice = () => {
    if (mode !== "encode") {
      setMode("encode");
      setText("");
    }
    speech.reset();
    speech.start();
  };

  const toggleTorch = async () => {
    if (torchState === "on") {
      torchRef.current?.dispose();
      torchRef.current = null;
      setTorchState("off");
      return;
    }
    const t = await requestTorch();
    if (!t) {
      setTorchState("unsupported");
      return;
    }
    torchRef.current = t;
    setTorchState("on");
  };

  // Never leave the camera on after leaving the page.
  useEffect(
    () => () => {
      torchRef.current?.dispose();
      torchRef.current = null;
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            Day 2 · sound + voice + flash · <span className="text-red-400">live TX</span>
          </p>
          <h1 className="mt-2 text-5xl font-black tracking-tight">
            Morse Code <span className="text-amber-400">Player</span>
          </h1>
          <p className="mt-3 text-zinc-400">
            Type it, speak it, or tap the chart — hear it, see it, flash it.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        {/* Tab switcher */}
        <div className="flex justify-center gap-2">
          {(
            [
              ["translator", "Translator"],
              ["live", "🔴 Live TX"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                if (key === tab) return;
                player.stop();
                speech.stop();
                setTab(key);
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                tab === key
                  ? "bg-amber-400 text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "live" ? (
          <LiveTransmitter wpm={wpm} onSignal={driveTorch} />
        ) : (
          <>
        <MorseInput
          value={text}
          onChange={setText}
          mode={mode}
          onToggleMode={() => {
            setMode((m) => (m === "encode" ? "decode" : "encode"));
            setText("");
          }}
          voiceButton={
            <VoiceButton
              supported={speech.supported}
              listening={speech.listening}
              onStart={startVoice}
              onStop={speech.stop}
            />
          }
        />
        {speech.listening && (
          <p className="animate-pulse text-center text-sm text-red-400">
            🎙 Listening… tap the mic to stop
          </p>
        )}
        {speech.error && (
          <p className="text-center text-sm text-red-400">{speech.error}</p>
        )}

        <MorseOutput result={result} />

        <TappingHand on={player.signalOn} />
        <PlaybackControls
          isPlaying={player.isPlaying}
          onPlay={() => player.play(morseToPlay)}
          onStop={player.stop}
          wpm={wpm}
          onWpmChange={setWpm}
          disabled={!morseToPlay.trim()}
        />
        <div className="flex justify-center">
          <TorchToggle state={torchState} onToggle={toggleTorch} />
        </div>

        <ReferenceChart onPlayCode={(code) => player.play(code)} />
          </>
        )}
      </main>

      <footer className="pb-10 text-center text-xs text-zinc-600">
        Built while learning · Next.js + TypeScript + Tailwind + Web Audio
      </footer>
    </div>
  );
}

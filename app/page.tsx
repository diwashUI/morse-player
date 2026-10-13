"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LiveTransmitter from "@/components/LiveTransmitter";
import TorchToggle, { type TorchState } from "@/components/TorchToggle";
import { requestTorch, type Torch } from "@/lib/torch";

export default function Home() {
  const [wpm, setWpm] = useState(20);
  const [torchState, setTorchState] = useState<TorchState>("off");
  const torchRef = useRef<Torch | null>(null);

  // Torch follows the same on/off signal as the beeps and the hand.
  // Fire-and-forget: torch hardware is slow, never block the signal on it.
  const driveTorch = useCallback((on: boolean) => {
    const t = torchRef.current;
    if (!t) return;
    void (on ? t.on() : t.off());
  }, []);

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
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-6 py-10 text-center">
          <p className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Real-time voice → Morse
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-white">
            Morse <span className="text-red-500">TX</span>
          </h1>
          <p className="mt-3 text-[15px] text-zinc-400">
            Speak, and your words go out as Morse code — live.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <LiveTransmitter wpm={wpm} onWpmChange={setWpm} onSignal={driveTorch} />
        <div className="flex justify-center">
          <TorchToggle state={torchState} onToggle={toggleTorch} />
        </div>
      </main>

      <footer className="pb-10 text-center text-xs text-zinc-600">
        Built while learning · Next.js + TypeScript + Tailwind + Web Audio
      </footer>
    </div>
  );
}

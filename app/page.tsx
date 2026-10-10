"use client";

import { useMemo, useState } from "react";
import MorseInput from "@/components/MorseInput";
import MorseOutput from "@/components/MorseOutput";
import ReferenceChart from "@/components/ReferenceChart";
import { morseToText, textToMorse } from "@/lib/morse";

export default function Home() {
  const [text, setText] = useState("HELLO WORLD");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  // Recompute only when text or mode changes — useMemo, not on every render.
  const result = useMemo(
    () => (mode === "encode" ? textToMorse(text) : morseToText(text)),
    [text, mode]
  );

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Day 1 · encode + decode</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight">
            Morse Code <span className="text-amber-400">Player</span>
          </h1>
          <p className="mt-3 text-zinc-400">Type text, get morse. Paste morse, get text. Sound arrives tomorrow.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <MorseInput
          value={text}
          onChange={setText}
          mode={mode}
          onToggleMode={() => {
            setMode((m) => (m === "encode" ? "decode" : "encode"));
            setText("");
          }}
        />
        <MorseOutput result={result} />
        <ReferenceChart />
      </main>

      <footer className="pb-10 text-center text-xs text-zinc-600">
        Built while learning · Next.js + TypeScript + Tailwind
      </footer>
    </div>
  );
}

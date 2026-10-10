"use client";

import type { ReactNode } from "react";

interface MorseInputProps {
  value: string;
  onChange: (v: string) => void;
  mode: "encode" | "decode";
  onToggleMode: () => void;
  voiceButton?: ReactNode;
}

export default function MorseInput({ value, onChange, mode, onToggleMode, voiceButton }: MorseInputProps) {
  const btn = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
      active ? "bg-amber-400 text-black" : "text-zinc-400 hover:text-zinc-200"
    }`;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-full border border-zinc-700 p-1">
          <button onClick={() => mode !== "encode" && onToggleMode()} className={btn(mode === "encode")}>
            Text → Morse
          </button>
          <button onClick={() => mode !== "decode" && onToggleMode()} className={btn(mode === "decode")}>
            Morse → Text
          </button>
        </div>
        <span className="text-xs text-zinc-500">{value.length} chars</span>
        {voiceButton}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={mode === "encode" ? "Type something… e.g. HELLO WORLD" : "Paste morse… e.g. .... . .-.. .-.. ---"}
        className="w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-lg outline-none placeholder:text-zinc-600 focus:border-amber-400"
      />
    </section>
  );
}

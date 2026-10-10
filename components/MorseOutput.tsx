"use client";

import { useState } from "react";

export default function MorseOutput({ result }: { result: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Morse code</h2>
        <button
          onClick={copy}
          disabled={!result}
          className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm font-semibold transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-40"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="min-h-24 break-words font-mono text-2xl leading-relaxed text-amber-300">
        {result || <span className="text-zinc-600">Your morse appears here…</span>}
      </p>
      <p className="mt-4 text-xs text-zinc-600">🔊 Sound player lands on Day 2</p>
    </section>
  );
}

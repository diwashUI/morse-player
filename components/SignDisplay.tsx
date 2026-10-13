"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Letter currently being beeped (A-Z, 0-9), or null when idle. */
  letter: string | null;
  /** Full word being transmitted, for the highlight strip. */
  word: string | null;
}

const DEMO_WORD = "HELLO";
const DEMO_MS = 950;

/**
 * Fingerspells the transmitted word in ASL: as each letter's tones play,
 * its handshape appears and the letter lights up in the word strip.
 * Non-alphabet characters (digits) fall back to a big letter tile —
 * we only ship A-Z handshape art.
 *
 * When idle, loops a slow HELLO demo so the page feels alive and
 * newcomers instantly get what the hand is for.
 */
export default function SignDisplay({ letter, word }: Props) {
  const idle = !letter && !word;
  const [demoIdx, setDemoIdx] = useState(0);

  useEffect(() => {
    if (!idle) return;
    const id = window.setInterval(
      () => setDemoIdx((i) => (i + 1) % DEMO_WORD.length),
      DEMO_MS
    );
    return () => window.clearInterval(id);
  }, [idle]);

  const showLetter = idle ? DEMO_WORD[demoIdx] : letter;
  const showWord = idle ? DEMO_WORD : word;
  const isAlpha = !!showLetter && /^[A-Z]$/.test(showLetter);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-3xl bg-[#141419] shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-900/10">
        {isAlpha ? (
          <img
            key={showLetter}
            src={`/signs/${showLetter!.toLowerCase()}.png`}
            alt={`ASL handshape for ${showLetter}`}
            className="animate-pop h-full w-full object-cover"
            draggable={false}
          />
        ) : showLetter ? (
          <span
            key={showLetter}
            className="animate-pop font-display text-7xl font-bold text-zinc-100"
          >
            {showLetter}
          </span>
        ) : null}
      </div>
      {showWord ? (
        <p className="font-mono text-xl tracking-[0.25em]">
          {[...showWord].map((ch, i) => {
            const active = idle ? i === demoIdx : ch === showLetter;
            return (
              <span
                key={i}
                className={active ? "text-red-600" : "text-zinc-300"}
              >
                {ch}
              </span>
            );
          })}
        </p>
      ) : null}
      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
        {idle ? "sign language · live demo" : "sign language"}
      </p>
    </div>
  );
}

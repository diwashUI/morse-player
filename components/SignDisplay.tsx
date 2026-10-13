"use client";

interface Props {
  /** Letter currently being beeped (A-Z, 0-9), or null when idle. */
  letter: string | null;
  /** Full word being transmitted, for the highlight strip. */
  word: string | null;
}

/**
 * Fingerspells the transmitted word in ASL: as each letter's tones play,
 * its handshape appears and the letter lights up in the word strip.
 * Non-alphabet characters (digits) fall back to a big letter tile —
 * we only ship A-Z handshape art.
 */
export default function SignDisplay({ letter, word }: Props) {
  const isAlpha = !!letter && /^[A-Z]$/.test(letter);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        {isAlpha ? (
          <img
            key={letter}
            src={`/signs/${letter!.toLowerCase()}.png`}
            alt={`ASL handshape for ${letter}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : letter ? (
          <span className="font-display text-7xl font-bold text-zinc-100">
            {letter}
          </span>
        ) : (
          <span className="px-6 text-center text-xs leading-relaxed text-zinc-600">
            the handshape
            <br />
            appears here
          </span>
        )}
      </div>
      {word ? (
        <p className="font-mono text-xl tracking-[0.25em]">
          {[...word].map((ch, i) => (
            <span
              key={i}
              className={
                ch === letter ? "text-red-300" : "text-zinc-600"
              }
            >
              {ch}
            </span>
          ))}
        </p>
      ) : (
        <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-600">
          sign language
        </p>
      )}
    </div>
  );
}

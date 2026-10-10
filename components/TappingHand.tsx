"use client";

interface TappingHandProps {
  on: boolean;
}

/**
 * A fist that punches the table on every beep — the hand-sign visual.
 * Driven by the same on/off signal as the audio, so dots look like
 * quick taps and dashes like long presses. Glow ring doubles as the
 * old signal light.
 */
export default function TappingHand({ on }: TappingHandProps) {
  return (
    <div className="flex flex-col items-center py-4" aria-hidden>
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full transition-all duration-75 ${
            on
              ? "bg-amber-400/25 shadow-[0_0_70px_25px_rgba(251,191,36,0.45)]"
              : "bg-transparent"
          }`}
        />
        <div
          className={`relative text-7xl transition-transform duration-75 ${
            on ? "translate-y-2 scale-125" : "translate-y-0 scale-100"
          }`}
        >
          👊
        </div>
      </div>
      <div className="mt-1 h-1 w-44 rounded-full bg-zinc-700" />
    </div>
  );
}

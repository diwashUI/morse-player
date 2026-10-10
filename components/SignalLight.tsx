"use client";

interface SignalLightProps {
  on: boolean;
}

/** The big lamp that flashes in sync with the beeps (and the torch). */
export default function SignalLight({ on }: SignalLightProps) {
  return (
    <div className="flex items-center justify-center py-4" aria-hidden>
      <div
        className={`h-20 w-20 rounded-full transition-all duration-75 ${
          on
            ? "scale-110 bg-amber-300 shadow-[0_0_70px_25px_rgba(251,191,36,0.45)]"
            : "bg-zinc-800 shadow-inner"
        }`}
      />
    </div>
  );
}

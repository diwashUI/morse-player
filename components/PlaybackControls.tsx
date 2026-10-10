"use client";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  wpm: number;
  onWpmChange: (wpm: number) => void;
  disabled?: boolean;
}

/** Play/stop + speed slider. Speed is PARIS words-per-minute (5–40). */
export default function PlaybackControls({
  isPlaying,
  onPlay,
  onStop,
  wpm,
  onWpmChange,
  disabled,
}: PlaybackControlsProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center gap-4">
        {isPlaying ? (
          <button
            onClick={onStop}
            className="rounded-full bg-red-500 px-8 py-3 text-lg font-bold text-white transition hover:bg-red-400"
          >
            ⏹ Stop
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={disabled}
            className="rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ▶ Play
          </button>
        )}
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="uppercase tracking-widest text-zinc-500">Speed</span>
            <span className="font-mono text-amber-300">{wpm} WPM</span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            value={wpm}
            onChange={(e) => onWpmChange(Number(e.target.value))}
            className="w-full accent-amber-400"
            aria-label="Playback speed in words per minute"
          />
        </div>
      </div>
    </section>
  );
}

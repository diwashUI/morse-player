"use client";

export type TorchState = "off" | "on" | "unsupported";

interface TorchToggleProps {
  state: TorchState;
  onToggle: () => void;
}

/**
 * Flashlight toggle — blinks the camera torch in sync with playback.
 * Only Android Chrome-ish devices have a torch; on anything else the
 * first tap discovers that and the toggle reports "unsupported".
 */
export default function TorchToggle({ state, onToggle }: TorchToggleProps) {
  if (state === "unsupported") {
    return (
      <span className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-500">
        🔦 no flash on this device
      </span>
    );
  }

  const on = state === "on";
  return (
    <button
      onClick={onToggle}
      title="Blink the camera flashlight with the code"
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        on ? "bg-amber-400 text-black" : "border border-zinc-700 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      🔦 Flash {on ? "on" : "off"}
    </button>
  );
}

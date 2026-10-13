"use client";

import { ZapIcon } from "@/components/icons";

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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-1.5 text-sm text-zinc-400">
        <ZapIcon className="h-4 w-4" />
        No flash on this device
      </span>
    );
  }

  const on = state === "on";
  return (
    <button
      onClick={onToggle}
      title="Blink the camera flashlight with the code"
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        on
          ? "bg-amber-400 text-zinc-900 shadow-sm"
          : "border border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
      }`}
    >
      <ZapIcon className="h-4 w-4" />
      Flash {on ? "on" : "off"}
    </button>
  );
}

"use client";

interface VoiceButtonProps {
  supported: boolean;
  listening: boolean;
  onStart: () => void;
  onStop: () => void;
}

/**
 * Mic button for speech-to-text. Renders nothing where the
 * Web Speech API doesn't exist (Firefox, Safari) — no dead UI.
 */
export default function VoiceButton({ supported, listening, onStart, onStop }: VoiceButtonProps) {
  if (!supported) return null;

  return (
    <button
      onClick={listening ? onStop : onStart}
      title={listening ? "Stop listening" : "Speak instead of typing"}
      aria-label={listening ? "Stop listening" : "Start voice input"}
      className={`relative rounded-full p-2.5 transition ${
        listening
          ? "bg-red-500 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {listening && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" aria-hidden />
      )}
      <svg
        className="relative h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="22" />
      </svg>
    </button>
  );
}

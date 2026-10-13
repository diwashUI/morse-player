"use client";

// Minimal stroke icons (lucide-style, hand-drawn paths) so the UI never
// depends on emoji. 24×24, stroke=currentColor.

interface IconProps {
  className?: string;
}

function Base({
  className = "h-4 w-4",
  children,
  filled = false,
}: IconProps & { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="22" />
    </Base>
  );
}

export function StopIcon({ className }: IconProps) {
  return (
    <Base className={className} filled>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Base>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <Base className={className} filled>
      <path d="M7 4.5v15l13-7.5z" />
    </Base>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M12 3v13" />
      <path d="m7 8 5-5 5 5" />
    </Base>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Base>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </Base>
  );
}

export function FileTextIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </Base>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Base>
  );
}

export function ZapIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </Base>
  );
}

export function FilmIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M2 9h5" />
      <path d="M2 15h5" />
      <path d="M17 9h5" />
      <path d="M17 15h5" />
    </Base>
  );
}

export function Spinner({ className = "h-4 w-4" }: IconProps) {
  return (
    <span
      className={`${className} animate-spin rounded-full border-2 border-zinc-400 border-t-transparent`}
      aria-hidden="true"
    />
  );
}

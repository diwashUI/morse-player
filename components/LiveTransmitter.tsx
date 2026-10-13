"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveTransmitter } from "@/hooks/useLiveTransmitter";

/** Live mic level bar — pure eye candy that says "we're listening". */
function MicMeter({ active }: { active: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !navigator.mediaDevices?.getUserMedia) return;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let dead = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (dead) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (dead) return;
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
          if (barRef.current) {
            barRef.current.style.width = `${Math.min(100, peak * 160).toFixed(1)}%`;
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* meter stays flat — recognition still works */
      }
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [active]);

  return (
    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
      <div ref={barRef} className="h-full w-0 rounded-full bg-red-400 transition-[width] duration-75" />
    </div>
  );
}

function useElapsed(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) {
      setSecs(0);
      return;
    }
    const t0 = Date.now();
    const id = window.setInterval(() => setSecs(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [running]);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  wpm: number;
  onSignal: (on: boolean) => void;
}

/**
 * Live Morse transmitter tab: talk → words stream out as Morse beeps
 * (and torch flashes) a few seconds behind your voice.
 */
export default function LiveTransmitter({ wpm, onSignal }: Props) {
  const tx = useLiveTransmitter({ wpm, onSignal });
  const elapsed = useElapsed(tx.listening);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [tx.feed]);

  if (!tx.supported) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
        <p className="text-lg font-semibold">Live transmitter needs Chrome or Edge</p>
        <p className="mt-2 text-sm text-zinc-400">
          Real-time speech recognition only exists in Chromium browsers — Safari
          and Firefox don't expose it. The translator tab works everywhere.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transmit button */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <button
          onClick={() => (tx.listening ? tx.stop() : tx.start())}
          aria-pressed={tx.listening}
          className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl transition-all ${
            tx.listening
              ? "animate-pulse bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
              : "bg-amber-400 text-black shadow-[0_0_30px_rgba(251,191,36,0.25)] hover:scale-105"
          }`}
        >
          {tx.listening ? "⏹" : "🎙"}
        </button>

        <div className="flex items-center gap-3">
          {tx.listening ? (
            <>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
                <span className="h-2 w-2 animate-ping rounded-full bg-red-400" />
                Live
              </span>
              <span className="font-mono text-sm text-zinc-400">{elapsed}</span>
            </>
          ) : (
            <span className="text-sm text-zinc-400">
              Tap to start transmitting — tap again to stop
            </span>
          )}
        </div>

        <MicMeter active={tx.listening} />

        {tx.queued > 0 && (
          <p className="text-xs text-amber-300/80">
            ▸▸ {tx.queued} word{tx.queued === 1 ? "" : "s"} queued behind you
          </p>
        )}
        {tx.error && <p className="text-sm text-red-400">{tx.error}</p>}
      </div>

      {/* Live feed */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Transmission log
        </p>
        <div ref={feedRef} className="h-56 space-y-2 overflow-y-auto pr-2">
          {tx.feed.length === 0 && !tx.interim && (
            <p className="text-sm text-zinc-600">
              Nothing transmitted yet. Speak naturally — words go out as Morse a
              few seconds behind your voice.
            </p>
          )}
          {tx.feed.map((w) => (
            <div key={w.id} className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">{w.text}</span>
              <span className="truncate font-mono text-sm text-amber-300/90">
                {w.morse}
              </span>
            </div>
          ))}
          {tx.interim && (
            <p className="animate-pulse text-sm italic text-zinc-500">
              hearing: {tx.interim}…
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-zinc-600">
        Transmitting at {wpm} WPM · torch flashes in sync if enabled
      </p>
    </div>
  );
}

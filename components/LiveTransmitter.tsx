"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TappingHand from "@/components/TappingHand";
import { useLiveTransmitter, type LiveWord } from "@/hooks/useLiveTransmitter";
import { playMorse, type Playback } from "@/lib/audio";
import {
  addTransmission,
  loadTransmissions,
  makeTransmission,
  persistTransmissions,
  removeTransmission,
  transmissionShareText,
  type Transmission,
} from "@/lib/transmissions";

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
      <div
        ref={barRef}
        className="h-full w-0 rounded-full bg-red-400 transition-[width] duration-75"
      />
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
    const id = window.setInterval(
      () => setSecs(Math.floor((Date.now() - t0) / 1000)),
      500
    );
    return () => window.clearInterval(id);
  }, [running]);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  wpm: number;
  onWpmChange: (wpm: number) => void;
  /** Fires on every tone on/off — page wires it to the torch. */
  onSignal: (on: boolean) => void;
}

/**
 * The whole app: talk → words stream out as Morse beeps (and torch
 * flashes) a few seconds behind your voice. Stopping saves the
 * transmission so it can be replayed or shared.
 */
export default function LiveTransmitter({ wpm, onWpmChange, onSignal }: Props) {
  const [signalOn, setSignalOn] = useState(false);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [lastTx, setLastTx] = useState<Transmission | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;

  // One signal path for live TX and replays: local light + torch.
  const driveSignal = useCallback((on: boolean) => {
    setSignalOn(on);
    try {
      onSignalRef.current(on);
    } catch {
      /* torch failures must never break the UI */
    }
  }, []);

  const tx = useLiveTransmitter({ wpm, onSignal: driveSignal });
  const elapsed = useElapsed(tx.listening);

  // Mirror the feed so handleStop can snapshot it synchronously.
  const feedRef = useRef<LiveWord[]>([]);
  feedRef.current = tx.feed;
  const feedBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = feedBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [tx.feed]);

  // Load saved transmissions on the client (SSR has no localStorage).
  useEffect(() => {
    setTransmissions(loadTransmissions());
  }, []);

  // --- replay of a saved transmission -------------------------------------
  const replayRef = useRef<Playback | null>(null);
  const stopReplay = useCallback(() => {
    replayRef.current?.stop();
    replayRef.current = null;
    setReplayingId(null);
    setSignalOn(false);
  }, []);

  const toggleReplay = useCallback(
    (t: Transmission) => {
      if (replayingId === t.id) {
        stopReplay();
        return;
      }
      stopReplay();
      const pb = playMorse(t.morse, { wpm: wpmRef.current, onSignal: driveSignal });
      replayRef.current = pb;
      setReplayingId(t.id);
      void pb.finished.then(() => {
        if (replayRef.current === pb) {
          replayRef.current = null;
          setReplayingId(null);
        }
      });
    },
    [replayingId, stopReplay, driveSignal]
  );

  useEffect(() => () => stopReplay(), [stopReplay]);

  // --- start / stop ---------------------------------------------------------
  const handleStart = () => {
    stopReplay();
    setLastTx(null);
    tx.start();
  };

  const handleStop = () => {
    const words = feedRef.current;
    tx.stop();
    if (words.length === 0) return;
    const t = makeTransmission(
      words.map((w) => w.text).join(" "),
      words.map((w) => w.morse).join(" / ")
    );
    setTransmissions((prev) => {
      const next = addTransmission(prev, t);
      persistTransmissions(next);
      return next;
    });
    setLastTx(t);
  };

  // --- share / copy / delete --------------------------------------------------
  const copyTx = useCallback(async (t: Transmission) => {
    try {
      await navigator.clipboard.writeText(transmissionShareText(t));
      setCopiedId(t.id);
      window.setTimeout(
        () => setCopiedId((c) => (c === t.id ? null : c)),
        2000
      );
    } catch {
      /* clipboard blocked */
    }
  }, []);

  const shareTx = useCallback(
    async (t: Transmission) => {
      const text = transmissionShareText(t);
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ title: "Morse TX transmission", text });
          return;
        } catch {
          /* cancelled — fall through to copy */
        }
      }
      await copyTx(t);
    },
    [copyTx]
  );

  const deleteTx = useCallback(
    (id: string) => {
      if (replayingId === id) stopReplay();
      setTransmissions((prev) => {
        const next = removeTransmission(prev, id);
        persistTransmissions(next);
        return next;
      });
      setLastTx((prev) => (prev?.id === id ? null : prev));
    },
    [replayingId, stopReplay]
  );

  if (!tx.supported) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
        <p className="text-lg font-semibold">Live transmitter needs Chrome or Edge</p>
        <p className="mt-2 text-sm text-zinc-400">
          Real-time speech recognition only exists in Chromium browsers — Safari
          and Firefox don't expose it. Open this page in Chrome to transmit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transmit card */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <button
          onClick={() => (tx.listening ? handleStop() : handleStart())}
          aria-pressed={tx.listening}
          className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl transition-all ${
            tx.listening
              ? "animate-pulse bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
              : "bg-red-400 text-black shadow-[0_0_30px_rgba(248,113,113,0.25)] hover:scale-105"
          }`}
        >
          {tx.listening ? "⏹" : "🎙"}
        </button>

        <div className="flex items-center gap-3">
          {tx.listening ? (
            <>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
                <span className="h-2 w-2 animate-ping rounded-full bg-red-400" />
                Transmitting
              </span>
              <span className="font-mono text-sm text-zinc-400">{elapsed}</span>
            </>
          ) : (
            <span className="text-sm text-zinc-400">
              Tap to transmit — tap again to stop & save
            </span>
          )}
        </div>

        <MicMeter active={tx.listening} />
        <TappingHand on={signalOn} />

        <label className="flex items-center gap-3 text-sm text-zinc-400">
          Speed
          <input
            type="range"
            min={5}
            max={40}
            value={wpm}
            onChange={(e) => onWpmChange(Number(e.target.value))}
            className="w-40 accent-red-400"
          />
          <span className="w-16 font-mono text-zinc-300">{wpm} WPM</span>
        </label>

        {tx.queued > 0 && (
          <p className="text-xs text-amber-300/80">
            ▸▸ {tx.queued} word{tx.queued === 1 ? "" : "s"} queued behind you
          </p>
        )}
        {tx.error && <p className="text-sm text-red-400">{tx.error}</p>}
      </div>

      {/* Live transmission log */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Transmission log
        </p>
        <div ref={feedBoxRef} className="h-48 space-y-2 overflow-y-auto pr-2">
          {tx.feed.length === 0 && !tx.interim && (
            <p className="text-sm text-zinc-600">
              Nothing transmitted yet. Speak naturally — words go out as Morse a
              few seconds behind your voice.
            </p>
          )}
          {tx.feed.map((w) => (
            <div key={w.id} className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">{w.text}</span>
              <span className="truncate font-mono text-sm text-red-300/90">
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

      {/* Just-saved transmission */}
      {lastTx && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/5 p-6">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-red-300/80">
            Transmission saved ✓
          </p>
          <p className="font-semibold">"{lastTx.text}"</p>
          <p className="mt-1 break-all font-mono text-sm text-red-300/80">
            {lastTx.morse}
          </p>
          <TxActions
            t={lastTx}
            copied={copiedId === lastTx.id}
            replaying={replayingId === lastTx.id}
            onShare={() => void shareTx(lastTx)}
            onCopy={() => void copyTx(lastTx)}
            onReplay={() => toggleReplay(lastTx)}
            onDelete={() => deleteTx(lastTx.id)}
          />
        </div>
      )}

      {/* History */}
      {transmissions.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
            Past transmissions
          </p>
          <div className="space-y-3">
            {transmissions.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-zinc-800/80 p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-semibold">"{t.text}"</p>
                  <p className="shrink-0 text-xs text-zinc-500">{fmtDate(t.createdAt)}</p>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-zinc-500">
                  {t.morse}
                </p>
                <TxActions
                  t={t}
                  copied={copiedId === t.id}
                  replaying={replayingId === t.id}
                  onShare={() => void shareTx(t)}
                  onCopy={() => void copyTx(t)}
                  onReplay={() => toggleReplay(t)}
                  onDelete={() => deleteTx(t.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TxActions({
  copied,
  replaying,
  onShare,
  onCopy,
  onReplay,
  onDelete,
}: {
  t: Transmission;
  copied: boolean;
  replaying: boolean;
  onShare: () => void;
  onCopy: () => void;
  onReplay: () => void;
  onDelete: () => void;
}) {
  const btn =
    "rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button className={btn} onClick={onShare}>
        ⤴ Share
      </button>
      <button className={btn} onClick={onCopy}>
        {copied ? "✓ Copied" : "⧉ Copy"}
      </button>
      <button className={btn} onClick={onReplay}>
        {replaying ? "⏹ Stop" : "▶ Replay"}
      </button>
      <button
        className="rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

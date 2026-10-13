"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SignDisplay from "@/components/SignDisplay";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  MicIcon,
  PlayIcon,
  ShareIcon,
  Spinner,
  StopIcon,
  TrashIcon,
} from "@/components/icons";
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
import { downloadBlob, morseToWavBlob } from "@/lib/wav";

/** Live mic level bar. */
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
    <div className="h-1 w-36 overflow-hidden rounded-full bg-white/10">
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

const card =
  "rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8";
const sectionLabel =
  "mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500";

interface Props {
  wpm: number;
  onWpmChange: (wpm: number) => void;
  /** Fires on every tone on/off — page wires it to the torch. */
  onSignal: (on: boolean) => void;
}

/**
 * The whole app: talk → words stream out as Morse beeps (and torch
 * flashes) a few seconds behind your voice, fingerspelled in sign
 * language as they go. Stopping saves the transmission — replay it,
 * download it as audio, or share it anywhere.
 */
export default function LiveTransmitter({ wpm, onWpmChange, onSignal }: Props) {
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [lastTx, setLastTx] = useState<Transmission | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;

  // Signal path for live TX and replays — page wires it to the torch.
  const driveSignal = useCallback((on: boolean) => {
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

  // --- replay of a saved transmission --------------------------------------
  const replayRef = useRef<Playback | null>(null);
  const stopReplay = useCallback(() => {
    replayRef.current?.stop();
    replayRef.current = null;
    setReplayingId(null);
  }, []);

  const toggleReplay = useCallback(
    (t: Transmission) => {
      if (replayingId === t.id) {
        stopReplay();
        return;
      }
      stopReplay();
      const pb = playMorse(t.morse, {
        wpm: wpmRef.current,
        onSignal: driveSignal,
      });
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

  // --- share / copy / download / delete --------------------------------------
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

  const wavFileFor = useCallback(async (t: Transmission): Promise<File> => {
    const blob = await morseToWavBlob(t.morse, wpmRef.current);
    return new File([blob], `morse-tx-${t.id}.wav`, { type: "audio/wav" });
  }, []);

  const shareTx = useCallback(
    async (t: Transmission) => {
      const text = transmissionShareText(t);
      // Prefer sharing the real audio file (WhatsApp, Drive, …).
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function"
      ) {
        try {
          setBusyId(t.id);
          const file = await wavFileFor(t);
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "Morse TX transmission",
              text,
            });
            return;
          }
        } catch {
          /* cancelled or failed — fall through */
        } finally {
          setBusyId(null);
        }
      }
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
    [copyTx, wavFileFor]
  );

  const downloadWav = useCallback(
    async (t: Transmission) => {
      try {
        setBusyId(t.id);
        const blob = await morseToWavBlob(t.morse, wpmRef.current);
        downloadBlob(blob, `morse-tx-${t.id}.wav`);
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  const downloadTxt = useCallback((t: Transmission) => {
    downloadBlob(
      new Blob([transmissionShareText(t)], { type: "text/plain" }),
      `morse-tx-${t.id}.txt`
    );
  }, []);

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

  const actionsFor = (t: Transmission) => (
    <TxActions
      busy={busyId === t.id}
      copied={copiedId === t.id}
      replaying={replayingId === t.id}
      onShare={() => void shareTx(t)}
      onCopy={() => void copyTx(t)}
      onReplay={() => toggleReplay(t)}
      onDownloadWav={() => void downloadWav(t)}
      onDownloadTxt={() => downloadTxt(t)}
      onDelete={() => deleteTx(t.id)}
    />
  );

  if (!tx.supported) {
    return (
      <div className={card}>
        <p className="text-center text-lg font-semibold text-zinc-100">
          Live transmission needs Chrome or Edge
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-400">
          Real-time speech recognition only exists in Chromium browsers — Safari
          and Firefox don't expose it. Open this page in Chrome to transmit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Transmit console */}
      <div className={`${card} flex flex-col items-center gap-5`}>
        <button
          onClick={() => (tx.listening ? handleStop() : handleStart())}
          aria-pressed={tx.listening}
          aria-label={tx.listening ? "Stop transmitting" : "Start transmitting"}
          className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
            tx.listening
              ? "animate-pulse bg-red-500 text-white shadow-[0_0_36px_rgba(239,68,68,0.45)]"
              : "bg-zinc-100 text-zinc-900 shadow-[0_0_24px_rgba(255,255,255,0.12)] hover:scale-105 hover:bg-white"
          }`}
        >
          {tx.listening ? (
            <StopIcon className="h-8 w-8" />
          ) : (
            <MicIcon className="h-8 w-8" />
          )}
        </button>

        <div className="flex items-center gap-3">
          {tx.listening ? (
            <>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-400" />
                Transmitting
              </span>
              <span className="font-mono text-sm tabular-nums text-zinc-400">
                {elapsed}
              </span>
            </>
          ) : (
            <span className="text-sm text-zinc-400">
              Press to transmit — press again to stop and save
            </span>
          )}
        </div>

        <MicMeter active={tx.listening} />

        <SignDisplay letter={tx.currentLetter} word={tx.currentWord} />

        <label className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
            Speed
          </span>
          <input
            type="range"
            min={5}
            max={40}
            value={wpm}
            onChange={(e) => onWpmChange(Number(e.target.value))}
            className="w-40 accent-red-500"
            aria-label="Transmission speed in words per minute"
          />
          <span className="w-16 font-mono text-sm tabular-nums text-zinc-300">
            {wpm} WPM
          </span>
        </label>

        {tx.queued > 0 && (
          <p className="text-xs text-zinc-400">
            {tx.queued} word{tx.queued === 1 ? "" : "s"} queued behind you
          </p>
        )}
        {tx.error && <p className="text-sm text-red-400">{tx.error}</p>}
      </div>

      {/* Transmission log */}
      <div className={card}>
        <p className={sectionLabel}>Transmission log</p>
        <div ref={feedBoxRef} className="h-44 space-y-2 overflow-y-auto pr-2">
          {tx.feed.length === 0 && !tx.interim && (
            <p className="text-sm leading-relaxed text-zinc-600">
              Nothing transmitted yet. Speak naturally — words go out as Morse a
              few seconds behind your voice, fingerspelled above as they play.
            </p>
          )}
          {tx.feed.map((w) => (
            <div
              key={w.id}
              className="flex items-baseline justify-between gap-4 border-b border-white/[0.04] pb-2"
            >
              <span className="font-medium text-zinc-100">{w.text}</span>
              <span className="truncate font-mono text-sm text-zinc-500">
                {w.morse}
              </span>
            </div>
          ))}
          {tx.interim && (
            <p className="animate-pulse text-sm italic text-zinc-500">
              Hearing: {tx.interim}…
            </p>
          )}
        </div>
      </div>

      {/* Just-saved transmission */}
      {lastTx && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 sm:p-8">
          <p className={`${sectionLabel} flex items-center gap-2 !text-red-300/80`}>
            <CheckIcon className="h-3.5 w-3.5" />
            Transmission saved
          </p>
          <p className="text-lg font-medium text-zinc-100">“{lastTx.text}”</p>
          <p className="mt-2 break-all font-mono text-sm leading-relaxed text-zinc-500">
            {lastTx.morse}
          </p>
          {actionsFor(lastTx)}
        </div>
      )}

      {/* History */}
      {transmissions.length > 0 && (
        <div className={card}>
          <p className={sectionLabel}>Past transmissions</p>
          <div className="space-y-3">
            {transmissions.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-medium text-zinc-100">
                    “{t.text}”
                  </p>
                  <p className="shrink-0 text-xs tabular-nums text-zinc-500">
                    {fmtDate(t.createdAt)}
                  </p>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-zinc-600">
                  {t.morse}
                </p>
                {actionsFor(t)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TxActions({
  busy,
  copied,
  replaying,
  onShare,
  onCopy,
  onReplay,
  onDownloadWav,
  onDownloadTxt,
  onDelete,
}: {
  busy: boolean;
  copied: boolean;
  replaying: boolean;
  onShare: () => void;
  onCopy: () => void;
  onReplay: () => void;
  onDownloadWav: () => void;
  onDownloadTxt: () => void;
  onDelete: () => void;
}) {
  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-50";
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button className={btn} onClick={onShare} disabled={busy}>
        {busy ? <Spinner /> : <ShareIcon />}
        {busy ? "Preparing…" : "Share"}
      </button>
      <button className={btn} onClick={onReplay}>
        {replaying ? <StopIcon /> : <PlayIcon />}
        {replaying ? "Stop" : "Replay"}
      </button>
      <button className={btn} onClick={onDownloadWav} disabled={busy}>
        {busy ? <Spinner /> : <DownloadIcon />}
        Audio
      </button>
      <button className={btn} onClick={onDownloadTxt}>
        <FileTextIcon />
        Text
      </button>
      <button className={btn} onClick={onCopy}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-white/[0.05] hover:text-red-400"
        onClick={onDelete}
      >
        <TrashIcon />
        Delete
      </button>
    </div>
  );
}

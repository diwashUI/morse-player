// Transmission → shareable video.
//
// Renders a square video of a transmission: each letter's ASL handshape
// drawn in sync with its Morse beeps, the word strip highlighting the
// current letter, and the real beep audio. Browser only (canvas +
// MediaRecorder). The hand signs travel *inside* the download.

import { textToMorse } from "./morse";
import { morseToWavBlob } from "./wav";
import { autoWpmForWord, wordTiming, type LetterEvent } from "./letterTiming";

export interface SignVideoOpts {
  /** Pace each word so every hand sign is readable (default true). */
  autoSpeed?: boolean;
  /** WPM when autoSpeed is false. */
  manualWpm?: number;
  /** Canvas size in px (default 720). */
  size?: number;
  /** (phase, 0..1) — "loading" while preparing, "recording" while capturing. */
  onProgress?: (phase: "loading" | "recording", ratio: number) => void;
}

export interface SignVideoResult {
  blob: Blob;
  /** "mp4" or "webm" — use for the file extension. */
  ext: string;
}

interface WordPlan {
  word: string;
  wpm: number;
  startMs: number;
  events: LetterEvent[];
  totalMs: number;
}

const WORD_GAP_MS = 700;
const SIZE = 720;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`couldn't load ${src}`));
    img.src = src;
  });
}

function pickMimeType(): { mime: string; ext: string } {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("video recording isn't supported in this browser");
  }
  const candidates: Array<[string, string]> = [
    ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9,opus", "webm"],
    ["video/webm", "webm"],
  ];
  for (const [mime, ext] of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
    } catch {
      /* keep looking */
    }
  }
  return { mime: "", ext: "webm" };
}

/**
 * Render `text` to a video blob. Resolves when the (real-time) recording
 * finishes — keep the tab focused while it runs.
 */
export async function transmissionToVideo(
  text: string,
  opts: SignVideoOpts = {}
): Promise<SignVideoResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("video rendering needs a browser");
  }
  const { autoSpeed = true, manualWpm = 12, size = SIZE, onProgress } = opts;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new Error("nothing to render");

  onProgress?.("loading", 0);

  // --- plan the timeline -------------------------------------------------
  const plans: WordPlan[] = [];
  let cursor = 0;
  const audioCtx = new AudioContext();
  try {
    const buffers: AudioBuffer[] = [];
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi].toUpperCase();
      const wpm = autoSpeed ? autoWpmForWord(word) : manualWpm;
      const morse = textToMorse(word);
      const { events, totalMs } = wordTiming(word, morse, wpm);
      plans.push({ word, wpm, startMs: cursor, events, totalMs });
      const wav = await morseToWavBlob(morse, wpm);
      const buf = await audioCtx.decodeAudioData(await wav.arrayBuffer());
      buffers.push(buf);
      cursor += totalMs + WORD_GAP_MS;
      onProgress?.("loading", 0.5 * ((wi + 1) / words.length));
    }
    const totalMs = cursor - WORD_GAP_MS + 500; // tail

    // Master audio: words back-to-back with gaps.
    const sampleRate = 44100;
    const master = audioCtx.createBuffer(
      1,
      Math.ceil((sampleRate * totalMs) / 1000),
      sampleRate
    );
    const out = master.getChannelData(0);
    plans.forEach((p, i) => {
      const src = buffers[i].getChannelData(0);
      const off = Math.floor((sampleRate * p.startMs) / 1000);
      const len = Math.min(src.length, out.length - off);
      for (let s = 0; s < len; s++) out[off + s] += src[s];
    });

    // --- preload sign art --------------------------------------------------
    const needed = new Set<string>();
    plans.forEach((p) =>
      [...p.word].forEach((ch) => {
        if (/^[A-Z]$/.test(ch)) needed.add(ch.toLowerCase());
      })
    );
    const art = new Map<string, HTMLImageElement>();
    const list = [...needed];
    for (let i = 0; i < list.length; i++) {
      art.set(list[i], await loadImage(`/signs/${list[i]}.png`));
      onProgress?.("loading", 0.5 + 0.5 * ((i + 1) / Math.max(1, list.length)));
    }

    // --- canvas + recorder ---------------------------------------------------
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");

    const drawAt = (tMs: number) => {
      // White theme, matching the site.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Header.
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(size / 2 - 118, 64, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#18181b";
      ctx.font = "700 30px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("MORSE TX", size / 2 - 100, 64);

      // Current word + letter.
      let curWord = plans[0].word;
      let curLetter: string | null = null;
      for (const p of plans) {
        if (tMs >= p.startMs) {
          curWord = p.word;
          curLetter = null;
          for (const e of p.events) {
            if (tMs >= p.startMs + e.startMs) curLetter = e.letter;
            else break;
          }
        } else break;
      }

      // Sign art (or big letter fallback for digits).
      const S = size * 0.52;
      const sx = (size - S) / 2;
      const sy = size * 0.16;
      const img = curLetter ? art.get(curLetter.toLowerCase()) : undefined;
      ctx.save();
      ctx.beginPath();
      const r = 36;
      if (typeof ctx.roundRect === "function") ctx.roundRect(sx, sy, S, S, r);
      else ctx.rect(sx, sy, S, S);
      ctx.clip();
      ctx.fillStyle = "#141419";
      ctx.fillRect(sx, sy, S, S);
      if (img) {
        ctx.drawImage(img, sx, sy, S, S);
      } else if (curLetter) {
        ctx.fillStyle = "#fafafa";
        ctx.font = `700 ${Math.floor(S * 0.5)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(curLetter, size / 2, sy + S / 2 + S * 0.05);
      }
      ctx.restore();

      // Word strip with highlight.
      ctx.font = "600 46px ui-monospace, monospace";
      ctx.textAlign = "center";
      const letters = [...curWord];
      const widths = letters.map((ch) => ctx.measureText(ch).width + 18);
      const totalW = widths.reduce((a, b) => a + b, 0);
      let lx = (size - totalW) / 2;
      const ly = size * 0.82;
      letters.forEach((ch, i) => {
        ctx.fillStyle = ch === curLetter ? "#dc2626" : "#a1a1aa";
        ctx.fillText(ch, lx + widths[i] / 2, ly);
        lx += widths[i];
      });

      // Progress bar.
      const pr = Math.min(1, tMs / totalMs);
      ctx.fillStyle = "#f4f4f5";
      ctx.fillRect(0, size - 10, size, 10);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, size - 10, size * pr, 10);
    };

    drawAt(0);

    const { mime, ext } = pickMimeType();
    const stream = canvas.captureStream(30);
    const src = audioCtx.createBufferSource();
    src.buffer = master;
    const dest = audioCtx.createMediaStreamDestination();
    src.connect(dest);
    const combined = new MediaStream([
      ...stream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);
    const rec = new MediaRecorder(combined, mime ? { mimeType: mime } : undefined);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    const done = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });

    const t0 = audioCtx.currentTime;
    src.start();
    rec.start();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = (audioCtx.currentTime - t0) * 1000;
        drawAt(Math.min(t, totalMs));
        onProgress?.("recording", Math.min(1, t / totalMs));
        if (t < totalMs) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    // Small tail so the last frame lands.
    await new Promise((r) => setTimeout(r, 350));
    rec.stop();
    await done;

    try {
      src.stop();
    } catch {
      /* already stopped */
    }
    combined.getTracks().forEach((t) => t.stop());

    return { blob: new Blob(chunks, { type: mime || "video/webm" }), ext };
  } finally {
    void audioCtx.close().catch(() => {});
  }
}

// Morse → downloadable audio.
//
// encodeWav() is pure (unit-tested): mono float samples → 16-bit PCM WAV.
// morseToWavBlob() renders the same tone schedule as the live beep engine
// through an OfflineAudioContext — browser only.

import { morseToSchedule } from "./audio";

/** 16-bit PCM WAV file bytes for mono float samples. */
export function encodeWav(
  samples: Float32Array,
  sampleRate: number
): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true); // fmt chunk size
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate
  v.setUint16(32, 2, true); // block align
  v.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  v.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Render a morse string to a WAV blob — the transmission as an audio
 * file you can download or share. Must run in a browser.
 */
export async function morseToWavBlob(
  morse: string,
  wpm: number,
  frequency: number = 650
): Promise<Blob> {
  const events = morseToSchedule(morse, wpm);
  const sampleRate = 44100;
  const lastEndMs = events.length ? events[events.length - 1].endMs : 0;
  const ctx = new OfflineAudioContext(
    1,
    Math.ceil((sampleRate * (lastEndMs + 120)) / 1000),
    sampleRate
  );

  events.forEach((ev) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const start = ev.startMs / 1000;
    const end = ev.endMs / 1000;
    // Same 5ms ramps as the live engine — no clicks.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.9, start + 0.005);
    gain.gain.setValueAtTime(0.9, Math.max(start + 0.005, end - 0.005));
    gain.gain.linearRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.05);
  });

  const rendered = await ctx.startRendering();
  return new Blob([encodeWav(rendered.getChannelData(0), sampleRate)], {
    type: "audio/wav",
  });
}

/** Trigger a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

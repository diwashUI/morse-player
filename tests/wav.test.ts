import { describe, expect, it } from "vitest";
import { encodeWav } from "../lib/wav";

function str(v: DataView, off: number, n: number): string {
  return String.fromCharCode(
    ...Array.from({ length: n }, (_, i) => v.getUint8(off + i))
  );
}

describe("encodeWav", () => {
  it("writes a valid 16-bit PCM header", () => {
    const buf = encodeWav(new Float32Array([0, 0.5, -0.5, 1]), 8000);
    const v = new DataView(buf);
    expect(str(v, 0, 4)).toBe("RIFF");
    expect(str(v, 8, 4)).toBe("WAVE");
    expect(str(v, 12, 4)).toBe("fmt ");
    expect(v.getUint16(20, true)).toBe(1); // PCM
    expect(v.getUint16(22, true)).toBe(1); // mono
    expect(v.getUint32(24, true)).toBe(8000);
    expect(v.getUint16(34, true)).toBe(16);
    expect(str(v, 36, 4)).toBe("data");
    expect(v.getUint32(40, true)).toBe(8); // 4 samples × 2 bytes
    expect(buf.byteLength).toBe(44 + 8);
  });

  it("scales samples to int16", () => {
    const buf = encodeWav(new Float32Array([0.5, -0.5]), 8000);
    const v = new DataView(buf);
    expect(v.getInt16(44, true)).toBe(Math.floor(0.5 * 0x7fff));
    expect(v.getInt16(46, true)).toBe(Math.ceil(-0.5 * 0x8000));
  });

  it("clips samples to [-1, 1]", () => {
    const buf = encodeWav(new Float32Array([2, -2]), 8000);
    const v = new DataView(buf);
    expect(v.getInt16(44, true)).toBe(0x7fff);
    expect(v.getInt16(46, true)).toBe(-0x8000);
  });

  it("handles empty input", () => {
    const buf = encodeWav(new Float32Array([]), 44100);
    expect(buf.byteLength).toBe(44);
  });
});

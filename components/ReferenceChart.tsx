import { MORSE_TABLE } from "@/lib/morse";

// A–Z + 0–9 only: the letters people actually look up.
const ENTRIES = Object.entries(MORSE_TABLE).filter(([ch]) => /^[A-Z0-9]$/.test(ch));

export default function ReferenceChart() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-zinc-500">Reference chart</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ENTRIES.map(([ch, code]) => (
          <div key={ch} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center">
            <div className="text-lg font-bold">{ch}</div>
            <div className="font-mono text-sm text-amber-300">{code}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-600">🔊 Click-to-hear lands on Day 2</p>
    </section>
  );
}

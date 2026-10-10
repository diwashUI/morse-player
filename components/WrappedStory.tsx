"use client";

import { useCallback, useEffect, useState } from "react";
import { WrappedStats, hourLabel } from "@/lib/github";

const SLIDES = 7;

const BG = [
  "from-violet-700 via-fuchsia-700 to-orange-600",
  "from-emerald-600 via-teal-600 to-cyan-700",
  "from-indigo-600 via-blue-600 to-cyan-500",
  "from-amber-500 via-orange-600 to-rose-600",
  "from-purple-600 via-violet-600 to-indigo-700",
  "from-pink-600 via-rose-600 to-red-600",
  "from-slate-800 via-zinc-800 to-neutral-900",
];

function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <div className="animate-rise text-center" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-5xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-sm uppercase tracking-widest opacity-80">{label}</div>
    </div>
  );
}

export default function WrappedStory({ stats, onReset }: { stats: WrappedStats; onReset: () => void }) {
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((v) => Math.min(v + 1, SLIDES - 1)), []);
  const back = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, back]);

  const p = stats.profile;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${BG[i]} text-white transition-colors duration-500`}>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-6">
        {/* progress */}
        <div className="flex gap-1.5">
          {Array.from({ length: SLIDES }).map((_, s) => (
            <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className={`h-full rounded-full bg-white transition-all duration-300 ${s <= i ? "w-full" : "w-0"}`} />
            </div>
          ))}
        </div>

        {/* slide */}
        <div key={i} className="flex flex-1 flex-col items-center justify-center py-10">
          {i === 0 && (
            <>
              <img src={p.avatarUrl} alt={p.login} className="animate-pop h-32 w-32 rounded-full border-4 border-white/60 shadow-2xl" />
              <div className="animate-rise mt-6 text-center" style={{ animationDelay: "120ms" }}>
                <div className="text-sm uppercase tracking-[0.3em] opacity-80">Your</div>
                <h1 className="mt-1 text-6xl font-black tracking-tight">GitHub<br />Wrapped</h1>
                <p className="mt-4 text-lg opacity-90">{p.name} · @{p.login}</p>
                {p.bio && <p className="mx-auto mt-2 max-w-sm text-sm opacity-75">{p.bio}</p>}
              </div>
            </>
          )}

          {i === 1 && (
            <div className="grid w-full grid-cols-2 gap-8">
              <Stat value={String(p.publicRepos)} label="public repos" delay={0} />
              <Stat value={String(stats.totalStars)} label="stars earned" delay={120} />
              <Stat value={String(p.followers)} label="followers" delay={240} />
              <Stat value={p.accountYears === 0 ? "<1" : `${p.accountYears}y`} label="on GitHub" delay={360} />
            </div>
          )}

          {i === 2 && (
            <div className="w-full">
              <h2 className="animate-rise text-4xl font-black">Your languages</h2>
              <p className="animate-rise mt-1 opacity-80" style={{ animationDelay: "100ms" }}>What your repos are made of</p>
              <div className="mt-8 space-y-5">
                {stats.languages.length === 0 && <p className="opacity-80">No language data yet.</p>}
                {stats.languages.map((l, idx) => (
                  <div key={l.language} className="animate-rise" style={{ animationDelay: `${200 + idx * 120}ms` }}>
                    <div className="mb-1 flex justify-between text-sm font-semibold">
                      <span>{l.language}</span><span>{l.pct}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-black/25">
                      <div className="h-full rounded-full" style={{ width: `${l.pct}%`, background: l.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {i === 3 && (
            <div className="w-full">
              <h2 className="animate-rise text-4xl font-black">Greatest hits</h2>
              <p className="animate-rise mt-1 opacity-80" style={{ animationDelay: "100ms" }}>Your most-starred repos</p>
              <div className="mt-8 space-y-4">
                {stats.topRepos.length === 0 && <p className="opacity-80">No repos yet — your greatest hit is still ahead of you.</p>}
                {stats.topRepos.map((r, idx) => (
                  <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
                     className="animate-rise block rounded-2xl bg-black/25 p-5 backdrop-blur transition hover:bg-black/40"
                     style={{ animationDelay: `${200 + idx * 140}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">#{idx + 1} {r.name}</span>
                      <span className="text-lg font-bold">★ {r.stars}</span>
                    </div>
                    {r.description && <p className="mt-1 text-sm opacity-75">{r.description}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {i === 4 && (
            <div className="text-center">
              <p className="animate-rise text-sm uppercase tracking-[0.3em] opacity-80">Your rhythm</p>
              <h2 className="animate-rise mt-3 text-5xl font-black leading-tight" style={{ animationDelay: "120ms" }}>
                Peak coding hour:<br />{hourLabel(stats.peakHour)}
              </h2>
              <p className="animate-rise mt-4 text-xl opacity-90" style={{ animationDelay: "240ms" }}>
                Most active day: <span className="font-bold">{stats.peakDay}s</span>
              </p>
              <p className="animate-rise mt-2 text-sm opacity-70" style={{ animationDelay: "320ms" }}>
                Based on your recent public activity
              </p>
            </div>
          )}

          {i === 5 && (
            <div className="text-center">
              <p className="animate-rise text-sm uppercase tracking-[0.3em] opacity-80">Your developer persona</p>
              <h2 className="animate-rise mt-4 text-6xl font-black leading-tight" style={{ animationDelay: "150ms" }}>
                {stats.persona.title}
              </h2>
              <p className="animate-rise mx-auto mt-5 max-w-md text-xl opacity-90" style={{ animationDelay: "300ms" }}>
                {stats.persona.blurb}
              </p>
            </div>
          )}

          {i === 6 && (
            <div className="w-full text-center">
              <h2 className="animate-rise text-4xl font-black">That's a wrap 🎬</h2>
              <div className="animate-rise mx-auto mt-6 max-w-sm rounded-3xl bg-black/30 p-6 backdrop-blur" style={{ animationDelay: "150ms" }}>
                <img src={p.avatarUrl} alt={p.login} className="mx-auto h-20 w-20 rounded-full border-2 border-white/50" />
                <p className="mt-3 text-2xl font-black">{stats.persona.title}</p>
                <p className="mt-1 opacity-80">@{p.login}</p>
                <div className="mt-4 flex justify-center gap-6 text-sm">
                  <span><b>{stats.totalStars}</b> ★</span>
                  <span><b>{p.publicRepos}</b> repos</span>
                  <span><b>{stats.languages[0]?.language ?? "—"}</b> top lang</span>
                </div>
              </div>
              <p className="animate-rise mt-4 text-sm opacity-75" style={{ animationDelay: "250ms" }}>
                Screenshot this card for LinkedIn 📸
              </p>
              <button onClick={onReset}
                className="animate-rise mt-6 rounded-full bg-white px-8 py-3 font-bold text-black transition hover:scale-105"
                style={{ animationDelay: "350ms" }}>
                Wrap another developer
              </button>
            </div>
          )}
        </div>

        {/* nav */}
        <div className="flex items-center justify-between">
          <button onClick={back} disabled={i === 0}
            className="rounded-full bg-white/20 px-6 py-2.5 font-semibold backdrop-blur transition hover:bg-white/30 disabled:opacity-30">
            ← Back
          </button>
          <span className="text-sm opacity-70">{i + 1} / {SLIDES}</span>
          {i < SLIDES - 1 ? (
            <button onClick={next} className="rounded-full bg-white px-6 py-2.5 font-bold text-black transition hover:scale-105">
              Next →
            </button>
          ) : (
            <span className="w-24" />
          )}
        </div>
      </div>
    </div>
  );
}

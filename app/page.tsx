"use client";

import { useState } from "react";
import WrappedStory from "@/components/WrappedStory";
import type { WrappedStats } from "@/lib/github";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; stats: WrappedStats };

const SAMPLES = ["torvalds", "sindresorhus", "gaearon"];
const LOADING_LINES = ["Fetching your repos…", "Counting your stars…", "Reading your commit rhythm…", "Choosing your persona…"];

export default function Home() {
  const [username, setUsername] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [tick, setTick] = useState(0);

  async function generate(name: string) {
    const clean = name.trim();
    if (!clean) return;
    setState({ kind: "loading" });
    setTick(0);
    const timer = setInterval(() => setTick((t) => (t + 1) % LOADING_LINES.length), 1400);
    try {
      const res = await fetch(`/api/wrapped/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) setState({ kind: "error", message: data.error ?? "Something went wrong." });
      else setState({ kind: "done", stats: data });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the server. Try again." });
    } finally {
      clearInterval(timer);
    }
  }

  if (state.kind === "done") {
    return <WrappedStory stats={state.stats} onReset={() => { setUsername(""); setState({ kind: "idle" }); }} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6 text-center text-zinc-100">
      <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Spotify Wrapped, but for code</p>
      <h1 className="mt-3 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-6xl font-black tracking-tight text-transparent">
        GitHub Wrapped
      </h1>
      <p className="mt-4 max-w-md text-zinc-400">
        Type any GitHub username and get an animated year-in-review of their code. No login, no API keys.
      </p>

      {state.kind === "loading" ? (
        <div className="mt-10">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-fuchsia-400" />
          <p className="mt-4 text-zinc-400">{LOADING_LINES[tick]}</p>
        </div>
      ) : (
        <form className="mt-10 w-full max-w-md" onSubmit={(e) => { e.preventDefault(); generate(username); }}>
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="github username…"
              autoFocus
              className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-3 text-lg outline-none placeholder:text-zinc-600 focus:border-fuchsia-400"
            />
            <button type="submit" className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-3 text-lg font-bold transition hover:scale-105">
              Wrap it
            </button>
          </div>
          {state.kind === "error" && <p className="mt-3 text-sm text-red-400">{state.message}</p>}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <span>Try:</span>
            {SAMPLES.map((s) => (
              <button key={s} type="button" onClick={() => generate(s)}
                className="rounded-full border border-zinc-700 px-3 py-1 transition hover:border-fuchsia-400 hover:text-zinc-200">
                {s}
              </button>
            ))}
          </div>
        </form>
      )}

      <p className="mt-14 text-xs text-zinc-600">Built with Next.js · GitHub's free public API · Deployed on Vercel</p>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Couldn't create the poll.");
      else router.push(`/p/${data.id}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6 text-zinc-100">
      <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Live polls in 10 seconds</p>
      <h1 className="mt-3 bg-gradient-to-r from-lime-300 via-emerald-400 to-teal-400 bg-clip-text text-6xl font-black tracking-tight text-transparent">
        QuickPoll
      </h1>
      <p className="mt-4 max-w-md text-center text-zinc-400">
        Ask anything. Share the link. Watch votes roll in live.
      </p>

      <form onSubmit={create} className="mt-10 w-full max-w-md space-y-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Your question…"
          maxLength={140}
          autoFocus
          className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-lg outline-none placeholder:text-zinc-600 focus:border-emerald-400"
        />
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={o}
              onChange={(e) => setOptions((x) => x.map((v, idx) => (idx === i ? e.target.value : v)))}
              placeholder={`Option ${i + 1}`}
              maxLength={60}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 outline-none placeholder:text-zinc-600 focus:border-emerald-400"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => setOptions((x) => x.filter((_, idx) => idx !== i))}
                className="rounded-2xl border border-zinc-700 px-3 text-zinc-500 hover:border-red-400 hover:text-red-400"
                aria-label="Remove option"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button
            type="button"
            onClick={() => setOptions((o) => [...o, ""])}
            className="text-sm text-zinc-500 hover:text-emerald-300"
          >
            + add option
          </button>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 py-3 text-lg font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create poll →"}
        </button>
      </form>

      <p className="mt-14 text-xs text-zinc-600">Built with Next.js · Supabase · Deployed on Vercel</p>
    </div>
  );
}

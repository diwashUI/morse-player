"use client";

import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

interface Option {
  id: string;
  label: string;
  votes: number;
}
interface PollData {
  poll: { id: string; question: string };
  options: Option[];
}

export default function PollPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
        </div>
      }
    >
      <PollView />
    </Suspense>
  );
}

function PollView() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PollData | null>(null);
  const [error, setError] = useState("");
  const [voted, setVoted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load poll.");
        return;
      }
      setData(json);
    } catch {
      setError("Couldn't reach the server.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live results: refresh every 2.5s once you've voted.
  useEffect(() => {
    if (!voted) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [voted, load]);

  async function vote(optionId: string) {
    const res = await fetch(`/api/polls/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) {
      setVoted(optionId);
      load();
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const total = (data?.options ?? []).reduce((s, o) => s + o.votes, 0);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#09090b] px-6 py-12 text-zinc-100">
      <a href="/" className="text-sm uppercase tracking-[0.35em] text-zinc-500 hover:text-zinc-300">
        QuickPoll
      </a>

      {!data && !error && (
        <div className="mt-16 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
      )}
      {error && <p className="mt-16 text-red-400">{error}</p>}

      {data && (
        <div className="mt-8 w-full max-w-md">
          <h1 className="text-center text-4xl font-black">{data.poll.question}</h1>
          <p className="mt-2 text-center text-sm text-zinc-500">
            {total} vote{total === 1 ? "" : "s"}
            {voted ? " · live" : ""}
          </p>

          <div className="mt-8 space-y-3">
            {data.options.map((o) => {
              const pct = total === 0 ? 0 : Math.round((o.votes / total) * 100);
              return voted ? (
                <div
                  key={o.id}
                  className="animate-rise overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                >
                  <div className="flex justify-between px-5 pt-3 text-sm font-semibold">
                    <span>
                      {o.label} {voted === o.id && "✓"}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="m-3 mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  key={o.id}
                  onClick={() => vote(o.id)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-left text-lg transition hover:scale-[1.02] hover:border-emerald-400"
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={copyLink}
            className="mt-8 w-full rounded-full bg-white py-3 font-bold text-black transition hover:scale-[1.02]"
          >
            {copied ? "Link copied ✓" : "Copy share link 🔗"}
          </button>
          <a href="/" className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-300">
            Make your own poll →
          </a>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LiveTransmitter from "@/components/LiveTransmitter";
import SignDisplay from "@/components/SignDisplay";
import TorchToggle, { type TorchState } from "@/components/TorchToggle";
import {
  DownloadIcon,
  MicIcon,
  PlayIcon,
  ShareIcon,
  ZapIcon,
} from "@/components/icons";
import { requestTorch, type Torch } from "@/lib/torch";

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <a href="#top" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          <span className="font-display text-lg font-bold tracking-tight text-zinc-900">
            Morse TX
          </span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 sm:flex">
          <a href="#transmitter" className="transition hover:text-zinc-900">
            Transmitter
          </a>
          <a href="#features" className="transition hover:text-zinc-900">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-zinc-900">
            How it works
          </a>
        </div>
        <a
          href="#transmitter"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Start transmitting
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="blob absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-red-500/[0.08] blur-3xl" />
        <div className="blob2 absolute top-20 -right-24 h-80 w-80 rounded-full bg-red-500/[0.06] blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600 shadow-sm">
            <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="eq-bar"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
            Live voice → Morse
          </p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl">
            Speak. It transmits
            <br />
            Morse — <span className="text-red-600">live.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-600">
            Tap the mic and talk. Your words stream out as Morse code beeps a
            few seconds behind your voice — fingerspelled in sign language as
            they go.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#transmitter"
              className="rounded-full bg-zinc-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Start transmitting
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              How it works
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-200/60">
            <SignDisplay letter={null} word={null} />
            <p className="mt-4 text-center text-xs text-zinc-500">
              Live demo — the hand fingerspells every transmitted word
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    icon: <MicIcon className="h-5 w-5" />,
    title: "Real-time transmission",
    body: "Speech recognition turns your voice into Morse beeps live, trailing you like a broadcast. Auto-paced so it's always clear.",
  },
  {
    icon: (
      <img
        src="/signs/h.png"
        alt="ASL handshape for H"
        className="h-5 w-5 rounded object-cover"
      />
    ),
    title: "Sign-language fingerspelling",
    body: "Every letter appears as its ASL handshape the moment its tones play — watch your words signed as they're transmitted.",
  },
  {
    icon: <ZapIcon className="h-5 w-5" />,
    title: "Torch sync",
    body: "On phones with a flash, the camera light blinks the code in perfect sync with the beeps. Morse you can see across the room.",
  },
  {
    icon: <DownloadIcon className="h-5 w-5" />,
    title: "Download the moment",
    body: "Every transmission saves automatically. Export it as a video with the signs, as audio, or as plain text.",
  },
  {
    icon: <ShareIcon className="h-5 w-5" />,
    title: "Share anywhere",
    body: "Send the actual video or audio file straight to WhatsApp, Drive, or wherever — no account, no app needed to view it.",
  },
  {
    icon: <PlayIcon className="h-5 w-5" />,
    title: "Save & replay",
    body: "Your past transmissions live in your browser. Replay any of them, re-share them, or delete them — your call.",
  },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-zinc-50/70">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-red-600">
          Features
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          A transmitter, not a toy
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-zinc-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "1",
    title: "Tap & talk",
    body: "Hit the mic button and speak naturally — in Chrome or Edge on any device.",
  },
  {
    n: "2",
    title: "Watch it transmit",
    body: "Your words go out as Morse beeps, fingerspelled in sign language, torch flashing in sync.",
  },
  {
    n: "3",
    title: "Save & share",
    body: "Stop to save the transmission. Replay it, download the video, or share it anywhere in one tap.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-red-600">
          How it works
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Three steps to your first transmission
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 font-display text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-zinc-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [wpm, setWpm] = useState(12);
  const [torchState, setTorchState] = useState<TorchState>("off");
  const torchRef = useRef<Torch | null>(null);

  const driveTorch = useCallback((on: boolean) => {
    const t = torchRef.current;
    if (!t) return;
    void (on ? t.on() : t.off());
  }, []);

  const toggleTorch = async () => {
    if (torchState === "on") {
      torchRef.current?.dispose();
      torchRef.current = null;
      setTorchState("off");
      return;
    }
    const t = await requestTorch();
    if (!t) {
      setTorchState("unsupported");
      return;
    }
    torchRef.current = t;
    setTorchState("on");
  };

  useEffect(
    () => () => {
      torchRef.current?.dispose();
      torchRef.current = null;
    },
    []
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <Nav />
      <Hero />

      <main
        id="transmitter"
        className="mx-auto max-w-3xl scroll-mt-24 space-y-5 px-6 py-16"
      >
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-600">
            The transmitter
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Go live
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-600">
            Everything below is the real thing — transmit, save, download, and
            share right from this page.
          </p>
        </div>
        <LiveTransmitter wpm={wpm} onWpmChange={setWpm} onSignal={driveTorch} />
        <div className="flex justify-center">
          <TorchToggle state={torchState} onToggle={toggleTorch} />
        </div>
      </main>

      <Features />
      <HowItWorks />

      <section className="bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transmit?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-400">
            No sign-up, no download, no cost. Just your voice and a browser.
          </p>
          <a
            href="#transmitter"
            className="mt-8 inline-block rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Start transmitting
          </a>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            <span className="font-semibold text-zinc-900">Morse TX</span>
          </span>
          <span>Built while learning · Next.js + TypeScript + Web Audio</span>
        </div>
      </footer>
    </div>
  );
}

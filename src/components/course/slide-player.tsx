"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Captions, ChevronLeft, ChevronRight, Maximize, Pause, Play } from "lucide-react";
import { deckElapsed, SPEEDS } from "@/lib/player/cues";
import { PlayerEngine, type EngineState } from "@/lib/player/engine";
import { classifyFailure, logContentError, type ContentFailure } from "@/lib/player/errors";
import { deckPath, firstAudioGuess, MODE_FOLDER, maskEmail, parseDeck, type Deck, type PlayerMode } from "@/lib/player/format";
import type { ContentSession } from "@/lib/player/session";
import { ContentNotice } from "./content-notice";
import { SlideContent } from "./slide-content";

const progressKey = (user: string, item: string, mode: PlayerMode) => `fl-progress:${user}:${item}:${mode}`;
const modeKey = (user: string, item: string) => `fl-mode:${user}:${item}`;

function readProgress(user: string, item: string, mode: PlayerMode): { index: number; rate: number } {
  try {
    const v = JSON.parse(localStorage.getItem(progressKey(user, item, mode)) ?? "null");
    if (v && Number.isInteger(v.index)) return { index: v.index, rate: SPEEDS.includes(v.rate) ? v.rate : 1 };
  } catch {
    // no stored progress
  }
  return { index: 0, rate: 1 };
}

function readMode(user: string, item: string): PlayerMode {
  try {
    return localStorage.getItem(modeKey(user, item)) === "conversation" ? "conversation" : "lecture";
  } catch {
    return "lecture";
  }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Watermark({ text }: Readonly<{ text: string }>) {
  if (!text) return null;
  return (
    <div aria-hidden="true" data-testid="player-watermark" className="player-watermark pointer-events-none absolute inset-0 overflow-hidden select-none">
      <span className="player-watermark-text absolute text-xs font-medium text-foreground/20">{text}</span>
    </div>
  );
}

export function SlidePlayer({
  itemId,
  session,
  modes = { lecture: true, conversation: true },
}: Readonly<{ itemId: string; session: ContentSession; modes?: { lecture?: boolean; conversation?: boolean } }>) {
  const { loader, email, userKey } = session;
  const [mode, setMode] = useState<PlayerMode>(() => {
    const m = typeof window === "undefined" ? "lecture" : readMode(userKey, itemId);
    return m === "conversation" && modes.conversation === false ? "lecture" : m;
  });
  const [deck, setDeck] = useState<Deck | null>(null);
  const [state, setState] = useState<EngineState | null>(null);
  const [failure, setFailure] = useState<ContentFailure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<PlayerEngine | null>(null);

  // 1. Deck for the chosen mode. The first audio file has a fixed name (<folder>/s01.mp3),
  // so it is requested in parallel with deck.json and the first slide shows as soon as the deck is in.
  useEffect(() => {
    if (!loader) return;
    const ctl = new AbortController();
    const folder = MODE_FOLDER[mode];
    void loader.blob(firstAudioGuess(folder)).catch(() => {});
    loader
      .json(deckPath(folder), ctl.signal)
      .then((raw) => {
        if (ctl.signal.aborted) return;
        const d = parseDeck(raw, folder);
        const resume = readProgress(userKey, itemId, mode);
        const start = Math.min(resume.index, d.slides.length - 1);
        setFailure(null);
        setDeck(d);
        setState({ index: start, phase: "loading", rate: resume.rate, time: 0, duration: 0, cue: -1, thinkLeft: d.thinkSeconds, blobUrls: 0 });
      })
      .catch((e) => {
        if (ctl.signal.aborted) return;
        logContentError("deck", e, { itemId, mode });
        setFailure(classifyFailure(e));
      });
    return () => ctl.abort();
  }, [loader, itemId, userKey, mode, attempt]);

  // 2. Engine, created once the deck and both audio elements exist.
  useEffect(() => {
    if (!deck || !loader || !aRef.current || !bRef.current) return;
    const resume = readProgress(userKey, itemId, deck.mode);
    const engine = new PlayerEngine(deck, loader, [aRef.current, bRef.current], setState, {
      index: Math.min(resume.index, deck.slides.length - 1),
      rate: resume.rate,
    });
    engineRef.current = engine;
    void engine.goTo(engine.state.index, { autoplay: false });
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [deck, loader, itemId, userKey]);

  // A failed audio load surfaces as a friendly message too.
  useEffect(() => {
    if (state?.phase === "error") logContentError("audio", new Error(state.error ?? "audio"), { itemId });
  }, [state?.phase, state?.error, itemId]);

  // Progress memory: only the position and speed, never content.
  useEffect(() => {
    if (!state || !deck) return;
    try {
      localStorage.setItem(progressKey(userKey, itemId, deck.mode), JSON.stringify({ index: state.index, rate: state.rate }));
    } catch {
      // storage unavailable
    }
  }, [state?.index, state?.rate, deck, userKey, itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = (m: PlayerMode) => {
    if (m === mode) return;
    engineRef.current?.dispose(); // also releases blob URLs held for the old deck's audio
    engineRef.current = null;
    try {
      localStorage.setItem(modeKey(userKey, itemId), m);
    } catch {
      // ignore
    }
    setDeck(null);
    setState(null);
    setFailure(null);
    setMode(m);
  };

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  const stepSpeed = (dir: 1 | -1) => {
    const eng = engineRef.current;
    if (!eng) return;
    const i = SPEEDS.indexOf(eng.state.rate as (typeof SPEEDS)[number]);
    eng.setRate(SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, i + dir))]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "SELECT" || t.tagName === "INPUT") return;
    const eng = engineRef.current;
    if (!eng) return;
    switch (e.key) {
      case " ":
      case "k":
        if (t.tagName === "BUTTON") return;
        e.preventDefault();
        eng.toggle();
        break;
      case "ArrowRight": e.preventDefault(); eng.next(); break;
      case "ArrowLeft": e.preventDefault(); eng.prev(); break;
      case "ArrowUp": case "+": e.preventDefault(); stepSpeed(1); break;
      case "ArrowDown": case "-": e.preventDefault(); stepSpeed(-1); break;
      case "c": setCaptionsOn((v) => !v); break;
      case "f": toggleFullscreen(); break;
    }
  };

  const mask = useMemo(() => maskEmail(email), [email]);
  const slide = deck && state ? deck.slides[state.index] : null;
  const cap = slide && state && state.cue >= 0 ? slide.cues[state.cue] : null;
  const eng = engineRef.current;
  const durations = useMemo(() => deck?.slides.map((s) => s.audio.duration) ?? [], [deck]);
  const speakerKeys = deck ? Object.keys(deck.speakers) : [];
  const failed = failure ?? (state?.phase === "error" ? classifyFailure(new Error("audio")) : null);

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label="Slide player"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="slide-player"
      data-phase={state?.phase ?? "loading"}
      data-index={state?.index ?? 0}
      data-blob-count={state?.blobUrls ?? 0}
      data-rate={state?.rate ?? 1}
      data-mode={mode}
      className="player relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <audio ref={aRef} data-slot="a" className="hidden" {...({ controlsList: "nodownload" } as object)} />
      <audio ref={bRef} data-slot="b" className="hidden" {...({ controlsList: "nodownload" } as object)} />

      {modes.lecture !== false && modes.conversation !== false && (
        <div role="group" aria-label="Audio mode" className="flex gap-1 border-b border-border p-2 text-sm">
          {(["lecture", "conversation"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              data-testid={`mode-${m}`}
              onClick={() => switchMode(m)}
              className={`rounded px-3 py-1 ${mode === m ? "bg-primary/15 font-medium" : "hover:bg-muted"}`}
            >
              {m === "lecture" ? "Lecture" : "Conversation"}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex aspect-video w-full flex-col justify-between p-5 sm:p-8">
        {failed ? (
          <ContentNotice failure={failed} onRetry={() => { setFailure(null); setAttempt((n) => n + 1); }} className="m-auto" />
        ) : !slide || !state ? (
          <div className="m-auto h-6 w-48 animate-pulse rounded bg-muted" aria-busy="true" />
        ) : (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Slide {state.index + 1} of {deck!.slides.length}
              </p>
              <div className="mt-1"><SlideContent content={slide.content} /></div>
              {speakerKeys.length > 1 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Speakers">
                  {speakerKeys.map((k) => (
                    <li
                      key={k}
                      data-speaker={k}
                      data-active={cap?.speaker === k ? "true" : "false"}
                      className="rounded-full border border-border px-3 py-1 text-xs transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-foreground motion-reduce:transition-none"
                    >
                      {deck!.speakers[k].name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {state.phase === "think" && (
              <div data-testid="quiz" className="my-2 rounded-md border border-dashed border-border p-3">
                <p data-testid="think-countdown" role="timer" aria-label="Think time left" className="text-sm text-muted-foreground">
                  Think about it: {Math.ceil(state.thinkLeft)} s
                </p>
                <button type="button" data-testid="reveal" onClick={() => eng?.skipThink()} className="mt-2 rounded border border-border px-3 py-1 text-sm hover:bg-muted">
                  Reveal the answer
                </button>
              </div>
            )}

            <p
              aria-live="polite"
              aria-atomic="true"
              data-testid="caption"
              data-cue={state.cue}
              data-speaker={cap?.speaker ?? ""}
              className="min-h-[3.5rem] text-base sm:text-lg"
            >
              {captionsOn ? cap?.text ?? "" : ""}
            </p>
          </>
        )}
        <Watermark text={mask} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Previous slide" onClick={() => eng?.prev()} className="player-btn"><ChevronLeft className="h-4 w-4" /></button>
          <button
            type="button"
            aria-label={state?.phase === "playing" ? "Pause" : "Play"}
            data-testid="play-toggle"
            onClick={() => eng?.toggle()}
            className="player-btn"
            aria-busy={state?.phase === "loading"}
          >
            {state?.phase === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button type="button" aria-label="Next slide" onClick={() => eng?.next()} className="player-btn"><ChevronRight className="h-4 w-4" /></button>
          <input
            type="range"
            aria-label="Seek within slide"
            min={0}
            max={Math.max(1, Math.round((state?.duration ?? 0) * 10))}
            value={Math.round((state?.time ?? 0) * 10)}
            onChange={(e) => eng?.seek(Number(e.target.value) / 10)}
            className="min-w-24 flex-1"
          />
          {deck && state && (
            <span className="text-xs tabular-nums text-muted-foreground" data-testid="elapsed">
              {fmt(deckElapsed(durations, state.index, state.time))} / {fmt(deck.totalSeconds)}
            </span>
          )}
          <label className="sr-only" htmlFor={`speed-${itemId}`}>Speed</label>
          <select
            id={`speed-${itemId}`}
            value={state?.rate ?? 1}
            onChange={(e) => eng?.setRate(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            data-testid="speed"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
          <button type="button" aria-label="Captions" aria-pressed={captionsOn} onClick={() => setCaptionsOn((v) => !v)} className="player-btn"><Captions className="h-4 w-4" /></button>
          <button type="button" aria-label="Full screen" onClick={toggleFullscreen} className="player-btn"><Maximize className="h-4 w-4" /></button>
        </div>
        {deck && (
          <ol className="mt-3 flex flex-wrap gap-1" aria-label="Slides">
            {deck.slides.map((s, i) => (
              <li key={s.index}>
                <button
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={state?.index === i ? "true" : undefined}
                  onClick={() => void eng?.goTo(i)}
                  className={`h-7 min-w-7 rounded border px-1 text-xs ${state?.index === i ? "border-primary bg-primary/15" : "border-border"}`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

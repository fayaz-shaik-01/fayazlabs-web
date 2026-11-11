"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Captions, Check, ChevronDown, ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play } from "lucide-react";
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

const speedLabel = (r: number) => `${r}×`;

/** Playback speed: a button showing the current speed that opens a small menu of options. */
function SpeedMenu({ rate, onPick }: Readonly<{ rate: number; onPick: (r: number) => void }>) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    wrap.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      wrap.current?.querySelector<HTMLElement>("button")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const items = Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    }
  };

  return (
    <div ref={wrap} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        data-testid="speed"
        aria-label={`Playback speed, ${speedLabel(rate)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="player-btn w-auto gap-1 px-3 font-mono text-[0.8125rem] font-medium tabular-nums"
      >
        {speedLabel(rate)}
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" aria-label="Playback speed" className="absolute right-0 bottom-full z-20 mb-2 w-32 rounded-xl border border-border bg-popover p-1 shadow-float animate-in fade-in zoom-in-95 duration-100">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              role="menuitemradio"
              aria-checked={sp === rate}
              data-testid={`speed-${sp}`}
              onClick={() => {
                onPick(sp);
                setOpen(false);
                wrap.current?.querySelector<HTMLElement>("button")?.focus();
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-1.5 font-mono text-sm tabular-nums transition-colors hover:bg-muted focus-visible:bg-muted aria-checked:font-semibold aria-checked:text-primary"
            >
              {speedLabel(sp)}
              {sp === rate && <Check className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [nativeFs, setNativeFs] = useState(false);
  const [fakeFs, setFakeFs] = useState(false); // iOS Safari cannot fullscreen an element: fill the viewport instead
  const fs = nativeFs || fakeFs;
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

  useEffect(() => {
    const onChange = () => setNativeFs(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Leave the viewport-filling fallback with Escape, and stop the page behind it from scrolling.
  useEffect(() => {
    if (!fakeFs) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFakeFs(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [fakeFs]);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (fakeFs) {
      setFakeFs(false);
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setFakeFs(true));
    } else {
      setFakeFs(true);
    }
  }, [fakeFs]);

  const stepSpeed = (dir: 1 | -1) => {
    const eng = engineRef.current;
    if (!eng) return;
    const i = SPEEDS.indexOf(eng.state.rate as (typeof SPEEDS)[number]);
    eng.setRate(SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, i + dir))]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.closest("[role=menu]")) return;
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
  // A quiz slide keeps its answer hidden until the player reaches it.
  const hideAnswer = !!slide?.quiz && !!state && state.phase !== "ended" && state.time < slide.quiz.answer_start;
  const pct = state && state.duration > 0 ? Math.min(100, (state.time / state.duration) * 100) : 0;

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
      data-fs={fs ? "true" : "false"}
      className="player panel bracket relative overflow-hidden rounded-lg text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <audio ref={aRef} data-slot="a" className="hidden" {...({ controlsList: "nodownload" } as object)} />
      <audio ref={bRef} data-slot="b" className="hidden" {...({ controlsList: "nodownload" } as object)} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        {modes.lecture !== false && modes.conversation !== false ? (
          <div role="group" aria-label="Audio mode" className="inline-flex rounded-lg bg-muted p-0.5 text-sm">
            {(["lecture", "conversation"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                data-testid={`mode-${m}`}
                onClick={() => switchMode(m)}
                className={`rounded-md px-3 py-1 font-semibold transition-colors ${mode === m ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "lecture" ? "Lecture" : "Conversation"}
              </button>
            ))}
          </div>
        ) : (
          <span className="eyebrow">{mode === "lecture" ? "Lecture" : "Conversation"}</span>
        )}
        {deck && state && (
          <p className="eyebrow tabular-nums" data-testid="slide-counter">
            Slide {state.index + 1} / {deck.slides.length}
          </p>
        )}
      </div>

      <div className="player-stage relative flex flex-col justify-between gap-4 p-5 sm:p-8">
        {failed ? (
          <ContentNotice failure={failed} onRetry={() => { setFailure(null); setAttempt((n) => n + 1); }} className="m-auto" />
        ) : !slide || !state ? (
          <div className="m-auto h-6 w-48 animate-pulse rounded bg-muted" aria-busy="true" />
        ) : (
          <>
            <div className="min-h-0">
              <SlideContent content={slide.content} hideAnswer={hideAnswer} />
              {speakerKeys.length > 1 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Speakers">
                  {speakerKeys.map((k) => (
                    <li
                      key={k}
                      data-speaker={k}
                      data-active={cap?.speaker === k ? "true" : "false"}
                      className="rounded-full border border-border px-3 py-1 text-xs transition-colors data-[active=true]:border-primary data-[active=true]:bg-accent data-[active=true]:font-semibold data-[active=true]:text-accent-foreground motion-reduce:transition-none"
                    >
                      {deck!.speakers[k].name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {state.phase === "think" && (
              <div data-testid="quiz" className="callout flex flex-wrap items-center justify-between gap-3">
                <p data-testid="think-countdown" role="timer" aria-label="Think time left" className="font-semibold">
                  Think about it: <span className="tabular-nums">{Math.ceil(state.thinkLeft)} s</span>
                </p>
                <button type="button" data-testid="reveal" onClick={() => eng?.skipThink()} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
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
              className="min-h-[3.5rem] rounded-lg bg-muted px-4 py-3 text-[clamp(1rem,1.7cqw,1.4rem)] leading-snug"
            >
              {captionsOn ? cap?.text ?? "" : ""}
            </p>
          </>
        )}
        <Watermark text={mask} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Previous slide" onClick={() => eng?.prev()} className="player-btn"><ChevronLeft className="size-4" /></button>
            <button
              type="button"
              aria-label={state?.phase === "playing" ? "Pause" : "Play"}
              data-testid="play-toggle"
              onClick={() => eng?.toggle()}
              className="player-btn player-play"
              aria-busy={state?.phase === "loading"}
            >
              {state?.phase === "playing" ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
            </button>
            <button type="button" aria-label="Next slide" onClick={() => eng?.next()} className="player-btn"><ChevronRight className="size-4" /></button>
          </div>

          <div className="order-last flex w-full min-w-0 items-center gap-3 sm:order-none sm:w-auto sm:flex-1">
            <input
              type="range"
              aria-label="Seek within slide"
              min={0}
              max={Math.max(1, Math.round((state?.duration ?? 0) * 10))}
              value={Math.round((state?.time ?? 0) * 10)}
              onChange={(e) => eng?.seek(Number(e.target.value) / 10)}
              className="player-range min-w-24 flex-1"
              style={{ "--p": `${pct}%` } as React.CSSProperties}
            />
            {deck && state && (
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground" data-testid="elapsed">
                {fmt(deckElapsed(durations, state.index, state.time))} / {fmt(deck.totalSeconds)}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            <SpeedMenu rate={state?.rate ?? 1} onPick={(r) => eng?.setRate(r)} />
            <button type="button" aria-label="Captions" aria-pressed={captionsOn} onClick={() => setCaptionsOn((v) => !v)} className="player-btn aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"><Captions className="size-4" /></button>
            <button type="button" aria-label={fs ? "Exit full screen" : "Full screen"} aria-pressed={fs} onClick={toggleFullscreen} className="player-btn">{fs ? <Minimize className="size-4" /> : <Maximize className="size-4" />}</button>
          </div>
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
                  className="h-7 min-w-7 rounded-md border border-border px-1 font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:border-primary hover:text-foreground aria-[current=true]:border-primary aria-[current=true]:bg-accent aria-[current=true]:font-semibold aria-[current=true]:text-accent-foreground"
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

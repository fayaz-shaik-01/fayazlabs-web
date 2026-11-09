"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Captions, ChevronLeft, ChevronRight, Maximize, Pause, Play } from "lucide-react";
import { SPEEDS, THINK_SECONDS } from "@/lib/player/cues";
import { PlayerEngine, type EngineState } from "@/lib/player/engine";
import { parseDeck, maskEmail, type Deck } from "@/lib/player/format";
import type { ContentSession } from "@/lib/player/session";

const progressKey = (user: string, item: string) => `fl-progress:${user}:${item}`;

function readProgress(user: string, item: string): { index: number; rate: number } {
  try {
    const v = JSON.parse(localStorage.getItem(progressKey(user, item)) ?? "null");
    if (v && Number.isInteger(v.index)) return { index: v.index, rate: SPEEDS.includes(v.rate) ? v.rate : 1 };
  } catch {
    // no stored progress
  }
  return { index: 0, rate: 1 };
}

function Watermark({ text }: Readonly<{ text: string }>) {
  if (!text) return null;
  return (
    <div aria-hidden="true" data-testid="player-watermark" className="player-watermark pointer-events-none absolute inset-0 overflow-hidden select-none">
      <span className="player-watermark-text absolute text-xs font-medium text-foreground/20">{text}</span>
    </div>
  );
}

export function SlidePlayer({ itemId, session }: Readonly<{ itemId: string; session: ContentSession }>) {
  const { loader, email, userKey } = session;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [state, setState] = useState<EngineState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [captionsOn, setCaptionsOn] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<PlayerEngine | null>(null);

  // 1. Deck and first audio in parallel; the first slide shows as soon as the deck is in.
  useEffect(() => {
    if (!loader) return;
    const ctl = new AbortController();
    const resume = readProgress(userKey, itemId);
    // The first audio is requested before the deck says which file it is; the
    // conventional name is a guess and is simply released if the deck differs.
    void loader.blob(`audio/01.mp3`).catch(() => {});
    loader
      .json("deck.json", ctl.signal)
      .then((raw) => {
        if (ctl.signal.aborted) return;
        const d = parseDeck(raw);
        const start = Math.min(resume.index, d.slides.length - 1);
        setDeck(d);
        setState({ index: start, phase: "loading", rate: resume.rate, time: 0, duration: 0, cue: -1, thinkLeft: THINK_SECONDS, choice: null, blobUrls: 0 });
      })
      .catch((e) => !ctl.signal.aborted && setLoadError(e instanceof Error ? e.message : "Could not load the slides"));
    return () => ctl.abort();
  }, [loader, itemId, userKey]);

  // 2. Engine, created once the deck and both audio elements exist.
  useEffect(() => {
    if (!deck || !loader || !aRef.current || !bRef.current) return;
    const resume = readProgress(userKey, itemId);
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

  // Progress memory: only the position and speed, never content.
  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(progressKey(userKey, itemId), JSON.stringify({ index: state.index, rate: state.rate }));
    } catch {
      // storage unavailable
    }
  }, [state?.index, state?.rate, userKey, itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Access gone (revoked, locked): the slot unmounts this component, which disposes the engine above.

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "SELECT" || t.tagName === "INPUT") return;
    const eng = engineRef.current;
    if (!eng) return;
    switch (e.key) {
      case " ":
      case "k":
        if (t.tagName === "BUTTON") return; // let buttons activate themselves
        e.preventDefault();
        eng.toggle();
        break;
      case "ArrowRight":
        e.preventDefault();
        eng.next();
        break;
      case "ArrowLeft":
        e.preventDefault();
        eng.prev();
        break;
      case "ArrowUp":
      case "+":
        e.preventDefault();
        stepSpeed(1);
        break;
      case "ArrowDown":
      case "-":
        e.preventDefault();
        stepSpeed(-1);
        break;
      case "c":
        setCaptionsOn((v) => !v);
        break;
      case "f":
        toggleFullscreen();
        break;
    }
  };

  const stepSpeed = (dir: 1 | -1) => {
    const eng = engineRef.current;
    if (!eng) return;
    const i = SPEEDS.indexOf(eng.state.rate as (typeof SPEEDS)[number]);
    const n = Math.min(SPEEDS.length - 1, Math.max(0, i + dir));
    eng.setRate(SPEEDS[n]);
  };

  const mask = useMemo(() => maskEmail(email), [email]);
  const slide = deck && state ? deck.slides[state.index] : null;
  const cap = slide && state && state.cue >= 0 ? slide.captions[state.cue] : null;
  const eng = engineRef.current;
  const busy = state?.phase === "loading";

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
      data-mode={deck?.mode}
      className="player relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <audio ref={aRef} data-slot="a" className="hidden" {...({ controlsList: "nodownload" } as object)} />
      <audio ref={bRef} data-slot="b" className="hidden" {...({ controlsList: "nodownload" } as object)} />

      <div className="relative flex aspect-video w-full flex-col justify-between p-5 sm:p-8">
        {loadError ? (
          <p role="alert" className="m-auto text-sm text-muted-foreground">{loadError}</p>
        ) : !slide || !state ? (
          <div className="m-auto h-6 w-48 animate-pulse rounded bg-muted" aria-busy="true" />
        ) : (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Slide {state.index + 1} of {deck!.slides.length}
              </p>
              <h3 className="mt-1 text-xl font-semibold sm:text-2xl">{slide.title ?? deck!.title}</h3>
              {deck!.mode === "conversation" && deck!.speakers && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Speakers">
                  {deck!.speakers.map((s) => (
                    <li
                      key={s}
                      data-speaker={s}
                      data-active={cap?.speaker === s ? "true" : "false"}
                      className="rounded-full border border-border px-3 py-1 text-xs transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-foreground motion-reduce:transition-none"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {slide.quiz && (state.phase === "think" || state.phase === "answer" || state.choice !== null) && (
              <fieldset className="my-2 space-y-2" data-testid="quiz">
                <legend className="text-sm font-medium">{slide.quiz.question}</legend>
                {slide.quiz.options.map((o, i) => {
                  const revealed = state.phase === "answer";
                  const right = revealed && i === slide.quiz!.answerIndex;
                  const wrong = revealed && state.choice === i && !right;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={revealed}
                      onClick={() => eng?.choose(i)}
                      aria-pressed={state.choice === i}
                      data-correct={right ? "true" : undefined}
                      className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${right ? "border-green-600 bg-green-600/10" : wrong ? "border-red-600 bg-red-600/10" : state.choice === i ? "border-primary" : "border-border"}`}
                    >
                      {o}
                    </button>
                  );
                })}
                {state.phase === "think" && (
                  <p data-testid="think-countdown" role="timer" aria-label="Think time left" className="text-sm text-muted-foreground">
                    Think: {Math.ceil(state.thinkLeft)} s
                  </p>
                )}
                {state.phase === "answer" && slide.quiz.explanation && (
                  <p className="text-sm text-muted-foreground">{slide.quiz.explanation}</p>
                )}
              </fieldset>
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
        {state?.phase === "error" && (
          <p role="alert" className="absolute inset-x-0 bottom-16 text-center text-sm text-red-600">{state.error}</p>
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
            aria-busy={busy}
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
              <li key={s.id}>
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

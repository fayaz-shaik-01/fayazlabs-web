import { activeCueIndex, quizPassedBySeek, shouldPauseForQuiz, thinkRemaining } from "./cues";
import { slideAudioPath, type Deck } from "./format";
import type { ContentLoader } from "./loader";
import { windowFor } from "./prefetch";

export type Phase = "loading" | "playing" | "paused" | "think" | "ended" | "error";

export interface EngineState {
  index: number;
  phase: Phase;
  rate: number;
  time: number;
  duration: number;
  cue: number;
  thinkLeft: number;
  blobUrls: number;
  error?: string;
}

type Slot = { el: HTMLAudioElement; index: number };

/**
 * Plays a deck from the audio clock only. Two audio elements alternate: while
 * slide N plays on one, N+1 is already attached to the other, so the hand-off
 * is a single play() call in the `ended` handler. Captions and speaker
 * highlight come from `currentTime` (rAF + timeupdate), so playbackRate
 * changes cannot desync them. The only wall-clock timing is the quiz think
 * countdown, which is a pause in the audio, not part of it.
 */
export class PlayerEngine {
  private slots: [Slot, Slot];
  private cur = 0;
  private token = 0;
  private raf = 0;
  private disposed = false;
  private wantPlay = true;
  private thinkStart = 0;
  private quizPassed = false;
  private lastEmit = "";
  private cleanups: (() => void)[] = [];
  state: EngineState;

  constructor(
    private deck: Deck,
    private loader: ContentLoader,
    audios: [HTMLAudioElement, HTMLAudioElement],
    private onChange: (s: EngineState) => void,
    initial: { index?: number; rate?: number } = {},
  ) {
    this.slots = [
      { el: audios[0], index: -1 },
      { el: audios[1], index: -1 },
    ];
    this.state = {
      index: initial.index ?? 0,
      phase: "loading",
      rate: initial.rate ?? 1,
      time: 0,
      duration: 0,
      cue: -1,
      thinkLeft: deck.thinkSeconds,
      blobUrls: 0,
    };
    for (const s of this.slots) {
      s.el.preload = "auto";
      s.el.setAttribute("controlsList", "nodownload");
      const onEnded = () => this.handleEnded(s);
      const onTime = () => this.sample();
      s.el.addEventListener("ended", onEnded);
      s.el.addEventListener("timeupdate", onTime);
      this.cleanups.push(() => {
        s.el.removeEventListener("ended", onEnded);
        s.el.removeEventListener("timeupdate", onTime);
      });
    }
    this.applyRate();
  }

  private get active(): Slot {
    return this.slots[this.cur];
  }
  private get idle(): Slot {
    return this.slots[1 - this.cur];
  }

  private set(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch, blobUrls: this.loader.liveUrlCount };
  }

  private emit(force = false) {
    const s = this.state;
    const key = `${s.index}|${s.phase}|${s.rate}|${s.cue}|${Math.floor(s.time * 4)}|${Math.ceil(s.thinkLeft * 10)}|${s.blobUrls}|${Math.round(s.duration)}`;
    if (!force && key === this.lastEmit) return;
    this.lastEmit = key;
    this.onChange(this.state);
  }

  private applyRate() {
    for (const s of this.slots) {
      s.el.defaultPlaybackRate = this.state.rate;
      s.el.playbackRate = this.state.rate;
      s.el.preservesPitch = true;
    }
  }

  private rel(i: number) {
    return slideAudioPath(this.deck, this.deck.slides[i]);
  }

  /** Read the audio clock and update caption/progress state. */
  private sample() {
    if (this.disposed) return;
    const { phase, index } = this.state;
    if (phase === "think") {
      const left = thinkRemaining(this.thinkStart, performance.now());
      this.set({ thinkLeft: left });
      if (left <= 0) this.reveal();
      else this.emit();
      return;
    }
    if (phase !== "playing" && phase !== "paused") return;
    const el = this.active.el;
    if (this.active.index !== index) return;
    const t = el.currentTime;
    const slide = this.deck.slides[index];
    this.set({
      time: t,
      duration: slide.audio.duration || (Number.isFinite(el.duration) ? el.duration : 0),
      cue: activeCueIndex(slide.cues, t),
    });
    // Quiz: stop at the end of the question, the think timer runs, then reveal.
    if (phase === "playing" && shouldPauseForQuiz(slide.quiz, t, this.quizPassed)) {
      el.pause();
      this.thinkStart = performance.now();
      this.set({ phase: "think", thinkLeft: this.deck.thinkSeconds });
      this.emit(true);
      return;
    }
    // A hidden tab can stall rAF; `ended` still fires, but poll it too.
    if (el.ended && phase === "playing") this.handleEnded(this.active);
    else this.emit();
  }

  private loop = () => {
    if (this.disposed) return;
    this.sample();
    this.raf = requestAnimationFrame(this.loop);
  };

  private ensureLoop() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.loop);
  }

  async goTo(index: number, opts: { autoplay?: boolean; at?: number } = {}) {
    if (this.disposed) return;
    const i = Math.min(Math.max(0, index), this.deck.slides.length - 1);
    const my = ++this.token;
    if (opts.autoplay !== undefined) this.wantPlay = opts.autoplay;
    this.active.el.pause();
    this.idle.el.pause();
    this.quizPassed = false;
    this.set({ index: i, phase: "loading", time: 0, cue: -1, duration: 0, thinkLeft: this.deck.thinkSeconds, error: undefined });
    this.emit(true);
    this.ensureLoop();

    // Drop anything outside the new window straight away, aborting stale loads.
    const win = windowFor(i, this.deck.slides.length);
    this.loader.keepOnly(win.map((n) => this.rel(n)));
    this.invalidateOutside(win);

    let slot = this.slots.find((s) => s.index === i);
    try {
      const url = await this.loader.blob(this.rel(i));
      if (my !== this.token || this.disposed) return;
      if (!slot) {
        // Use the slot that is not currently active, then make it active.
        slot = this.idle;
      }
      this.cur = this.slots.indexOf(slot);
      if (slot.index !== i || !slot.el.src.startsWith("blob:") || slot.el.dataset.rel !== this.rel(i)) {
        this.attach(slot, i, url);
      }
      slot.el.currentTime = opts.at ?? 0;
      if (quizPassedBySeek(this.deck.slides[i].quiz, opts.at ?? 0)) this.quizPassed = true;
      this.applyRate();
      if (this.wantPlay) {
        await slot.el.play();
        if (my !== this.token) return;
        this.set({ phase: "playing" });
      } else {
        this.set({ phase: "paused" });
      }
      this.emit(true);
      this.prefetch(i, my);
    } catch (e) {
      if (my !== this.token || this.disposed) return;
      if ((e as Error)?.name === "NotAllowedError") {
        this.set({ phase: "paused" });
        this.wantPlay = false;
      } else if ((e as Error)?.name === "AbortError") {
        return;
      } else {
        this.set({ phase: "error", error: (e as Error)?.message ?? "Playback failed" });
      }
      this.emit(true);
    }
  }

  /** Detach audio elements still pointing at a released (revoked) blob URL. */
  private invalidateOutside(win: number[]) {
    for (const s of this.slots) {
      if (s.index !== -1 && !win.includes(s.index)) {
        s.el.pause();
        s.el.removeAttribute("src");
        delete s.el.dataset.rel;
        s.el.load();
        s.index = -1;
      }
    }
  }

  private attach(slot: Slot, i: number, url: string) {
    slot.el.src = url;
    slot.el.dataset.rel = this.rel(i);
    slot.el.load();
    slot.index = i;
  }

  /** Load slides N+1, N+2 and attach N+1 to the idle element. */
  private prefetch(i: number, my: number) {
    const total = this.deck.slides.length;
    for (const n of windowFor(i, total)) {
      if (n === i) continue;
      this.loader
        .blob(this.rel(n))
        .then((url) => {
          if (my !== this.token || this.disposed) return;
          if (n === i + 1 && this.idle.index !== n) this.attach(this.idle, n, url);
          this.set({});
          this.emit();
        })
        .catch(() => {
          // A failed prefetch is retried when the slide becomes current.
        });
    }
  }

  private handleEnded(slot: Slot) {
    if (this.disposed || slot !== this.active || this.state.phase !== "playing") return;
    this.next();
  }

  /** End the think pause: jump to the answer and play on. */
  private reveal() {
    const quiz = this.deck.slides[this.state.index].quiz;
    this.quizPassed = true;
    const el = this.active.el;
    if (quiz) el.currentTime = quiz.answer_start;
    this.set({ phase: "playing", thinkLeft: 0 });
    this.wantPlay = true;
    void el.play().catch(() => {});
    this.emit(true);
  }

  skipThink() {
    if (this.state.phase === "think") this.reveal();
  }

  next() {
    const i = this.state.index;
    if (i >= this.deck.slides.length - 1) {
      this.active.el.pause();
      this.set({ phase: "ended" });
      this.emit(true);
      return;
    }
    const nxt = this.idle;
    if (this.state.phase === "playing" && nxt.index === i + 1 && nxt.el.readyState >= 2 && this.wantPlay) {
      // Fast path: the next slide is attached and buffered, so start it now.
      const my = ++this.token;
      this.active.el.pause();
      this.cur = 1 - this.cur;
      nxt.el.currentTime = 0;
      this.applyRate();
      void nxt.el.play().catch(() => {});
      this.quizPassed = false;
      this.set({ index: i + 1, phase: "playing", time: 0, cue: -1, duration: this.deck.slides[i + 1].audio.duration, thinkLeft: this.deck.thinkSeconds });
      const win = windowFor(i + 1, this.deck.slides.length);
      this.loader.keepOnly(win.map((n) => this.rel(n)));
      this.invalidateOutside(win);
      this.emit(true);
      this.prefetch(i + 1, my);
      return;
    }
    void this.goTo(i + 1, { autoplay: this.wantPlay });
  }

  prev() {
    // Within the first 3 s of a slide, go to the previous one; else restart this one.
    if (this.state.time > 3 || this.state.index === 0) this.seek(0);
    else void this.goTo(this.state.index - 1, { autoplay: this.wantPlay });
  }

  seek(t: number) {
    const el = this.active.el;
    if (this.active.index !== this.state.index) return;
    el.currentTime = Math.max(0, t);
    if (quizPassedBySeek(this.deck.slides[this.state.index].quiz, t)) this.quizPassed = true;
    if (this.state.phase === "think") this.set({ phase: "paused" });
    this.sample();
  }

  play() {
    this.wantPlay = true;
    const phase: Phase = this.state.phase;
    if (phase === "loading") return; // the in-flight load will start playback
    if (phase === "ended") return void this.goTo(0, { autoplay: true });
    if (phase === "think") return this.skipThink();
    if (phase === "paused") {
      if (this.active.index === this.state.index) {
        this.active.el.play().then(() => {
          this.set({ phase: "playing" });
          this.emit(true);
        }).catch(() => {});
      } else void this.goTo(this.state.index, { autoplay: true });
    }
  }

  pause() {
    this.wantPlay = false;
    if (this.state.phase === "playing") {
      this.active.el.pause();
      this.set({ phase: "paused" });
      this.emit(true);
    }
  }

  toggle() {
    if (this.state.phase === "playing") this.pause();
    else this.play();
  }

  setRate(rate: number) {
    this.set({ rate });
    this.applyRate();
    this.emit(true);
  }

  /** Stop everything and release every decrypted byte we hold. */
  dispose() {
    this.disposed = true;
    this.token++;
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach((c) => c());
    for (const s of this.slots) {
      s.el.pause();
      s.el.removeAttribute("src");
      s.el.load();
      s.index = -1;
    }
    // Release this deck's audio blobs; the loader itself belongs to the session (shared across mode switches).
    this.loader.keepOnly([]);
  }
}

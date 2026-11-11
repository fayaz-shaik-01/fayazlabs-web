"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import type { BoltController, CamPreset } from "@/components/bolt/bolt-scene";

type Mode = "hero" | "companion" | "dim" | "off";

/** Camera presets. The horizontal shift depends on the window width, so he always lands in the right-hand gutter. */
function preset(kind: "hero" | "companion" | "chat"): CamPreset {
  const w = typeof window === "undefined" ? 1440 : window.innerWidth;
  if (kind === "hero") return { yaw: 0.2, pitch: 0.08, dist: 13, tx: 0, ty: 2.55, tz: 0, sx: 0.2, sy: 0 };
  if (kind === "chat") return { yaw: 0.12, pitch: 0.05, dist: 11.2, tx: 0, ty: 3.3, tz: 0, sx: 0.5 - 216 / w, sy: 0.12 };
  const gutter = Math.min(330, 0.17 * w);
  return { yaw: 0.2, pitch: 0.08, dist: 18.5, tx: 0, ty: 2.3, tz: 0, sx: 0.5 - gutter / (2 * w) - 0.01, sy: -0.21 };
}

/** Pages where Bolt stays out of the way entirely (forms, dense tools, legal text). */
const OFF = ["/legal", "/login", "/account", "/tax", "/dashboard", "/practice", "/flashcards", "/formulas", "/exam", "/knowledge-graph", "/learning/visualizations"];
/** Reading pages: he stays, but faded, so long text stays easy to read. */
const DIM = ["/learning/ai-product-testing/lessons", "/writing/", "/projects/", "/notebook"];

export function boltMode(pathname: string): Mode {
  if (pathname === "/") return "hero";
  if (OFF.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "off";
  if (DIM.some((p) => pathname.startsWith(p))) return "dim";
  return "companion";
}

const BUBBLES: Record<Mode, string> = {
  hero: "Hi, I'm Bolt. Click me to chat.",
  companion: "Need a hand? Click me.",
  dim: "Stuck on something? Click me.",
  off: "",
};

/* ---- can this browser show him? Desktop width, motion allowed, WebGL present. ---- */
let webgl: boolean | null = null;
function hasWebgl() {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
function subscribeCaps(cb: () => void) {
  const a = window.matchMedia("(min-width: 1000px)"), b = window.matchMedia("(prefers-reduced-motion: reduce)");
  a.addEventListener("change", cb); b.addEventListener("change", cb);
  return () => { a.removeEventListener("change", cb); b.removeEventListener("change", cb); };
}
const capsSnapshot = () =>
  window.matchMedia("(min-width: 1000px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && hasWebgl();
const capsServer = () => false;

const INTERACTIVE = "a,button,input,textarea,select,summary,label,[role=button],[role=menuitem],[data-bolt-ignore]";

interface Ripple { x: number; y: number; t0: number }

export function BoltLayer() {
  const pathname = usePathname();
  const mode = boltMode(pathname);
  const capable = useSyncExternalStore(subscribeCaps, capsSnapshot, capsServer);
  const active = capable && mode !== "off";
  const { open, status, setOpen, setBoltActive } = useChatStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const ctl = useRef<BoltController | null>(null);
  const [ready, setReady] = useState(false);
  const bubbleUntil = useRef(0);
  const ripples = useRef<Ripple[]>([]);
  const target = useRef({ x: 0, y: 0, t0: 0 });
  const openRef = useRef(open);
  const lastScroll = useRef(0);
  const pastHero = useRef(false);

  useEffect(() => { openRef.current = open; }, [open]);

  /* Tell the rest of the app whether he is on screen (the chat launcher defers to him). */
  useEffect(() => {
    setBoltActive(active && ready);
    document.documentElement.dataset.bolt = active ? mode : "off";
    return () => setBoltActive(false);
  }, [active, ready, mode, setBoltActive]);

  const say = useCallback((text: string, ms = 4200) => {
    if (!text || !bubbleRef.current) return;
    bubbleRef.current.textContent = text;
    bubbleUntil.current = performance.now() + ms;
  }, []);

  /* Create and tear down the scene. three.js loads on demand, after the page has settled. */
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let c: BoltController | null = null;
    const start = async () => {
      const { createBoltScene } = await import("@/components/bolt/bolt-scene");
      if (cancelled || !canvasRef.current) return;
      c = createBoltScene(canvasRef.current, false);
      if (!c) return;
      ctl.current = c;
      c.setPreset(preset(openRef.current ? "chat" : mode === "hero" && window.scrollY < window.innerHeight * 0.55 ? "hero" : "companion"));
      setReady(true);
      window.setTimeout(() => { if (!cancelled && !openRef.current) { c?.setMood("wave", 2200); say(BUBBLES[mode]); } }, 1500);
    };
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 200));
    const h = idle(() => { void start(); });
    return () => {
      cancelled = true;
      if (typeof h === "number" && !window.requestIdleCallback) window.clearTimeout(h);
      c?.dispose();
      ctl.current = null;
      setReady(false);
    };
    // The scene is created once per on/off switch; presets follow in their own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* Camera follows the page and the chat. */
  useEffect(() => {
    if (!ready) return;
    ctl.current?.setPreset(preset(open ? "chat" : mode === "hero" && window.scrollY < window.innerHeight * 0.55 ? "hero" : "companion"));
    if (open) { ctl.current?.stopPoint(); ctl.current?.setMood("wave", 1800); } else if (mode !== "off") { ctl.current?.nod(); }
  }, [open, mode, ready]);

  /* Route change: greet the new page. */
  useEffect(() => {
    if (!ready || open) return;
    window.scrollTo({ top: 0 });
    pastHero.current = false;
    ctl.current?.nod();
    say(BUBBLES[mode], 3600);
    // Only on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* The assistant's state drives his pose. */
  useEffect(() => {
    const c = ctl.current;
    if (!c) return;
    if (status === "thinking") { c.setSpeaking(false); c.setMood("think"); }
    else if (status === "speaking") { c.setSpeaking(true); c.setMood("talk"); }
    else { c.setSpeaking(false); c.setMood("idle"); }
  }, [status, ready]);

  /* Dark/light switch: rebuild with the new colours. */
  useEffect(() => {
    if (!ready) return;
    const mo = new MutationObserver(() => ctl.current?.rebuild());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [ready]);

  /* Pointer, scroll, click and hover: the interactions that make him feel alive. */
  useEffect(() => {
    if (!ready) return;
    const c = ctl.current!;
    const clickFx = (x: number, y: number) => {
      ripples.current.push({ x, y, t0: performance.now() });
      if (openRef.current) return;
      target.current = { x, y, t0: performance.now() };
      c.pointAt(x, y, 1100); c.nod();
    };
    const onMove = (e: PointerEvent) => c.setPointer(e.clientX, e.clientY);
    const onLeave = () => c.pointerLeft();
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-bolt-ignore]") || c.hitTest(e.clientX, e.clientY)) return;
      clickFx(e.clientX, e.clientY);
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(INTERACTIVE)) return;
      if (c.hitTest(e.clientX, e.clientY)) setOpen(true);
    };
    const onScroll = () => {
      const y = window.scrollY;
      c.addScroll(y - lastScroll.current); lastScroll.current = y;
      if (mode === "hero" && !openRef.current) {
        const past = y > window.innerHeight * 0.55;
        if (past !== pastHero.current) { pastHero.current = past; c.setPreset(preset(past ? "companion" : "hero")); }
      }
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-bolt-point]");
      if (!el || openRef.current) return;
      const r = el.getBoundingClientRect();
      target.current = { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5, t0: performance.now() };
      c.pointAt(target.current.x, target.current.y, 1e9);
    };
    const onOut = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("[data-bolt-point]");
      if (el) c.stopPoint();
    };
    const onHover = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      document.body.style.cursor = !t?.closest(INTERACTIVE) && c.hitTest(e.clientX, e.clientY) ? "pointer" : "";
    };
    lastScroll.current = window.scrollY;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointermove", onHover, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", onHover);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScroll);
      document.body.style.cursor = "";
    };
  }, [ready, setOpen, mode]);

  /* Per-frame overlays: laser beam + reticle, ripples, speech bubble, "Ask Bolt" pill. */
  useEffect(() => {
    if (!ready) return;
    const c = ctl.current!;
    const fx = fxRef.current!, ctx = fx.getContext("2d")!;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      fx.width = window.innerWidth * dpr; fx.height = window.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    const css = getComputedStyle(document.documentElement);
    const colors = () => ({ line: css.getPropertyValue("--bolt-line").trim() || "#6cb8ff", hi: css.getPropertyValue("--bolt-hi").trim() || "#ffa43a" });
    c.setOnFrame(() => {
      const tn = performance.now(), w = window.innerWidth, h = window.innerHeight, col = colors();
      ctx.clearRect(0, 0, w, h);
      const tip = c.fingertip();
      if (tip) {
        const age = tn - target.current.t0, { x, y } = target.current;
        ctx.save();
        ctx.strokeStyle = col.line; ctx.lineWidth = 1.6; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -age / 25; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(x, y); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle = col.hi; ctx.lineWidth = 2;
        const r = 13 + 22 * Math.max(0, 1 - age / 320), k = 7;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          ctx.beginPath(); ctx.moveTo(x + sx * r, y + sy * (r - k)); ctx.lineTo(x + sx * r, y + sy * r); ctx.lineTo(x + sx * (r - k), y + sy * r); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.283); ctx.fillStyle = col.hi; ctx.fill();
        ctx.restore();
      }
      const rs = ripples.current;
      for (let i = rs.length - 1; i >= 0; i--) {
        const a = (tn - rs[i].t0) / 650;
        if (a >= 1) { rs.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(rs[i].x, rs[i].y, 6 + a * 46, 0, 6.283); ctx.strokeStyle = col.line; ctx.globalAlpha = (1 - a) * 0.8; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      }
      const b = bubbleRef.current;
      if (b) {
        const show = !openRef.current && tn < bubbleUntil.current;
        b.style.opacity = show ? "1" : "0";
        if (show) { const [x, y] = c.headTop(); b.style.transform = `translate(${(x - b.offsetWidth / 2).toFixed(0)}px,${(y - b.offsetHeight - 12).toFixed(0)}px)`; }
      }
      const p = pillRef.current;
      if (p) {
        p.style.visibility = openRef.current ? "hidden" : "visible";
        const [x, y] = c.feet();
        p.style.transform = `translate(${(x - p.offsetWidth / 2).toFixed(0)}px,${(y + 6).toFixed(0)}px)`;
      }
    });
    return () => { c.setOnFrame(null); window.removeEventListener("resize", size); ctx.clearRect(0, 0, fx.width, fx.height); };
  }, [ready]);

  if (!active) return null;
  return (
    <>
      <canvas ref={canvasRef} className="bolt-canvas" aria-hidden="true" data-testid="bolt-canvas" />
      <canvas ref={fxRef} className="bolt-fx" aria-hidden="true" />
      <div ref={bubbleRef} className="bolt-bubble" style={{ opacity: 0 }} aria-hidden="true" data-bolt-ignore />
      <button
        ref={pillRef}
        type="button"
        className="bolt-pill"
        data-testid="chat-launcher"
        data-bolt-ignore
        aria-label="Open AI chat"
        onClick={() => setOpen(true)}
        style={{ visibility: ready ? "visible" : "hidden" }}
      >
        <i />
        Ask Bolt
      </button>
    </>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { findTerm, glossaryHref } from "@/lib/course/glossary";

export interface GlossaryTarget {
  id: string;
  /** The clicked link, used to place the overlay next to it. */
  el: HTMLElement;
  /** Where the link was when clicked; used if the element is re-rendered away. */
  rect: DOMRect;
}

const WIDTH = 380;
const GAP = 10;
const MARGIN = 12;

/** Definition card shown next to the clicked term. A bottom sheet on narrow screens. */
export function GlossaryOverlay({ target, onClose }: Readonly<{ target: GlossaryTarget; onClose: () => void }>) {
  const term = findTerm(target.id);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; sheet: boolean } | null>(null);

  // Place the card under the term (or above it when there is no room), kept inside the viewport.
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw < 640) return setPos({ top: 0, left: 0, sheet: true });
      const r = target.el.isConnected ? target.el.getBoundingClientRect() : target.rect;
      const h = card.offsetHeight;
      const below = r.bottom + GAP + h <= vh - MARGIN;
      const top = below ? r.bottom + GAP : Math.max(MARGIN, r.top - GAP - h);
      const left = Math.min(Math.max(MARGIN, r.left + r.width / 2 - WIDTH / 2), vw - WIDTH - MARGIN);
      setPos({ top, left, sheet: false });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [target]);

  // Close on Escape or a click outside; hand focus back to the term.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !target.el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const el = target.el;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      el.focus?.();
    };
  }, [target, onClose]);

  if (!term) return null;
  const sheet = pos?.sheet;

  return createPortal(
    <>
      {sheet && <div className="fixed inset-0 z-[70] bg-foreground/30" aria-hidden="true" />}
      <div
        ref={ref}
        role="dialog"
        aria-label={`Definition: ${term.term}`}
        data-testid="glossary-overlay"
        style={sheet ? undefined : { top: pos?.top ?? 0, left: pos?.left ?? 0, width: WIDTH, visibility: pos ? "visible" : "hidden" }}
        className={
          sheet
            ? "fixed inset-x-0 bottom-0 z-[71] max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-popover p-5 shadow-float animate-in slide-in-from-bottom-4 duration-200"
            : "fixed z-[71] rounded-xl border border-border bg-popover p-4 shadow-float animate-in fade-in zoom-in-95 duration-150"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Glossary</p>
            <h3 className="mt-1 font-heading text-xl font-bold leading-tight text-foreground">{term.term}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close definition"
            className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-base leading-relaxed text-foreground">{term.definition}</p>
        {term.see && (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="eyebrow mr-2">See</span>
            {term.see}
          </p>
        )}
        <Link
          href={glossaryHref(term.id)}
          onClick={onClose}
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Open full glossary →
        </Link>
      </div>
    </>,
    document.body
  );
}

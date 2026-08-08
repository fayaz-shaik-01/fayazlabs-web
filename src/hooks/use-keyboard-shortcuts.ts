"use client";

import { useEffect } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      for (const s of shortcuts) {
        if (s.enabled === false) continue;
        if (isInput && !s.meta && !s.ctrl) continue;

        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!s.shift === e.shiftKey;
        const altMatch = !!s.alt === e.altKey;
        const metaMatch = s.meta ? e.metaKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          e.preventDefault();
          s.handler(e);
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}

export function useLessonNavShortcuts(
  onPrev: (() => void) | null,
  onNext: (() => void) | null,
) {
  useKeyboardShortcuts([
    {
      key: "ArrowLeft",
      handler: () => onPrev?.(),
      enabled: !!onPrev,
    },
    {
      key: "ArrowRight",
      handler: () => onNext?.(),
      enabled: !!onNext,
    },
  ]);
}

export function useFlashcardShortcuts(handlers: {
  onFlip?: () => void;
  onEasy?: () => void;
  onGood?: () => void;
  onHard?: () => void;
  onAgain?: () => void;
}) {
  useKeyboardShortcuts([
    { key: " ", handler: () => handlers.onFlip?.(), enabled: !!handlers.onFlip },
    { key: "1", handler: () => handlers.onAgain?.(), enabled: !!handlers.onAgain },
    { key: "2", handler: () => handlers.onHard?.(), enabled: !!handlers.onHard },
    { key: "3", handler: () => handlers.onGood?.(), enabled: !!handlers.onGood },
    { key: "4", handler: () => handlers.onEasy?.(), enabled: !!handlers.onEasy },
  ]);
}

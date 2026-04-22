"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

const CLOSE_MS = 180;

type TipRect = { top: number; left: number; maxW: number };

/**
 * Custom hover/focus tooltip: native `title` on &lt;button&gt; is slow and
 * often unreliable in Chrome; a fixed, portaled panel avoids overflow clipping
 * in tables/sections.
 */
export function InfoTip({ text }: { text: string }) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<TipRect | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const clearClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearClose();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, CLOSE_MS);
  }, [clearClose]);

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxW = Math.min(20 * 16, window.innerWidth - 16);
    setRect({
      top: r.bottom + 6,
      left: Math.max(8, Math.min(r.left, window.innerWidth - 8 - maxW)),
      maxW,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onChange = () => {
      requestAnimationFrame(updatePosition);
    };
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [open, text, updatePosition]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openFromPointer = useCallback(() => {
    clearClose();
    setOpen(true);
  }, [clearClose]);

  const isCoarse = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none)").matches;

  const onButtonClick = () => {
    if (isCoarse()) setOpen((o) => !o);
  };

  const tooltip = isClient && open && rect && (
    <div
      id={`${id}-body`}
      ref={panelRef}
      className="pointer-events-auto fixed z-[200] max-h-[40vh] overflow-y-auto rounded-md border border-zinc-600/80 bg-zinc-900 p-2.5 text-left text-xs leading-relaxed text-zinc-100 shadow-xl dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-900"
      style={{
        top: rect.top,
        left: rect.left,
        maxWidth: rect.maxW,
      }}
      onMouseEnter={openFromPointer}
      onMouseLeave={scheduleClose}
      // Screen readers get the full string from the button; avoid duplicate
      // announcements from this node.
      aria-hidden="true"
    >
      {text}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={text}
        className="ms-1 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-600 transition hover:border-zinc-400 hover:bg-white hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
        onMouseEnter={openFromPointer}
        onMouseLeave={scheduleClose}
        onFocus={openFromPointer}
        onBlur={scheduleClose}
        onClick={onButtonClick}
      >
        <span aria-hidden className="select-none text-[11px] font-bold leading-none">
          ?
        </span>
      </button>
      {tooltip ? createPortal(tooltip, document.body) : null}
    </>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { withBase } from "@/lib/basePath";
import styles from "./Lightbox.module.css";

export type LightboxItem = {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
};

export type OriginRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type OpenArgs = {
  items: LightboxItem[];
  index?: number;
  originRect?: OriginRect | DOMRect | null;
};

type LightboxContextValue = {
  open: (args: OpenArgs) => void;
  close: () => void;
};

type View = { x: number; y: number; scale: number };

const LightboxContext = createContext<LightboxContextValue | null>(null);

const OPEN_MS = 430;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const TOGGLE_SCALE = 2.5;
const PAD = 0.06; // viewport padding for fit

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox must be used within LightboxProvider");
  return ctx;
}

function toOrigin(rect?: OriginRect | DOMRect | null): OriginRect | null {
  if (!rect || rect.width < 2 || rect.height < 2) return null;
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

function fitSize(
  nw: number,
  nh: number,
  vw: number,
  vh: number,
): { w: number; h: number } {
  const maxW = vw * (1 - PAD * 2);
  const maxH = vh * (1 - PAD * 2);
  const scale = Math.min(maxW / nw, maxH / nh, 1);
  return { w: nw * scale, h: nh * scale };
}

function clampPan(view: View, fitW: number, fitH: number, vw: number, vh: number): View {
  const w = fitW * view.scale;
  const h = fitH * view.scale;
  const minX = w <= vw ? (vw - w) / 2 : vw - w;
  const maxX = w <= vw ? (vw - w) / 2 : 0;
  const minY = h <= vh ? (vh - h) / 2 : vh - h;
  const maxY = h <= vh ? (vh - h) / 2 : 0;
  return {
    scale: view.scale,
    x: Math.min(maxX, Math.max(minX, view.x)),
    y: Math.min(maxY, Math.max(minY, view.y)),
  };
}

function centeredView(fitW: number, fitH: number, vw: number, vh: number, scale = 1): View {
  return {
    scale,
    x: (vw - fitW * scale) / 2,
    y: (vh - fitH * scale) / 2,
  };
}

function zoomAtPoint(
  view: View,
  nextScale: number,
  px: number,
  py: number,
  fitW: number,
  fitH: number,
  vw: number,
  vh: number,
): View {
  const s0 = view.scale;
  const s1 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
  if (s1 === s0) return view;
  // Keep the content point under (px,py) stable
  const cx = (px - view.x) / s0;
  const cy = (py - view.y) / s0;
  const next = {
    scale: s1,
    x: px - cx * s1,
    y: py - cy * s1,
  };
  return clampPan(next, fitW, fitH, vw, vh);
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [closing, setClosing] = useState(false);
  const [items, setItems] = useState<LightboxItem[]>([]);
  const [index, setIndex] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [cursor, setCursor] = useState<"zoom-in" | "zoom-out" | "grab" | "grabbing">("zoom-in");
  const [reduced, setReduced] = useState(false);

  const originRef = useRef<OriginRect | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, scale: 1 });
  const targetRef = useRef<View>({ x: 0, y: 0, scale: 1 });
  const fitRef = useRef({ w: 1, h: 1, nw: 1, nh: 1 });
  const animatingRef = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    vx: number;
    vy: number;
    lx: number;
    ly: number;
    lt: number;
  } | null>(null);
  const pinchRef = useRef<{
    active: boolean;
    dist: number;
    scale: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const lastTap = useRef(0);
  const skipClick = useRef(false);

  const current = items[index];
  const canNav = items.length > 1;

  const applyFrame = useCallback((view: View, animate = false) => {
    const el = frameRef.current;
    if (!el) return;
    el.dataset.animating = animate ? "true" : "false";
    el.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
  }, []);

  const measureFit = useCallback((item: LightboxItem) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nw = item.width || 1600;
    const nh = item.height || 1600;
    const fit = fitSize(nw, nh, vw, vh);
    fitRef.current = { w: fit.w, h: fit.h, nw, nh };
    const el = frameRef.current;
    if (el) {
      el.style.width = `${fit.w}px`;
      el.style.height = `${fit.h}px`;
    }
    return { fit, vw, vh };
  }, []);

  const bumpUi = useCallback(() => {
    setUiVisible(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setUiVisible(false), 2200);
  }, []);

  const syncCursor = useCallback((view: View, dragging = false) => {
    if (dragging) setCursor("grabbing");
    else if (view.scale > 1.02) setCursor("grab");
    else setCursor("zoom-in");
  }, []);

  const lerpLoop = useCallback(() => {
    const v = viewRef.current;
    const t = targetRef.current;
    const k = 0.22;
    const nx = v.x + (t.x - v.x) * k;
    const ny = v.y + (t.y - v.y) * k;
    const ns = v.scale + (t.scale - v.scale) * k;
    const next = { x: nx, y: ny, scale: ns };
    const done =
      Math.abs(t.x - nx) < 0.15 &&
      Math.abs(t.y - ny) < 0.15 &&
      Math.abs(t.scale - ns) < 0.001;
    viewRef.current = done ? t : next;
    applyFrame(viewRef.current, false);
    if (!done && !animatingRef.current) {
      rafRef.current = requestAnimationFrame(lerpLoop);
    } else {
      rafRef.current = null;
      syncCursor(viewRef.current);
    }
  }, [applyFrame, syncCursor]);

  const setTarget = useCallback(
    (next: View, immediate = false) => {
      const { w, h } = fitRef.current;
      const clamped = clampPan(next, w, h, window.innerWidth, window.innerHeight);
      targetRef.current = clamped;
      if (immediate || reduced) {
        viewRef.current = clamped;
        applyFrame(clamped, false);
        syncCursor(clamped);
        return;
      }
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(lerpLoop);
      }
    },
    [applyFrame, lerpLoop, reduced, syncCursor],
  );

  const open = useCallback(
    ({ items: nextItems, index: nextIndex = 0, originRect }: OpenArgs) => {
      const filtered = nextItems.filter((i) => i.src);
      if (!filtered.length) return;
      const i = Math.min(Math.max(nextIndex, 0), filtered.length - 1);
      originRef.current = toOrigin(originRect);
      setItems(filtered);
      setIndex(i);
      setClosing(false);
      setOpenState(true);
      setUiVisible(true);
      bumpUi();
    },
    [bumpUi],
  );

  const close = useCallback(() => {
    if (!openState || closing) return;
    const origin = originRef.current;
    const { w, h } = fitRef.current;
    const el = frameRef.current;

    if (reduced || !origin || !el) {
      setOpenState(false);
      setClosing(false);
      return;
    }

    setClosing(true);
    animatingRef.current = true;
    // FLIP back to origin
    const sx = origin.width / w;
    const sy = origin.height / h;
    const s = Math.min(sx, sy);
    const ox = origin.x + (origin.width - w * s) / 2;
    const oy = origin.y + (origin.height - h * s) / 2;
    applyFrame({ x: ox, y: oy, scale: s }, true);
    window.setTimeout(() => {
      animatingRef.current = false;
      setOpenState(false);
      setClosing(false);
      viewRef.current = { x: 0, y: 0, scale: 1 };
      targetRef.current = viewRef.current;
    }, OPEN_MS);
  }, [applyFrame, closing, openState, reduced]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  // mount + reduced motion
  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // body lock
  useEffect(() => {
    if (!openState) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openState]);

  // keyboard
  useEffect(() => {
    if (!openState) return;
    function onKey(e: KeyboardEvent) {
      bumpUi();
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight" && canNav) {
        e.preventDefault();
        setIndex((v) => (v + 1) % items.length);
      } else if (e.key === "ArrowLeft" && canNav) {
        e.preventDefault();
        setIndex((v) => (v - 1 + items.length) % items.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openState, close, canNav, items.length, bumpUi]);

  // place image + FLIP open when open/index changes
  useEffect(() => {
    if (!openState || !current) return;
    const { fit, vw, vh } = measureFit(current);
    const end = centeredView(fit.w, fit.h, vw, vh, 1);
    const origin = originRef.current;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!reduced && origin && !closing) {
      const sx = origin.width / fit.w;
      const sy = origin.height / fit.h;
      const s = Math.min(sx, sy);
      const ox = origin.x + (origin.width - fit.w * s) / 2;
      const oy = origin.y + (origin.height - fit.h * s) / 2;
      const start = { x: ox, y: oy, scale: s };
      viewRef.current = start;
      targetRef.current = end;
      applyFrame(start, false);
      animatingRef.current = true;
      // next frame -> animate to end
      requestAnimationFrame(() => {
        applyFrame(end, true);
        window.setTimeout(() => {
          animatingRef.current = false;
          viewRef.current = end;
          targetRef.current = end;
          syncCursor(end);
        }, OPEN_MS);
      });
    } else {
      viewRef.current = end;
      targetRef.current = end;
      applyFrame(end, false);
      syncCursor(end);
    }
  }, [openState, current, measureFit, applyFrame, reduced, closing, syncCursor]);

  // reset view on slide change (not initial open handled above via index in same effect)
  // When index changes while open, re-run effect - good.

  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    bumpUi();
    if (animatingRef.current) return;
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    const nextScale = viewRef.current.scale * (1 + delta);
    const { w, h } = fitRef.current;
    const next = zoomAtPoint(
      viewRef.current,
      nextScale,
      e.clientX,
      e.clientY,
      w,
      h,
      window.innerWidth,
      window.innerHeight,
    );
    setTarget(next);
    setCursor(next.scale > 1.02 ? "grab" : "zoom-in");
  }

  function toggleZoom(clientX: number, clientY: number) {
    const { w, h } = fitRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const zoomed = viewRef.current.scale > 1.05;
    const nextScale = zoomed ? 1 : TOGGLE_SCALE;
    const next = zoomed
      ? centeredView(w, h, vw, vh, 1)
      : zoomAtPoint(viewRef.current, nextScale, clientX, clientY, w, h, vw, vh);
    // smooth via CSS transition for toggle
    animatingRef.current = true;
    viewRef.current = next;
    targetRef.current = next;
    applyFrame(next, !reduced);
    window.setTimeout(() => {
      animatingRef.current = false;
      syncCursor(next);
    }, OPEN_MS);
    setCursor(next.scale > 1.05 ? "zoom-out" : "zoom-in");
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    bumpUi();
    e.currentTarget.setPointerCapture(e.pointerId);
    if (viewRef.current.scale > 1.02) {
      dragRef.current = {
        active: true,
        moved: false,
        sx: e.clientX,
        sy: e.clientY,
        ox: viewRef.current.x,
        oy: viewRef.current.y,
        vx: 0,
        vy: 0,
        lx: e.clientX,
        ly: e.clientY,
        lt: performance.now(),
      };
      setCursor("grabbing");
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d?.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.hypot(dx, dy) > 3) d.moved = true;
    const now = performance.now();
    const dt = Math.max(now - d.lt, 1);
    d.vx = ((e.clientX - d.lx) / dt) * 16;
    d.vy = ((e.clientY - d.ly) / dt) * 16;
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.lt = now;
    const { w, h } = fitRef.current;
    const next = clampPan(
      { scale: viewRef.current.scale, x: d.ox + dx, y: d.oy + dy },
      w,
      h,
      window.innerWidth,
      window.innerHeight,
    );
    viewRef.current = next;
    targetRef.current = next;
    applyFrame(next, false);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (d?.active) {
      dragRef.current = null;
      if (d.moved) {
        skipClick.current = true;
        // inertia
        const { w, h } = fitRef.current;
        const next = clampPan(
          {
            scale: viewRef.current.scale,
            x: viewRef.current.x + d.vx * 8,
            y: viewRef.current.y + d.vy * 8,
          },
          w,
          h,
          window.innerWidth,
          window.innerHeight,
        );
        setTarget(next);
        setCursor("grab");
        return;
      }
    }

    const now = Date.now();
    if (now - lastTap.current < 280) {
      toggleZoom(e.clientX, e.clientY);
      lastTap.current = 0;
      skipClick.current = true;
      return;
    }
    lastTap.current = now;
  }

  function onStageClick(e: ReactMouseEvent<HTMLDivElement>) {
    bumpUi();
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    // click empty backdrop closes; click on image toggles zoom
    const frame = frameRef.current;
    if (frame) {
      const r = frame.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (!inside) {
        close();
        return;
      }
    }
    toggleZoom(e.clientX, e.clientY);
  }

  function onTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    bumpUi();
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchRef.current = {
        active: true,
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale: viewRef.current.scale,
      };
      dragRef.current = null;
    }
  }

  function onTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    const p = pinchRef.current;
    if (!p?.active || e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const midX = (a.clientX + b.clientX) / 2;
    const midY = (a.clientY + b.clientY) / 2;
    const { w, h } = fitRef.current;
    const next = zoomAtPoint(
      viewRef.current,
      p.scale * (dist / Math.max(p.dist, 1)),
      midX,
      midY,
      w,
      h,
      window.innerWidth,
      window.innerHeight,
    );
    viewRef.current = next;
    targetRef.current = next;
    applyFrame(next, false);
  }

  function onTouchEnd(e: ReactTouchEvent<HTMLDivElement>) {
    if (e.touches.length < 2) pinchRef.current = null;
  }

  const overlay =
    mounted &&
    createPortal(
      <div
        className={styles.overlay}
        data-open={openState ? "true" : "false"}
        data-closing={closing ? "true" : "false"}
        data-reduced={reduced ? "true" : "false"}
        data-ui={uiVisible ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-hidden={openState ? "false" : "true"}
        aria-label={current?.title || current?.alt || "Image viewer"}
      >
        <div className={styles.backdrop} onClick={close} />

        <div className={styles.chrome} data-side="top">
          <div>
            <p className={styles.meta}>
              {canNav ? `${index + 1} / ${items.length}` : "View"}
            </p>
            <p className={styles.title}>{current?.title || current?.alt}</p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close"
              onClick={close}
            >
              ×
            </button>
          </div>
        </div>

        <div
          ref={stageRef}
          className={styles.stage}
          data-cursor={cursor}
          onMouseMove={bumpUi}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onStageClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {current ? (
            <div ref={frameRef} className={styles.frame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBase(current.src)}
                alt={current.alt}
                draggable={false}
                sizes="100vw"
              />
            </div>
          ) : null}
        </div>

        <div className={styles.chrome} data-side="bottom">
          <p className={styles.meta}>Scroll to zoom · Esc</p>
          <div className={styles.nav}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Previous"
              disabled={!canNav}
              onClick={() => setIndex((v) => (v - 1 + items.length) % items.length)}
            >
              ←
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Next"
              disabled={!canNav}
              onClick={() => setIndex((v) => (v + 1) % items.length)}
            >
              →
            </button>
          </div>
        </div>
        <span className={styles.srOnly}>
          Double-click to zoom. Escape closes.
        </span>
      </div>,
      document.body,
    );

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {overlay}
    </LightboxContext.Provider>
  );
}

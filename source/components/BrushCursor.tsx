"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./BrushCursor.module.css";

type Pt = { x: number; y: number; w: number; t: number };

function allowedPointer(e: PointerEvent) {
  if (e.pointerType === "touch" || e.pointerType === "pen") return false;
  if (e.pointerType !== "mouse" && e.pointerType !== "") return false;
  return true;
}

function shouldIgnore(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [data-admin], [data-lightbox], [data-no-brush]",
    ),
  );
}

export function BrushCursor() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = canvasRef.current;
    const tip = cursorRef.current;
    if (!node || !tip) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const context = node.getContext("2d");
    if (!context) return;

    const canvas: HTMLCanvasElement = node;
    const cursor: HTMLDivElement = tip;
    const ctx: CanvasRenderingContext2D = context;

    function inkDab(x: number, y: number) {
      const host = dabRef.current;
      if (!host) return;
      const mark = document.createElement("span");
      mark.className = styles.dab;
      mark.style.left = `${x}px`;
      mark.style.top = `${y}px`;
      const tilt = Math.round((Math.random() - 0.5) * 24);
      mark.style.transform = `translate(-50%, -50%) rotate(${tilt}deg)`;
      host.appendChild(mark);
      const remove = () => mark.remove();
      mark.addEventListener("animationend", remove, { once: true });
      window.setTimeout(remove, 420);
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let drawing = false;
    let last: Pt | null = null;
    let prev: Pt | null = null;
    let lastT = 0;
    let fadeRaf = 0;
    let lastFade = 0;
    let enabled = false;
    let smoothSpeed = 0;
    let strokeAge = 0;
    let idleGap = 0;
    let seed = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    function setEnabled() {
      enabled =
        fine.matches &&
        !reduce.matches &&
        !window.matchMedia("(pointer: coarse)").matches &&
        document.documentElement.dataset.brush !== "off";
      document.documentElement.classList.toggle("has-brush-cursor", enabled);
      cursor.classList.toggle(styles.on, false);
      if (!enabled) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    function rand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function brushWidth(speed: number, age: number) {
      const minW = 0.85;
      const maxW = 16.5;
      // Faster motion → thinner tip (calligraphy pressure).
      const vel = Math.min(Math.max(speed / 1.85, 0), 1);
      const bySpeed = maxW - (maxW - minW) * vel ** 0.55;
      // Soft attack / taper over the first ~90ms of a continuous run.
      const attack = Math.min(age / 90, 1);
      const attackEase = attack * attack * (3 - 2 * attack);
      // Gentle tip fade when nearly still after motion.
      const tip = speed < 0.08 ? 0.72 + speed * 2.5 : 1;
      return Math.max(minW, bySpeed * (0.35 + 0.65 * attackEase) * tip);
    }

    function inkStroke(a: Pt, b: Pt, c: Pt) {
      const mx1 = (a.x + b.x) / 2;
      const my1 = (a.y + b.y) / 2;
      const mx2 = (b.x + c.x) / 2;
      const my2 = (b.y + c.y) / 2;

      // Width taper across the quadratic segment (start → mid → end).
      const wStart = (a.w + b.w) / 2;
      const wMid = b.w;
      const wEnd = (b.w + c.w) / 2;

      const nx = -(c.y - a.y);
      const ny = c.x - a.x;
      const nlen = Math.hypot(nx, ny) || 1;
      const ux = nx / nlen;
      const uy = ny / nlen;

      ctx.globalCompositeOperation = "source-over";

      // Draw as short overlapping stamps along the curve for natural taper.
      const steps = Math.max(4, Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 3.2));
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const omt = 1 - t;
        // Quadratic Bezier point using control b between midpoints… use a→b→c form:
        // sample along the already-smoothed midcurve via de Casteljau on (mx1,b,mx2)
        const x =
          omt * omt * mx1 + 2 * omt * t * b.x + t * t * mx2;
        const y =
          omt * omt * my1 + 2 * omt * t * b.y + t * t * my2;
        const w =
          omt * omt * wStart + 2 * omt * t * wMid + t * t * wEnd;

        // Core ink
        ctx.fillStyle = `rgba(10, 10, 10, ${0.55 + 0.28 * (1 - Math.abs(t - 0.5) * 0.35)})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.45, w * 0.48), 0, Math.PI * 2);
        ctx.fill();

        // Bristle / dry edge scatter
        const bristles = 2 + Math.floor(w / 5);
        for (let k = 0; k < bristles; k += 1) {
          const side = k % 2 === 0 ? 1 : -1;
          const spread = (0.18 + rand() * 0.55) * w * side;
          const along = (rand() - 0.5) * w * 0.25;
          const px = x + ux * spread + uy * along;
          const py = y + uy * spread - ux * along;
          const rw = Math.max(0.25, w * (0.08 + rand() * 0.16));
          ctx.fillStyle = `rgba(10, 10, 10, ${0.08 + rand() * 0.16})`;
          ctx.beginPath();
          ctx.arc(px, py, rw, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Smooth spine stroke for cohesion
      ctx.strokeStyle = "rgba(10, 10, 10, 0.42)";
      ctx.lineWidth = Math.max(0.7, wMid * 0.42);
      ctx.beginPath();
      ctx.moveTo(mx1, my1);
      ctx.quadraticCurveTo(b.x, b.y, mx2, my2);
      ctx.stroke();

      // Hairline fibrous edge
      const ox = ux * (wMid * 0.28);
      const oy = uy * (wMid * 0.28);
      ctx.strokeStyle = "rgba(10, 10, 10, 0.16)";
      ctx.lineWidth = Math.max(0.45, wMid * 0.22);
      ctx.beginPath();
      ctx.moveTo(mx1 + ox, my1 + oy);
      ctx.quadraticCurveTo(b.x + ox, b.y + oy, mx2 + ox, my2 + oy);
      ctx.stroke();
    }

    function fade(now: number) {
      fadeRaf = requestAnimationFrame(fade);
      if (!enabled) return;
      if (now - lastFade < 48) return;
      const dt = Math.min(now - lastFade, 120);
      lastFade = now;
      const alpha = 1 - Math.pow(0.001, dt / 4000);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(alpha * 1.15, 0.085)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    function moveCursor(x: number, y: number) {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursor.classList.add(styles.on);
    }

    function onPointerMove(e: PointerEvent) {
      if (!enabled) return;
      moveCursor(e.clientX, e.clientY);
      if (!allowedPointer(e)) return;
      if (shouldIgnore(e.target)) {
        last = null;
        prev = null;
        strokeAge = 0;
        idleGap = 0;
        document.body.classList.remove("is-inking");
        cursor.classList.remove(styles.down);
        return;
      }
      document.body.classList.add("is-inking");
      cursor.classList.toggle(styles.down, (e.buttons & 1) !== 0);

      const now = performance.now();
      const dt = Math.max(now - lastT, 6);
      if (last && now - last.t > 140) {
        // Gap → start a fresh tapered stroke
        last = null;
        prev = null;
        strokeAge = 0;
        smoothSpeed = 0;
      }

      const rawSpeed = last
        ? Math.hypot(e.clientX - last.x, e.clientY - last.y) / dt
        : 0;
      smoothSpeed = smoothSpeed * 0.72 + rawSpeed * 0.28;
      strokeAge += dt;

      const pt: Pt = {
        x: e.clientX,
        y: e.clientY,
        w: brushWidth(smoothSpeed, strokeAge),
        t: now,
      };

      if (prev && last) inkStroke(prev, last, pt);
      else if (last) inkStroke(last, last, pt);

      prev = last;
      last = pt;
      lastT = now;
      drawing = true;
      idleGap = 0;
    }

    function onPointerDown(e: PointerEvent) {
      if (!enabled || !allowedPointer(e) || e.button !== 0) return;
      if (shouldIgnore(e.target)) return;
      if (document.documentElement.dataset.dab !== "off") inkDab(e.clientX, e.clientY);
      drawing = true;
      document.body.classList.add("is-inking");
      cursor.classList.add(styles.down);
      strokeAge = 0;
      smoothSpeed = 0;
      const now = performance.now();
      const pt: Pt = { x: e.clientX, y: e.clientY, w: 9, t: now };
      prev = null;
      last = pt;
      lastT = now;
      moveCursor(e.clientX, e.clientY);
    }

    function releasePress() {
      cursor.classList.remove(styles.down);
    }

    function endStroke() {
      last = null;
      prev = null;
      drawing = false;
      strokeAge = 0;
      smoothSpeed = 0;
      document.body.classList.remove("is-inking");
      cursor.classList.remove(styles.down);
    }

    function onPointerOver() {
      if (enabled) cursor.classList.add(styles.on);
    }

    function onPointerLeave() {
      cursor.classList.remove(styles.on);
      endStroke();
    }

    resize();
    setEnabled();
    lastFade = performance.now();
    fadeRaf = requestAnimationFrame(fade);

    window.addEventListener("a0001-settings", setEnabled);
    window.addEventListener("resize", resize);
    fine.addEventListener("change", setEnabled);
    reduce.addEventListener("change", setEnabled);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", releasePress, { passive: true });
    window.addEventListener("pointercancel", releasePress, { passive: true });
    document.addEventListener("mouseenter", onPointerOver);
    document.addEventListener("mouseleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(fadeRaf);
      document.documentElement.classList.remove("has-brush-cursor");
      document.body.classList.remove("is-inking");
      window.removeEventListener("a0001-settings", setEnabled);
      window.removeEventListener("resize", resize);
      fine.removeEventListener("change", setEnabled);
      reduce.removeEventListener("change", setEnabled);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", releasePress);
      window.removeEventListener("pointercancel", releasePress);
      document.removeEventListener("mouseenter", onPointerOver);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <canvas ref={canvasRef} className={styles.ink} aria-hidden="true" />
      <div ref={dabRef} className={styles.dabs} aria-hidden="true" />
      <div ref={cursorRef} className={styles.cursor} aria-hidden="true">
        <svg className={styles.tip} viewBox="0 0 32 32" width="28" height="28">
          <path
            d="M3.8 29.2c1.6-1.2 4.2-4.4 8.6-12.6C17.2 7.2 21.4 3.4 25.6 4.2c.9 3.8-2.2 8.2-12.4 16.6-4.6 3.8-7.2 6.4-9.4 8.4Z"
            fill="currentColor"
          />
          <path
            d="M23.2 5.1c2.4 1.1 4 3.3 3.4 5.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          <path d="M24.6 3.4l2.4 1.4-1.1 2.1-2.6-1.3z" fill="currentColor" opacity="0.85" />
        </svg>
      </div>
    </>
  );
}

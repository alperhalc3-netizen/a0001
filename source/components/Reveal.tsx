"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./Reveal.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Play on mount (above-the-fold intro) instead of waiting for scroll */
  eager?: boolean;
};

export function Reveal({ children, className = "", delay = 0, eager = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    if (eager) {
      const id = window.setTimeout(() => setVisible(true), Math.max(delay, 16));
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px 12% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, delay]);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${className}`.trim()}
      data-visible={visible ? "true" : "false"}
      style={
        {
          transitionDelay: eager ? "0ms" : `${delay}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

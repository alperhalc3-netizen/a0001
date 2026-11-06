"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import styles from "./TextReveal.module.css";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  mode?: "words" | "line";
  delay?: number;
  stagger?: number;
  eager?: boolean;
};

export function TextReveal({
  text,
  as: Tag = "span",
  className = "",
  id,
  mode = "words",
  delay = 0,
  stagger = 40,
  eager = false,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    if (eager) {
      const id = window.setTimeout(() => setVisible(true), 16);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px 10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, delay]);

  const parts =
    mode === "line"
      ? [text]
      : text.split(/(\s+)/).filter((part) => part.length > 0);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`${styles.root} ${className}`.trim()}
      data-visible={visible ? "true" : "false"}
    >
      {parts.map((part, index) => {
        if (/^\s+$/.test(part)) {
          return <span key={`s-${index}`}>{part}</span>;
        }
        const style = {
          transitionDelay: `${delay + index * stagger}ms`,
        } as CSSProperties;
        return (
          <span key={`${part}-${index}`} className={styles.mask}>
            <span className={styles.inner} style={style}>
              {part}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

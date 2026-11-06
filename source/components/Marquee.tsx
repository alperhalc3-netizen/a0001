"use client";

import { useEffect, useState } from "react";
import styles from "./Marquee.module.css";

type Props = {
  items: string[];
  label?: string;
  durationSec?: number;
};

export function Marquee({
  items,
  label = "Studio band",
  durationSec = 36,
}: Props) {
  const [paused, setPaused] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimate(false);
      setPaused(true);
      return;
    }
    setAnimate(true);
  }, []);

  const loop = [...items, ...items];

  return (
    <section className={styles.band} aria-label={label}>
      <div className={styles.head}>
        <p className={`meta ${styles.chip}`}>A/0001 — Band</p>
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          <span className={styles.icon} aria-hidden="true">
            {paused ? "▶" : "❚❚"}
          </span>
          {paused ? "Play band" : "Pause band"}
        </button>
      </div>
      <div
        className={styles.marquee}
        data-animate={animate ? "true" : "false"}
        data-paused={paused ? "true" : "false"}
        style={{ ["--dur" as string]: `${durationSec}s` }}
      >
        <ul className={styles.track}>
          {loop.map((item, index) => (
            <li key={`${item}-${index}`} aria-hidden={index >= items.length}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

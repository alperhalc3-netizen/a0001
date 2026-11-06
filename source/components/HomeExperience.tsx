"use client";

import { basePath, withBase } from "@/lib/basePath";
import { useEditorSettings } from "@/components/editor/SettingsProvider";
import type { SectionId } from "@/lib/editor/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  shopCategoryLabel,
  site,
  workCategoryLabel,
  type Artwork,
  type Product,
  type TattooPiece,
} from "@/lib/content";
import styles from "./HomeExperience.module.css";

type Props = {
  works: Artwork[];
  tattoos: TattooPiece[];
  products: Product[];
};

type Placed = { left: number; top: number; width: number; height: number };

function orderedBy<T extends { slug: string }>(items: T[], order: string[]) {
  if (!order.length) return items;
  const map = new Map(items.map((item) => [item.slug, item]));
  const picked = order.flatMap((slug) => {
    const item = map.get(slug);
    return item ? [item] : [];
  });
  return [...picked, ...items.filter((item) => !order.includes(item.slug))];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function placeWorks(items: Artwork[], width: number, height: number): Placed[] {
  const margin = width < 768 ? 20 : 32;
  const cell = (width - 2 * margin) / 12;
  const phone = width <= 767 || width / Math.max(height, 1) <= 0.8;
  const narrow = !phone && width < 1200;
  const columns = phone
    ? { n: [10, 10, 10, 10, 12], x: [0, 11, 22, 33, 44] }
    : narrow
      ? { n: [4, 5, 4, 5, 7], x: [0, 5, 11, 16, 22] }
      : { n: [3, 4, 3, 4, 6], x: [0, 4, 9, 13, 18] };
  const anchors = ["T", "B", "M", "T", "B"];
  return items.map((item, index) => {
    const slot = index % 5;
    const span = columns.n[slot];
    const column = columns.x[slot];
    const frameWidth = span * cell;
    const ratio = item.imageWidth > 0 && item.imageHeight > 0 ? item.imageWidth / item.imageHeight : 0.72;
    const frameHeight = frameWidth / ratio;
    const anchor = phone ? "M" : anchors[slot];
    const top =
      anchor === "T" ? height * 0.14 : anchor === "B" ? height * 0.86 - frameHeight : height * 0.5 - frameHeight / 2;
    return { left: margin + column * cell, top, width: frameWidth, height: frameHeight };
  });
}

export function HomeExperience({ works, tattoos, products }: Props) {
  const router = useRouter();
  const { settings, localImages } = useEditorSettings();
  const doorRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef(0);
  const [active, setActive] = useState(0);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const drop = products.find((item) => item.slug === settings.newDropSlug) ?? products[0] ?? null;
  const orderedWorks = orderedBy(works, settings.worksOrder);
  const shopProducts = orderedBy(
    products.filter((item) => item.slug !== drop?.slug),
    settings.shopOrder,
  ).slice(0, 3);
  const shown = (id: SectionId) => settings.sections.includes(id) && !settings.hidden.includes(id);
  const dropSrc = localImages.newDrop
    ? localImages.newDrop
    : withBase(settings.newDropImage || drop?.image || "");
  const lines = settings.text.tagline.replace(/\.$/, "").split(". ").map((line) => line.trim()).filter(Boolean);
  const placed = placeWorks(orderedWorks, viewport.width, viewport.height);
  const span = placed.reduce((max, item) => Math.max(max, item.left + item.width), viewport.width) - viewport.width + 48;

  useEffect(() => {
    function measure() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    if (reduce || !fine) return;
    let target = window.scrollY;
    let current = window.scrollY;
    let frame = 0;
    let last = 0;
    function tick(now: number) {
      frame = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      current += (target - current) * (1 - Math.exp(-dt / 0.28));
      if (Math.abs(target - current) < 0.4) current = target;
      window.scrollTo(0, current);
      if (current !== target) frame = requestAnimationFrame(tick);
    }
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      const cream = document.getElementById("cream-close");
      const creamBox = cream?.getBoundingClientRect();
      if (event.deltaY > 0 && creamBox && creamBox.top < 48 && creamBox.bottom <= window.innerHeight + 8) {
        target = 0;
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        target = clamp(target + event.deltaY, 0, Math.max(0, max));
      }
      event.preventDefault();
      if (!frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    function render() {
      frame = 0;
      const door = doorRef.current;
      const scene = sceneRef.current;
      const track = trackRef.current;
      const height = window.innerHeight;
      if (door && !reduce) {
        const top = door.getBoundingClientRect().top;
        const progress = clamp(-top / height - 0.35, 0, 1.95);
        const cover = smoothstep(0, 1.5, progress);
        const arrive = smoothstep(1.25, 1.65, progress);
        door.style.setProperty("--cover", cover.toFixed(3));
        door.style.setProperty("--arrive", arrive.toFixed(3));
        root.dataset.nav = cover >= 0.985 ? "on" : "off";
      } else {
        root.dataset.nav = "on";
      }
      if (scene && track) {
        const rect = scene.getBoundingClientRect();
        const travel = Math.max(1, scene.offsetHeight - height);
        const progress = clamp(-rect.top / travel, 0, 1);
        const shift = progress * span + drag.current;
        track.style.transform = `translate3d(${(-shift).toFixed(1)}px, 0, 0)`;
        const cards = [...track.querySelectorAll<HTMLElement>("[data-card]")];
        const mid = shift + viewport.width * 0.35;
        let index = 0;
        cards.forEach((card, i) => {
          if (card.offsetLeft <= mid) index = i;
        });
        setActive(index);
      }
      const cream = document.getElementById("cream-close");
      if (cream) {
        root.dataset.theme = cream.getBoundingClientRect().top < height * 0.4 ? "creme" : "noir";
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.dataset.nav = "on";
      delete root.dataset.theme;
    };
  }, [span, viewport.width]);

  function nudge(direction: number) {
    drag.current = Math.max(0, drag.current + direction * viewport.width * 0.45);
    window.dispatchEvent(new Event("scroll"));
  }

  function fly(event: React.MouseEvent<HTMLAnchorElement>, image: HTMLImageElement | null) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!image) return;
    event.preventDefault();
    const href = event.currentTarget.getAttribute("href") || "/";
    const from = image.getBoundingClientRect();
    const phone = window.innerWidth < 768;
    const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : from.width / from.height;
    const toWidth = phone ? Math.min(window.innerWidth - 40, window.innerHeight * 0.5 * ratio) : Math.min(window.innerWidth * 0.48, window.innerHeight * 0.72 * ratio);
    const toHeight = toWidth / ratio;
    const toX = phone ? (window.innerWidth - toWidth) / 2 : window.innerWidth * 0.72 - toWidth / 2;
    const toY = phone ? 90 : Math.max(120, (window.innerHeight - toHeight) / 2);
    const layer = document.createElement("div");
    layer.className = "project-flight";
    const veil = document.createElement("div");
    veil.className = "project-flight__veil";
    const frame = document.createElement("div");
    frame.className = "project-flight__frame";
    const clone = document.createElement("img");
    clone.src = image.currentSrc || image.src;
    clone.alt = "";
    frame.append(clone);
    layer.append(veil, frame);
    document.body.append(layer);
    const duration = Math.min(1050, 650 + Math.hypot(toX - from.left, toY - from.top) * 0.3);
    const start = performance.now();
    function draw(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const u = 1 - (1 - t) ** 3;
      frame.style.transform = `translate3d(${from.left + (toX - from.left) * u}px, ${from.top + (toY - from.top) * u}px, 0)`;
      frame.style.width = `${from.width + (toWidth - from.width) * u}px`;
      frame.style.height = `${from.height + (toHeight - from.height) * u}px`;
      veil.style.opacity = String(u);
      if (t < 1) requestAnimationFrame(draw);
      else {
        const path = basePath && href.startsWith(basePath) ? href.slice(basePath.length) || "/" : href;
        router.push(path);
      }
    }
    requestAnimationFrame(draw);
  }

  const blocks: Record<SectionId, React.ReactNode> = {
    hero: (
      <section className={styles.door} id="top" data-panel ref={doorRef}>
        <div className={styles.doorScreen}>
          <div className={styles.markGrow} aria-hidden="true">
            <Image src={withBase("/brand/logo.jpg")} alt="" width={970} height={847} className={styles.mark} />
          </div>
          <h1 className={styles.phrase}>
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={styles.announce}>{settings.text.announce}</p>
        </div>
      </section>
    ),
    works: (
      <section className={styles.scene} id="works" data-panel ref={sceneRef}>
        <div className={styles.sceneScreen}>
          <div className={styles.grid} aria-hidden="true">
            {Array.from({ length: 13 }, (_, index) => {
              const margin = viewport.width < 768 ? 20 : 32;
              return (
                <i key={index} style={{ left: `calc(${margin}px + (100% - ${margin * 2}px) * ${index} / 12)` }} />
              );
            })}
          </div>
          <div className={styles.galleryHead}>
            <span>Selected work</span>
            <span>
              {String(Math.min(active + 1, Math.max(orderedWorks.length, 1))).padStart(2, "0")} / {String(orderedWorks.length).padStart(2, "0")}
            </span>
          </div>
          <div
            className={styles.stage}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              const startX = event.clientX;
              const origin = drag.current;
              const pointer = event.pointerId;
              function move(next: PointerEvent) {
                if (next.pointerId !== pointer) return;
                drag.current = Math.max(0, origin - (next.clientX - startX));
                window.dispatchEvent(new Event("scroll"));
              }
              function up(next: PointerEvent) {
                if (next.pointerId !== pointer) return;
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              }
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
          >
            <div className={styles.track} ref={trackRef}>
              {orderedWorks.map((item, index) => {
                const box = placed[index];
                return (
                  <article key={item.slug} data-card className={styles.item} style={{ left: box.left, top: box.top, width: box.width }}>
                    <Link
                      href={`/works/${item.slug}`}
                      className={styles.card}
                      onClick={(event) => fly(event, event.currentTarget.querySelector("img"))}
                    >
                      <span className={styles.frame} style={{ height: box.height }}>
                        <Image
                          src={withBase(item.image)}
                          alt={item.title}
                          width={item.imageWidth}
                          height={item.imageHeight}
                          sizes="40vw"
                          priority={index < 2}
                        />
                      </span>
                      <span className={styles.caption}>
                        <span>{item.title}</span>
                        <span aria-hidden="true">→</span>
                        <span>{workCategoryLabel(item.category)}</span>
                      </span>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
          <div className={styles.commands}>
            <button type="button" onClick={() => nudge(-1)} aria-label="Previous">←</button>
            <button type="button" onClick={() => nudge(1)} aria-label="Next">→</button>
            <span>Drag</span>
          </div>
        </div>
      </section>
    ),
    newDrop: drop ? (
      <section className={styles.drop} id="new-drop" data-panel>
        <Link href={`/shop/${drop.slug}`} className={styles.dropLink} aria-label={`${settings.text.newDropLabel}, ${drop.title}`}>
          <Image src={dropSrc} alt="" width={96} height={96} sizes="52px" className={styles.dropThumb} />
          <span className={styles.dropLabel}>{settings.text.newDropLabel}</span>
        </Link>
      </section>
    ) : null,
    tattoo: (
      <section className={styles.split} id="tattoo" data-panel>
        <h2>Tattoo</h2>
        <p>Selected tattoo work, kept apart from the drawings and objects.</p>
        <Link href="/tattoo">Open tattoo →</Link>
        {tattoos[0]?.image ? (
          <Image src={withBase(tattoos[0].image)} alt={tattoos[0].title} width={tattoos[0].imageWidth} height={tattoos[0].imageHeight} sizes="40vw" />
        ) : null}
      </section>
    ),
    shop: (
      <section className={styles.split} id="shop" data-panel>
        <h2>Shop</h2>
        <p>{site.shippingNote} Purchases are completed on Shopier.</p>
        <Link href="/shop">Open shop →</Link>
        <div className={styles.shopRow}>
          {shopProducts.map((item) => (
            <Link key={item.slug} href={`/shop/${item.slug}`}>
              <Image src={withBase(item.image)} alt={item.title} width={item.imageWidth} height={item.imageHeight} sizes="30vw" />
              <span>{item.title}</span>
              <span>{shopCategoryLabel(item.category)}</span>
            </Link>
          ))}
        </div>
      </section>
    ),
    outro: (
      <section className={styles.contact} id="hello" data-panel>
        <p className={styles.kicker}>Contact</p>
        <h2>{settings.text.outroTitle}</h2>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <p className={styles.kicker}>{site.location}</p>
      </section>
    ),
  };

  return (
    <div className={styles.page} data-home-reel>
      {settings.sections.map((id) => (shown(id) ? <div key={id}>{blocks[id]}</div> : null))}
      <section className={styles.cream} id="cream-close" aria-label="Next pass">
        <Image src={withBase("/brand/logo.jpg")} alt="" width={970} height={847} className={styles.creamMark} />
      </section>
    </div>
  );
}

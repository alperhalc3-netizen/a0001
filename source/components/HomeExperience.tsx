"use client";

import { withBase } from "@/lib/basePath";
import { useEditorSettings } from "@/components/editor/SettingsProvider";
import type { SectionId } from "@/lib/editor/types";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
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

function orderedBy<T extends { slug: string }>(items: T[], order: string[]) {
  if (!order.length) return items;
  const map = new Map(items.map((item) => [item.slug, item]));
  const picked = order.flatMap((slug) => {
    const item = map.get(slug);
    return item ? [item] : [];
  });
  const rest = items.filter((item) => !order.includes(item.slug));
  return [...picked, ...rest];
}


export function HomeExperience({ works, tattoos, products }: Props) {
  const { settings, localImages } = useEditorSettings();
  const reelRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = reelRef.current;
    if (!node) return;
    const reel: HTMLDivElement = node;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia(
      "(min-width: 900px) and (min-aspect-ratio: 1/1) and (hover: hover) and (pointer: fine)",
    );

    let target = 0;
    let current = 0;
    let raf = 0;
    let ticking = false;

    function maxScroll() {
      return Math.max(0, reel.scrollWidth - reel.clientWidth);
    }

    function applyMode() {
      const on = desktop.matches;
      document.documentElement.classList.toggle("home-desktop", on);
      current = reel.scrollLeft;
      target = current;
    }

    function loop() {
      ticking = true;
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.35) current = target;
      reel.scrollLeft = current;
      if (Math.abs(target - current) > 0.35) {
        raf = requestAnimationFrame(loop);
      } else {
        ticking = false;
      }
    }

    function onWheel(event: WheelEvent) {
      if (!desktop.matches) return;
      if (event.ctrlKey) return;
      if (document.documentElement.classList.contains("is-index")) return;
      if (document.querySelector("[data-lightbox][data-open='true']")) return;
      event.preventDefault();
      target = Math.min(
        maxScroll(),
        Math.max(0, target + event.deltaY + event.deltaX),
      );
      if (!ticking) raf = requestAnimationFrame(loop);
    }

    function onKey(event: KeyboardEvent) {
      if (!desktop.matches) return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      event.preventDefault();
      const step = window.innerWidth * 0.72;
      target = Math.min(
        maxScroll(),
        Math.max(0, target + (event.key === "ArrowRight" ? step : -step)),
      );
      if (!ticking) raf = requestAnimationFrame(loop);
    }

    function updateRail() {
      const rail = railRef.current;
      if (!rail) return;
      const panels = [...reel.querySelectorAll<HTMLElement>("[data-panel]")];
      if (!panels.length) return;
      const mid = reel.scrollLeft + reel.clientWidth / 2;
      let active = 0;
      panels.forEach((panel, index) => {
        const left = panel.offsetLeft;
        const right = left + panel.offsetWidth;
        if (mid >= left && mid < right) active = index;
      });
      rail.querySelectorAll("[data-tick]").forEach((tick, index) => {
        tick.classList.toggle(styles.tickOn, index === active);
      });
    }

    function onScroll() {
      if (!ticking) {
        current = reel.scrollLeft;
        target = current;
      }
      updateRail();
    }

    applyMode();
    updateRail();
    desktop.addEventListener("change", applyMode);
    reduce.addEventListener("change", applyMode);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    reel.addEventListener("scroll", onScroll, { passive: true });

    const observe = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add(styles.in);
        }
      },
      { root: desktop.matches ? reel : null, threshold: 0.35 },
    );
    reel.querySelectorAll("[data-reveal]").forEach((node) => observe.observe(node));

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("home-desktop");
      desktop.removeEventListener("change", applyMode);
      reduce.removeEventListener("change", applyMode);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      reel.removeEventListener("scroll", onScroll);
      observe.disconnect();
    };
  }, []);

  const drop = products.find((item) => item.slug === settings.newDropSlug) ?? products[0] ?? null;
  const orderedWorks = orderedBy(works, settings.worksOrder);
  const shopProducts = orderedBy(
    products.filter((item) => item.slug !== drop?.slug),
    settings.shopOrder,
  ).slice(0, 3);
  const shown = (id: SectionId) => settings.sections.includes(id) && !settings.hidden.includes(id);
  const panelCount =
    (shown("hero") ? 1 : 0) +
    (shown("newDrop") && drop ? 1 : 0) +
    (shown("works") ? orderedWorks.length : 0) +
    (shown("tattoo") && tattoos.length ? 1 : 0) +
    (shown("shop") && shopProducts.length ? 1 : 0) +
    (shown("outro") ? 1 : 0);
  const dropSrc = localImages.newDrop
    ? localImages.newDrop
    : withBase(settings.newDropImage || drop?.image || "");

  return (
    <div className={styles.root} data-home-reel>
      <div className={styles.rail} ref={railRef} aria-hidden="true">
        <div className={styles.railLine} />
        {Array.from({ length: panelCount }, (_, index) => (
          <i
            key={index}
            data-tick
            className={`${styles.tick} ${index === 0 ? styles.tickOn : ""}`}
            style={{ left: `${(index / Math.max(panelCount - 1, 1)) * 100}%` }}
          />
        ))}
      </div>

      <div className={styles.reel} ref={reelRef} tabIndex={-1}>
        <div className={styles.track}>
          {settings.sections.map((id) => {
            if (!shown(id)) return null;
            if (id === "hero") {
              return (
            <section key={id} className={`${styles.panel} ${styles.hero}`} data-panel id="top">
              <h1 className={styles.sr}>
                {settings.text.name}. {settings.text.tagline} {site.description}
              </h1>
              <p className={styles.heroRole}>{settings.text.announce}</p>
            </section>
              );
            }
            if (id === "newDrop" && drop) {
              return (
            <section key={id} className={`${styles.panel} ${styles.drop}`} data-panel data-reveal id="new-drop">
              <Link
                href={`/shop/${drop.slug}`}
                className={styles.dropLink}
                aria-label={`${settings.text.newDropLabel}, ${drop.title}`}
              >
                <Image
                  src={dropSrc}
                  alt=""
                  width={96}
                  height={96}
                  sizes="52px"
                  className={styles.dropThumb}
                  priority
                />
                <span className={styles.dropLabel}>{settings.text.newDropLabel}</span>
              </Link>
            </section>
              );
            }
            if (id === "works") {
              return orderedWorks.map((item, index) => (
            <section
              key={item.slug}
              className={`${styles.panel} ${styles.set}`}
              data-panel
              data-reveal
              id={item.slug}
            >
              <header className={styles.setHead}>
                <p className={styles.setIndex}>
                  {String(index + 1).padStart(2, "0")} / {String(orderedWorks.length).padStart(2, "0")}
                </p>
                <h2 className={styles.setTitle}>{item.title}</h2>
                <p className={styles.setLine}>
                  {item.description || `${item.medium}. ${workCategoryLabel(item.category)}.`}
                </p>
                <dl className={styles.setMeta}>
                  <div>
                    <dt className={styles.sr}>Year</dt>
                    <dd>{item.year}</dd>
                  </div>
                  <div>
                    <dt className={styles.sr}>Medium</dt>
                    <dd>{item.medium}</dd>
                  </div>
                </dl>
                <Link href={`/works/${item.slug}`} className={styles.setLink}>
                  Open work <i aria-hidden="true">↗</i>
                </Link>
              </header>
              <div className={styles.plates}>
                <Link href={`/works/${item.slug}`} className={`${styles.plate} ${styles.plateLead}`}>
                  <span className={styles.develop}>
                    <Image
                      src={withBase(item.image)}
                      alt={item.title}
                      width={item.imageWidth}
                      height={item.imageHeight}
                      sizes="(min-width: 900px) 48vw, 100vw"
                      priority={index < 2}
                    />
                  </span>
                  <span className={styles.caption}>
                    {workCategoryLabel(item.category)}
                  </span>
                </Link>
              </div>
            </section>
          ));
            }
            if (id === "tattoo" && tattoos.length > 0) {
              return (
            <section key={id} className={`${styles.panel} ${styles.set}`} data-panel data-reveal id="tattoo">
              <header className={styles.setHead}>
                <p className={styles.setIndex}>Tattoo</p>
                <h2 className={styles.setTitle}>Skin &amp; line</h2>
                <Link href="/tattoo" className={styles.setLink}>
                  Open tattoo <i aria-hidden="true">↗</i>
                </Link>
              </header>
              <div className={styles.plates}>
                {tattoos.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/tattoo/${item.slug}`}
                    className={styles.plate}
                  >
                    <span className={styles.develop}>
                      <Image
                        src={withBase(item.image)}
                        alt={item.title}
                        width={item.imageWidth}
                        height={item.imageHeight}
                        sizes="(min-width: 900px) 28vw, 90vw"
                      />
                    </span>
                    <span className={styles.caption}>{item.title}</span>
                  </Link>
                ))}
              </div>
            </section>
              );
            }
            if (id === "shop" && shopProducts.length > 0) {
              return (
            <section key={id} className={`${styles.panel} ${styles.set}`} data-panel data-reveal id="shop">
              <header className={styles.setHead}>
                <p className={styles.setIndex}>Shop</p>
                <h2 className={styles.setTitle}>Available work</h2>
                <p className={styles.setLine}>
                  {site.shippingNote} Purchases are completed on Shopier.
                </p>
                <Link href="/shop" className={styles.setLink}>
                  Open shop <i aria-hidden="true">↗</i>
                </Link>
              </header>
              <div className={styles.plates}>
                {shopProducts.map((item) => (
                  <Link key={item.slug} href={`/shop/${item.slug}`} className={styles.plate}>
                    <span className={styles.develop}>
                      <Image
                        src={withBase(item.image)}
                        alt={item.title}
                        width={item.imageWidth}
                        height={item.imageHeight}
                        sizes="(min-width: 900px) 28vw, 90vw"
                      />
                    </span>
                    <span className={styles.caption}>{shopCategoryLabel(item.category)}</span>
                  </Link>
                ))}
              </div>
            </section>
              );
            }
            if (id === "outro") {
              return (
          <section key={id} className={`${styles.panel} ${styles.outro}`} data-panel data-reveal id="hello">
            <h2 className={styles.outroBig}>
              {settings.text.outroTitle}
              <span className={styles.wmDot} />
            </h2>
            <div className={styles.outroLinks}>
              <a href={`mailto:${site.email}`}>
                {site.email} <i aria-hidden="true">↗</i>
              </a>
              <Link href="/contact">
                Contact <i aria-hidden="true">↗</i>
              </Link>
              <Link href="/about">
                About <i aria-hidden="true">↗</i>
              </Link>
            </div>
          </section>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

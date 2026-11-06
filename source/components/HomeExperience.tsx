"use client";

import { withBase } from "@/lib/basePath";
import { useEditorSettings } from "@/components/editor/SettingsProvider";
import type { SectionId } from "@/lib/editor/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  return [...picked, ...items.filter((item) => !order.includes(item.slug))];
}

export function HomeExperience({ works, tattoos, products }: Props) {
  const { settings, localImages } = useEditorSettings();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
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
  const lines = settings.text.tagline
    .replace(/\.$/, "")
    .split(". ")
    .map((line) => line.trim())
    .filter(Boolean);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const el: HTMLDivElement = node;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let pointer = -1;

    function onDown(event: PointerEvent) {
      if (event.button !== 0) return;
      dragging = true;
      pointer = event.pointerId;
      startX = event.clientX;
      startLeft = el.scrollLeft;
    }
    function onMove(event: PointerEvent) {
      if (!dragging || event.pointerId !== pointer) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 8) el.setPointerCapture(pointer);
      el.scrollLeft = startLeft - delta;
    }
    function onUp(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      dragging = false;
    }
    function onScroll() {
      const cards = [...el.querySelectorAll<HTMLElement>("[data-card]")];
      const mid = el.scrollLeft + el.clientWidth * 0.35;
      let index = 0;
      cards.forEach((card, i) => {
        if (card.offsetLeft <= mid) index = i;
      });
      setActive(index);
    }
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("scroll", onScroll);
    };
  }, [orderedWorks.length, shown("works")]);

  function step(direction: number) {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.72, behavior: "smooth" });
  }

  const blocks: Record<SectionId, React.ReactNode> = {
    hero: (
      <section className={styles.intro} id="top" data-panel>
        <p className={styles.kicker}>Scroll</p>
        <h1 className={styles.phrase}>
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className={styles.announce}>{settings.text.announce}</p>
      </section>
    ),
    works: (
      <section className={styles.gallery} id="works" data-panel>
        <div className={styles.galleryHead}>
          <span>Selected work</span>
          <span>
            {String(active + 1).padStart(2, "0")} / {String(orderedWorks.length).padStart(2, "0")}
          </span>
        </div>
        <div className={styles.scroller} ref={scroller}>
          <ol className={styles.track}>
            {orderedWorks.map((item, index) => (
              <li key={item.slug} data-card>
                <Link href={`/works/${item.slug}`} className={styles.card}>
                  <span className={styles.frame}>
                    <Image
                      src={withBase(item.image)}
                      alt={item.title}
                      width={item.imageWidth}
                      height={item.imageHeight}
                      sizes="(max-width: 767px) 78vw, 28vw"
                      priority={index < 2}
                    />
                  </span>
                  <span className={styles.caption}>
                    <span>{item.title}</span>
                    <span aria-hidden="true">→</span>
                    <span>{workCategoryLabel(item.category)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.commands}>
          <button type="button" onClick={() => step(-1)} aria-label="Previous">
            ←
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next">
            →
          </button>
          <span>Drag</span>
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
    </div>
  );
}

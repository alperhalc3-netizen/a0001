"use client";

import { withBase } from "@/lib/basePath";

import Image from "next/image";
import { useRef } from "react";
import { useLightbox, type LightboxItem } from "./LightboxProvider";

type Props = {
  src: string;
  alt: string;
  title?: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  gallery?: LightboxItem[];
  galleryIndex?: number;
};

export function DetailLightboxImage({
  src,
  alt,
  title,
  width,
  height,
  sizes = "(min-width: 900px) 55vw, 100vw",
  priority,
  gallery,
  galleryIndex = 0,
}: Props) {
  const { open } = useLightbox();
  const ref = useRef<HTMLButtonElement>(null);

  function openLightbox() {
    const items =
      gallery && gallery.length
        ? gallery
        : [{ src, alt, title: title || alt, width, height }];
    const img = ref.current?.querySelector("img");
    const originRect = (img ?? ref.current)?.getBoundingClientRect() ?? null;
    open({ items, index: galleryIndex, originRect });
  }

  return (
    <button
      ref={ref}
      type="button"
      className="detail-image detail-image--button"
      onClick={openLightbox}
      aria-label={`Open ${title || alt} larger`}
    >
      <Image
        src={withBase(src)}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
      />
    </button>
  );
}

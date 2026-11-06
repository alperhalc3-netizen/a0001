"use client";

import { withBase } from "@/lib/basePath";

import Image from "next/image";
import Link from "next/link";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { Reveal } from "./Reveal";

type Props = {
  href: string;
  title: string;
  label: string;
  meta: string;
  aspect: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  delay?: number;
  className?: string;
  eager?: boolean;
};

export function ArchiveCard({
  href,
  title,
  label,
  meta,
  aspect,
  image,
  imageWidth = 916,
  imageHeight = 916,
  delay = 0,
  className,
  eager = false,
}: Props) {
  return (
    <Reveal delay={delay} eager={eager} className={className}>
      <article>
        <Link href={href} className="entry">
          {image ? (
            <div className="media-photo">
              <Image
                src={withBase(image)}
                alt={title}
                width={imageWidth}
                height={imageHeight}
                sizes="(min-width: 1100px) 33vw, (min-width: 720px) 50vw, 100vw"
              />
            </div>
          ) : (
            <MediaPlaceholder label={label} title={title} aspect={aspect} />
          )}
          <div className="entry-caption">
            <h2>{title}</h2>
            <p className="meta">{meta}</p>
          </div>
        </Link>
      </article>
    </Reveal>
  );
}

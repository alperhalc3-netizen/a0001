import { withBase } from "@/lib/basePath";
import type { Metadata } from "next";
import Link from "next/link";
import { DetailLightboxImage } from "@/components/DetailLightboxImage";
import { notFound } from "next/navigation";
import { getArtwork, getArtworks } from "@/lib/catalog";
import { workCategoryLabel } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getArtworks().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getArtwork(slug);
  return { title: item?.title ?? "Work" };
}

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const item = getArtwork(slug);
  if (!item) notFound();

  return (
    <div className="wrap">
      <article className="detail">
        {item.image ? (
          <DetailLightboxImage
            src={withBase(item.image)}
            alt={item.title}
            title={item.title}
            width={item.imageWidth}
            height={item.imageHeight}
            priority
          />
        ) : (
          <div className="detail-image" />
        )}
        <div className="detail-info">
          <p className="meta">
            <Link href={`/works?category=${item.category}`}>
              {workCategoryLabel(item.category)}
            </Link>
          </p>
          <h1>{item.title}</h1>
          <dl className="detail-dl">
            <div>
              <dt>Year</dt>
              <dd>{item.year}</dd>
            </div>
            <div>
              <dt>Medium</dt>
              <dd>{item.medium}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>{item.dimensions}</dd>
            </div>
          </dl>
          {item.description ? <p className="detail-note">{item.description}</p> : null}
        </div>
      </article>
    </div>
  );
}

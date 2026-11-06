import { withBase } from "@/lib/basePath";
import type { Metadata } from "next";
import Link from "next/link";
import { DetailLightboxImage } from "@/components/DetailLightboxImage";
import { notFound } from "next/navigation";
import { getTattoo, getTattoos } from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getTattoos().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getTattoo(slug);
  return { title: item?.title ?? "Tattoo" };
}

export default async function TattooDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getTattoo(slug);
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
            <Link href="/tattoo">Tattoo</Link>
          </p>
          <h1>{item.title}</h1>
          <dl className="detail-dl">
            <div>
              <dt>Medium</dt>
              <dd>{item.medium}</dd>
            </div>
          </dl>
          {item.description ? <p className="detail-note">{item.description}</p> : null}
        </div>
      </article>
    </div>
  );
}

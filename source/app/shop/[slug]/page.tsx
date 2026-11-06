import { withBase } from "@/lib/basePath";
import type { Metadata } from "next";
import Link from "next/link";
import { DetailLightboxImage } from "@/components/DetailLightboxImage";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { formatPrice, shopCategoryLabel } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getProducts().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getProduct(slug);
  return { title: item?.title ?? "Shop" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const item = getProduct(slug);
  if (!item) notFound();

  const available = item.availability === "Available" && item.stock > 0;

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
            <Link href={`/shop?category=${item.category}`}>
              {shopCategoryLabel(item.category)}
            </Link>
          </p>
          <h1>{item.title}</h1>
          <p className="serif" style={{ fontSize: "1.35rem" }}>
            {formatPrice(item.priceTRY)}
          </p>
          <dl className="detail-dl">
            <div>
              <dt>Availability</dt>
              <dd>{item.availability}</dd>
            </div>
            <div>
              <dt>Stock</dt>
              <dd>{item.stock}</dd>
            </div>
          </dl>
          <p className="detail-note">{item.description}</p>
          <p className="detail-note">{item.shippingNote}</p>
          {available ? (
            <a
              className="btn"
              href={item.purchaseUrl}
              rel="noreferrer"
              target="_blank"
            >
              Purchase on Shopier
            </a>
          ) : (
            <span className="btn" aria-disabled="true">
              {item.availability}
            </span>
          )}
        </div>
      </article>
    </div>
  );
}

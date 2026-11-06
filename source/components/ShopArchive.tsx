"use client";

import { useMemo, useState } from "react";
import { ArchiveCard } from "@/components/ArchiveCard";
import {
  formatPrice,
  shopCategoriesInUse,
  shopCategoryLabel,
  type Product,
  type ShopCategorySlug,
} from "@/lib/content";

export function ShopArchive({ items }: { items: Product[] }) {
  const categories = shopCategoriesInUse(items);
  const [active, setActive] = useState<ShopCategorySlug | undefined>();
  const visible = useMemo(
    () => (active ? items.filter((item) => item.category === active) : items),
    [active, items],
  );

  return (
    <>
      <nav className="filter-bar" aria-label="Shop categories">
        <button
          type="button"
          aria-current={!active ? "page" : undefined}
          onClick={() => setActive(undefined)}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-current={active === item.slug ? "page" : undefined}
            onClick={() => setActive(item.slug)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {visible.length === 0 ? (
        <p className="empty">No works in this category yet.</p>
      ) : (
        <div className="archive-grid equal-tiles" data-layout="shop">
          {visible.map((item: Product, index) => (
            <ArchiveCard
              key={item.slug}
              href={`/shop/${item.slug}`}
              title={item.title}
              label={shopCategoryLabel(item.category)}
              meta={`${formatPrice(item.priceTRY)}  ·  ${item.availability}`}
              aspect={item.aspect}
              image={item.image}
              imageWidth={item.imageWidth}
              imageHeight={item.imageHeight}
              delay={Math.min(index * 60, 300)}
            />
          ))}
        </div>
      )}
    </>
  );
}

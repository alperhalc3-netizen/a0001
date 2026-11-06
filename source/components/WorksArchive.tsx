"use client";

import { useMemo, useState } from "react";
import { ArchiveCard } from "@/components/ArchiveCard";
import {
  workCategories,
  workCategoryLabel,
  type Artwork,
  type WorkCategorySlug,
} from "@/lib/content";

export function WorksArchive({ items }: { items: Artwork[] }) {
  const [active, setActive] = useState<WorkCategorySlug | undefined>();
  const visible = useMemo(
    () => (active ? items.filter((item) => item.category === active) : items),
    [active, items],
  );

  return (
    <>
      <nav className="filter-bar" aria-label="Work categories">
        <button
          type="button"
          aria-current={!active ? "page" : undefined}
          onClick={() => setActive(undefined)}
        >
          All
        </button>
        {workCategories.map((item) => (
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
        <div className="archive-grid equal-tiles archive-vertical" data-layout="shop">
          {visible.map((item: Artwork, index) => (
            <ArchiveCard
              key={item.slug}
              href={`/works/${item.slug}`}
              title={item.title}
              label={workCategoryLabel(item.category)}
              meta={`${item.year}`}
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

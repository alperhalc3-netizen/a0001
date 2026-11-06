import { existsSync, readFileSync } from "fs";
import { unstable_noStore as noStore } from "next/cache";
import path from "path";
import {
  sortByOrder,
  type Artwork,
  type Catalog,
  type Product,
  type TattooPiece,
} from "./content";

export const CONTENT_FILE = path.join(process.cwd(), "data", "content.json");

export function isStaticExport() {
  return process.env.STATIC_EXPORT === "1";
}

export function loadCatalog(): Catalog {
  if (!isStaticExport()) {
    noStore();
  }

  if (!existsSync(CONTENT_FILE)) {
    return { artworks: [], tattoos: [], products: [] };
  }

  const raw = JSON.parse(readFileSync(CONTENT_FILE, "utf8")) as Catalog;
  return {
    artworks: sortByOrder(raw.artworks ?? []),
    tattoos: sortByOrder(raw.tattoos ?? []),
    products: sortByOrder(raw.products ?? []),
  };
}

export function getArtworks(): Artwork[] {
  return loadCatalog().artworks;
}

export function getTattoos(): TattooPiece[] {
  return loadCatalog().tattoos;
}

export function getProducts(): Product[] {
  return loadCatalog().products;
}

export function getArtwork(slug: string) {
  return getArtworks().find((item) => item.slug === slug);
}

export function getTattoo(slug: string) {
  return getTattoos().find((item) => item.slug === slug);
}

export function getProduct(slug: string) {
  return getProducts().find((item) => item.slug === slug);
}

export function featuredArtworks() {
  return getArtworks().filter((item) => item.featured);
}

export function featuredProducts() {
  return getProducts().filter((item) => item.featured);
}

export function featuredTattoos(limit = 4) {
  const all = getTattoos();
  const featured = all.filter((item) => item.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** Mixed home selection across categories — image-first archive feel. */
export function mixedArtworks(limit = 6): Artwork[] {
  const all = getArtworks().filter((item) => Boolean(item.image));
  if (!all.length) return [];

  const byCategory = new Map<string, Artwork[]>();
  for (const item of all) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const buckets = [...byCategory.values()].map((list) => {
    const featured = list.filter((item) => item.featured);
    const rest = list.filter((item) => !item.featured);
    return [...featured, ...rest];
  });

  const mixed: Artwork[] = [];
  let index = 0;
  while (mixed.length < limit && buckets.some((bucket) => bucket.length > 0)) {
    const bucket = buckets[index % buckets.length];
    if (bucket.length) {
      const next = bucket.shift();
      if (next && !mixed.some((item) => item.slug === next.slug)) {
        mixed.push(next);
      }
    }
    index += 1;
  }

  return mixed.slice(0, limit);
}

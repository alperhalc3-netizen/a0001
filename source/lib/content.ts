import rawCatalog from "../data/content.json";

export const site = {
  name: "A/0001",
  tagline: "Art made by hand. Made to exist.",
  announce:
    "Original artwork, handmade prints and objects by Alper Halıcı",
  location: "Türkiye",
  email: "info.alperh@gmail.com",
  instagramUrl: "https://instagram.com/",
  instagramLabel: "Instagram",
  shopUrl: "https://www.shopier.com/A001",
  shippingNote: "Free shipping on purchases of 1.500 TL and above.",
  description:
    "Original artwork, handmade prints and objects by Alper Halıcı. A/0001 is an independent artist platform presenting original artwork across multiple disciplines.",
  about: [
    "I’m Alper, an independent artist and tattoo artist based in Türkiye.",
    "My practice moves between drawing, tattooing, printmaking, sculpture and other visual forms. I work with my own drawings, exploring different techniques, materials and ways of translating ideas into physical forms.",
    "My work is mostly driven by black and white imagery, organic lines, texture and experimentation.",
    "This website is a collection of my tattoos, artworks, prints and ongoing projects.",
  ],
} as const;

export const nav = [
  { href: "/works", label: "Works" },
  { href: "/tattoo", label: "Tattoo" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export type WorkCategorySlug =
  | "drawings"
  | "printmaking"
  | "digital-art"
  | "sculpture"
  | "objects";

export const workCategories: { slug: WorkCategorySlug; label: string }[] = [
  { slug: "drawings", label: "Drawings" },
  { slug: "printmaking", label: "Printmaking" },
  { slug: "digital-art", label: "Digital Art" },
  { slug: "sculpture", label: "Sculpture" },
  { slug: "objects", label: "Objects" },
];

export type Artwork = {
  slug: string;
  title: string;
  year: number;
  category: WorkCategorySlug;
  medium: string;
  dimensions: string;
  description: string;
  aspect: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  featured?: boolean;
  order: number;
};

export type TattooPiece = {
  slug: string;
  title: string;
  medium: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  aspect: string;
  description: string;
  featured?: boolean;
  order: number;
};

export type ShopCategorySlug =
  | "limited-edition-prints"
  | "original-drawings"
  | "digital-art-prints"
  | "sculptures"
  | "objects";

export const shopCategories: { slug: ShopCategorySlug; label: string }[] = [
  { slug: "limited-edition-prints", label: "Limited Edition Prints" },
  { slug: "original-drawings", label: "Original Drawings" },
  { slug: "digital-art-prints", label: "Digital Art Prints" },
  { slug: "sculptures", label: "Sculptures" },
  { slug: "objects", label: "Objects" },
];

export type Availability = "Available" | "Reserved" | "Sold";

export type Product = {
  slug: string;
  title: string;
  category: ShopCategorySlug;
  priceTRY: number;
  stock: number;
  availability: Availability;
  shippingNote: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  purchaseUrl: string;
  featured?: boolean;
  aspect: string;
  order: number;
};

export type Catalog = {
  artworks: Artwork[];
  tattoos: TattooPiece[];
  products: Product[];
};

export function sortByOrder<T extends { order: number; title: string }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function shopCategoriesInUse(items: readonly Product[]) {
  const used = new Set(items.map((item) => item.category));
  return shopCategories.filter((item) => used.has(item.slug));
}

export function workCategoryLabel(slug: WorkCategorySlug) {
  return workCategories.find((c) => c.slug === slug)?.label ?? slug;
}

export function shopCategoryLabel(slug: ShopCategorySlug) {
  return shopCategories.find((c) => c.slug === slug)?.label ?? slug;
}

export function inquireMailto(title: string) {
  const subject = encodeURIComponent(`Inquire / Purchase: ${title}`);
  return `mailto:${site.email}?subject=${subject}`;
}

export function aspectFromSize(width: number, height: number) {
  if (!width || !height) return "1 / 1";
  return `${width} / ${height}`;
}


const catalog: Catalog = {
  artworks: sortByOrder((rawCatalog.artworks ?? []) as Artwork[]),
  tattoos: sortByOrder((rawCatalog.tattoos ?? []) as TattooPiece[]),
  products: sortByOrder((rawCatalog.products ?? []) as Product[]),
};

export const artworks = catalog.artworks;
export const tattoos = catalog.tattoos;
export const products = catalog.products;

export function getArtwork(slug: string) {
  return artworks.find((item) => item.slug === slug);
}

export function getTattoo(slug: string) {
  return tattoos.find((item) => item.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((item) => item.slug === slug);
}

export function featuredArtworks() {
  return artworks.filter((item) => item.featured);
}

export function featuredProducts() {
  return products.filter((item) => item.featured);
}

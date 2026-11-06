import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isAuthorized, unauthorized } from "@/lib/admin/auth";
import { CONTENT_FILE, loadCatalog } from "@/lib/catalog";
import {
  shopCategories,
  sortByOrder,
  workCategories,
  type Availability,
  type Catalog,
  type Product,
  type ShopCategorySlug,
  type WorkCategorySlug,
} from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const workSlugs = new Set(workCategories.map((item) => item.slug));
const shopSlugs = new Set(shopCategories.map((item) => item.slug));
const availability = new Set<Availability>(["Available", "Reserved", "Sold"]);

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  return Response.json(loadCatalog());
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const catalog = sanitizeCatalog(body);
  if ("error" in catalog) {
    return Response.json({ error: catalog.error }, { status: 400 });
  }

  await mkdir(path.dirname(CONTENT_FILE), { recursive: true });
  await writeFile(CONTENT_FILE, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return Response.json({ ok: true, catalog });
}

function sanitizeCatalog(input: unknown): Catalog | { error: string } {
  if (!input || typeof input !== "object") {
    return { error: "Catalog must be an object." };
  }

  const raw = input as Partial<Catalog>;
  try {
    return {
      artworks: sortByOrder((raw.artworks ?? []).map(sanitizeArtwork)),
      tattoos: sortByOrder((raw.tattoos ?? []).map(sanitizeTattoo)),
      products: sortByOrder((raw.products ?? []).map(sanitizeProduct)),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid catalog." };
  }
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeArtwork(item: unknown, index: number) {
  if (!item || typeof item !== "object") throw new Error("Invalid work item.");
  const raw = item as Record<string, unknown>;
  const category = text(raw.category) as WorkCategorySlug;
  if (!workSlugs.has(category)) throw new Error("Invalid work category.");
  const imageWidth = Math.max(1, Math.round(num(raw.imageWidth, 1000)));
  const imageHeight = Math.max(1, Math.round(num(raw.imageHeight, 1000)));
  return {
    slug: text(raw.slug) || `work-${index + 1}`,
    title: text(raw.title) || "Untitled",
    year: Math.round(num(raw.year, new Date().getFullYear())),
    category,
    medium: text(raw.medium),
    dimensions: text(raw.dimensions),
    description: text(raw.description),
    image: text(raw.image),
    imageWidth,
    imageHeight,
    aspect: text(raw.aspect) || `${imageWidth} / ${imageHeight}`,
    featured: Boolean(raw.featured),
    order: num(raw.order, index + 1),
  };
}

function sanitizeTattoo(item: unknown, index: number) {
  if (!item || typeof item !== "object") throw new Error("Invalid tattoo item.");
  const raw = item as Record<string, unknown>;
  const imageWidth = Math.max(1, Math.round(num(raw.imageWidth, 1000)));
  const imageHeight = Math.max(1, Math.round(num(raw.imageHeight, 1000)));
  return {
    slug: text(raw.slug) || `tattoo-${index + 1}`,
    title: text(raw.title) || "Untitled",
    medium: text(raw.medium) || "Tattoo",
    description: text(raw.description),
    image: text(raw.image),
    imageWidth,
    imageHeight,
    aspect: text(raw.aspect) || `${imageWidth} / ${imageHeight}`,
    featured: Boolean(raw.featured),
    order: num(raw.order, index + 1),
  };
}

function sanitizeProduct(item: unknown, index: number): Product {
  if (!item || typeof item !== "object") throw new Error("Invalid shop item.");
  const raw = item as Record<string, unknown>;
  const category = text(raw.category) as ShopCategorySlug;
  if (!shopSlugs.has(category)) throw new Error("Invalid shop category.");
  const status = (text(raw.availability) || "Available") as Availability;
  if (!availability.has(status)) throw new Error("Invalid availability.");
  const imageWidth = Math.max(1, Math.round(num(raw.imageWidth, 1000)));
  const imageHeight = Math.max(1, Math.round(num(raw.imageHeight, 1000)));
  return {
    slug: text(raw.slug) || `product-${index + 1}`,
    title: text(raw.title) || "Untitled",
    category,
    priceTRY: Math.max(0, num(raw.priceTRY, 0)),
    stock: Math.max(0, Math.round(num(raw.stock, 0))),
    availability: status,
    shippingNote: text(raw.shippingNote),
    description: text(raw.description),
    image: text(raw.image),
    imageWidth,
    imageHeight,
    purchaseUrl: text(raw.purchaseUrl),
    featured: Boolean(raw.featured),
    aspect: text(raw.aspect) || `${imageWidth} / ${imageHeight}`,
    order: num(raw.order, index + 1),
  };
}

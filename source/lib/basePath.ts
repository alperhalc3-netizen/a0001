/** Public URL prefix when hosted under a subpath (GitHub Pages). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a site-absolute path (/foo) with basePath; leave absolute URLs alone. */
export function withBase(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (basePath && (normalized === basePath || normalized.startsWith(`${basePath}/`))) {
    return normalized;
  }
  return `${basePath}${normalized}`;
}

/** Public site origin, used for canonical URLs, sitemap, robots and structured data. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = raw && /^https?:\/\//.test(raw) ? raw : "http://localhost:3000";
  return base.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

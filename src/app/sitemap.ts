import type { MetadataRoute } from "next";
import { listCategories, listProducts } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
  ];
  for (const category of categories) {
    entries.push({ url: absoluteUrl(`/?category=${category.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
  }
  for (const product of products) {
    entries.push({ url: absoluteUrl(`/products/${product.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  }
  return entries;
}

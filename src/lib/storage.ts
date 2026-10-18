// Single place that knows where product images live. Swapping Supabase Storage
// for S3/CloudFront later only means changing this file and next.config.ts.

export const PRODUCT_IMAGE_BUCKET = "product-images";

export function productImageUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  const path = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

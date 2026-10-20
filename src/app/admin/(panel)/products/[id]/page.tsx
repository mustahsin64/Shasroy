import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionForm } from "@/components/admin/action-form";
import { ProductImage } from "@/components/product-card";
import { requireAdmin } from "@/lib/admin-auth";
import { getProductForAdmin, listCategoriesForAdmin } from "@/lib/admin/products";
import { formatNumberBn, formatTaka } from "@/lib/format";
import {
  deleteImageAction,
  deleteVariantAction,
  makePrimaryImageAction,
  saveVariantAction,
  setStockAction,
  updateProductAction,
  uploadImageAction,
} from "../actions";
import { ProductFields, VariantFields } from "../product-fields";

export const metadata: Metadata = { title: "পণ্য সম্পাদনা" };

const taka = (paisa: number | null) => (paisa === null ? "" : String(paisa / 100));

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin("manager");
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const [product, categories] = await Promise.all([getProductForAdmin(id), listCategoriesForAdmin()]);
  if (!product) notFound();
  const hidden = <input type="hidden" name="productId" value={product.id} />;

  return <>
    <p className="admin-back"><Link href="/admin/products">← সব পণ্য</Link></p>
    <div className="admin-heading">
      <h1>{product.nameBn}</h1>
      {product.status === "active" && <Link href={`/products/${product.slug}`} target="_blank" className="admin-link">দোকানে দেখুন ↗</Link>}
    </div>
    {created && <p className="admin-success">পণ্য তৈরি হয়েছে। এখন ছবি যোগ করুন, তারপর অবস্থা “চালু” করুন।</p>}

    <section className="admin-card">
      <h2>তথ্য</h2>
      <ActionForm action={updateProductAction} submitLabel="সংরক্ষণ করুন">
        {hidden}
        <ProductFields categories={categories} values={product} />
      </ActionForm>
    </section>

    <section className="admin-card">
      <h2>ছবি</h2>
      <p className="admin-muted">প্রথম ছবিটি প্রধান ছবি হিসেবে দেখাবে। JPG/PNG/WebP, সর্বোচ্চ ৪ MB; আপলোডের সময় ছোট করে WebP করা হয়।</p>
      <div className="admin-images">{product.images.map((image, index) => <figure key={image.id}>
        <ProductImage path={image.storagePath} alt={image.altBn} sizes="140px" />
        <figcaption>
          {index === 0 ? <span className="status-pill product-active">প্রধান</span> : <ActionForm action={makePrimaryImageAction} submitLabel="প্রধান করুন" className="inline">
            {hidden}<input type="hidden" name="imageId" value={image.id} />
          </ActionForm>}
          <ActionForm action={deleteImageAction} submitLabel="মুছুন" className="inline" danger confirmText="ছবিটি মুছে ফেলবেন?">
            {hidden}<input type="hidden" name="imageId" value={image.id} />
          </ActionForm>
        </figcaption>
      </figure>)}</div>
      <ActionForm action={uploadImageAction} submitLabel="ছবি আপলোড করুন" className="upload-form">
        {hidden}<input type="hidden" name="productName" value={product.nameBn} />
        <label>ছবি<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" required /></label>
        <label>ছবির বর্ণনা (ঐচ্ছিক)<input name="altBn" maxLength={160} placeholder={product.nameBn} /></label>
      </ActionForm>
    </section>

    <section className="admin-card">
      <h2>ধরন, দাম ও স্টক</h2>
      {product.variants.map(variant => <div key={variant.id} className="admin-variant">
        <div className="variant-head">
          <strong>{variant.nameBn}</strong>
          <span>{formatTaka(variant.pricePaisa)} · স্টক {formatNumberBn(variant.stockQuantity)}{variant.isDefault && " · প্রধান"}{!variant.isActive && " · বন্ধ"}</span>
          <Link href={`/admin/products/${product.id}/variants/${variant.id}/history`} className="admin-link">স্টকের ইতিহাস</Link>
        </div>
        <ActionForm action={saveVariantAction} submitLabel="ধরন সংরক্ষণ">
          {hidden}<input type="hidden" name="variantId" value={variant.id} />
          <VariantFields values={{ variantNameBn: variant.nameBn, sku: variant.sku, price: taka(variant.pricePaisa), compareAtPrice: taka(variant.compareAtPricePaisa), isActive: variant.isActive, isDefault: variant.isDefault }} />
        </ActionForm>
        <div className="variant-side">
          <ActionForm action={setStockAction} submitLabel="স্টক হালনাগাদ" className="stock-form">
            {hidden}<input type="hidden" name="variantId" value={variant.id} />
            <label>বর্তমান স্টক<input name="stock" inputMode="numeric" required defaultValue={variant.stockQuantity} /></label>
            <label>কারণ (ঐচ্ছিক)<input name="note" maxLength={300} placeholder="নতুন মাল এসেছে / ভাঙা" /></label>
          </ActionForm>
          {product.variants.length > 1 && <ActionForm action={deleteVariantAction} submitLabel="ধরন মুছুন" className="inline" danger confirmText="এই ধরনটি মুছে ফেলবেন?">
            {hidden}<input type="hidden" name="variantId" value={variant.id} />
          </ActionForm>}
        </div>
      </div>)}

      <details className="admin-add">
        <summary>+ নতুন ধরন যোগ করুন</summary>
        <ActionForm action={saveVariantAction} submitLabel="ধরন যোগ করুন">
          {hidden}
          <VariantFields withStock />
        </ActionForm>
      </details>
    </section>
  </>;
}

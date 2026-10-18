import { schema } from "@/db";

const statusLabels = { draft: "খসড়া (দেখা যাবে না)", active: "চালু (দোকানে দেখা যাবে)", archived: "আর্কাইভ" } as const;

type Category = { id: string; nameBn: string };
type Values = { nameBn?: string; slug?: string; descriptionBn?: string | null; categoryId?: string; status?: string; isFeatured?: boolean };

export function ProductFields({ categories, values = {} }: { categories: Category[]; values?: Values }) {
  return <div className="admin-grid">
    <label>পণ্যের নাম *<input name="nameBn" required maxLength={160} defaultValue={values.nameBn} /></label>
    <label>স্লাগ (ঠিকানার অংশ) *<input name="slug" required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="leaf-pattern-mug" defaultValue={values.slug} />
      <small>ইংরেজি ছোট হাতের অক্ষর ও হাইফেন। ঠিকানা হবে /products/স্লাগ</small></label>
    <label>বিভাগ *<select name="categoryId" required defaultValue={values.categoryId ?? ""}>
      <option value="" disabled>বেছে নিন</option>
      {categories.map(c => <option key={c.id} value={c.id}>{c.nameBn}</option>)}
    </select></label>
    <label>অবস্থা<select name="status" defaultValue={values.status ?? "draft"}>
      {schema.productStatus.enumValues.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
    </select></label>
    <label className="span-2">বিবরণ<textarea name="descriptionBn" rows={4} maxLength={5000} defaultValue={values.descriptionBn ?? ""} /></label>
    <label className="checkbox"><input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} /> বিশেষ পণ্য হিসেবে দেখান</label>
  </div>;
}

type VariantValues = { variantNameBn?: string; sku?: string; price?: string; compareAtPrice?: string; isActive?: boolean; isDefault?: boolean };

export function VariantFields({ values = {}, withStock, hideDefault }: { values?: VariantValues; withStock?: boolean; hideDefault?: boolean }) {
  return <div className="admin-grid variant-grid">
    <label>ধরনের নাম *<input name="variantNameBn" required maxLength={120} placeholder="সাধারণ / লাল / বড়" defaultValue={values.variantNameBn} /></label>
    <label>কোড (SKU) *<input name="sku" required maxLength={64} placeholder="MUG-GREEN" defaultValue={values.sku} /></label>
    <label>দাম (টাকা) *<input name="price" required inputMode="decimal" placeholder="২৫০" defaultValue={values.price} /></label>
    <label>আগের দাম (ঐচ্ছিক)<input name="compareAtPrice" inputMode="decimal" defaultValue={values.compareAtPrice} /><small>ছাড় দেখাতে চাইলে</small></label>
    {withStock && <label>শুরুর স্টক<input name="stock" inputMode="numeric" defaultValue="0" /></label>}
    <label className="checkbox"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> বিক্রি চালু</label>
    {!hideDefault && <label className="checkbox"><input type="checkbox" name="isDefault" defaultChecked={values.isDefault} /> প্রধান ধরন</label>}
  </div>;
}

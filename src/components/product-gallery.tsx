"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/product-card";

type GalleryImage = { id: string; storagePath: string; altBn: string };

export function ProductGallery({ images, fallbackAlt, initialIndex = 0 }: { images: GalleryImage[]; fallbackAlt: string; initialIndex?: number }) {
  const [active, setActive] = useState(Math.min(initialIndex, Math.max(images.length - 1, 0)));
  const current = images[active];
  return <div className="product-gallery">
    <div className="gallery-stage">
      <ProductImage path={current?.storagePath ?? null} alt={current?.altBn || fallbackAlt} sizes="(max-width: 900px) 100vw, 48vw" priority />
      {images.length > 1 && <>
        <button type="button" className="gallery-arrow gallery-prev" aria-label="আগের ছবি" onClick={() => setActive((active + images.length - 1) % images.length)}><ChevronLeft /></button>
        <button type="button" className="gallery-arrow gallery-next" aria-label="পরের ছবি" onClick={() => setActive((active + 1) % images.length)}><ChevronRight /></button>
      </>}
    </div>
    {images.length > 1 && <div className="gallery-thumbs" aria-label="আরও ছবি">
      {images.map((image, index) => <button type="button" key={image.id} aria-label={`ছবি ${(index + 1).toLocaleString("bn-BD")}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)}>
        <ProductImage path={image.storagePath} alt="" sizes="80px" />
      </button>)}
    </div>}
    {images.length > 1 && <p className="gallery-count" aria-live="polite">{(active + 1).toLocaleString("bn-BD")} / {images.length.toLocaleString("bn-BD")} ছবি</p>}
  </div>;
}

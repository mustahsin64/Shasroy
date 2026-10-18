"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-card";

type GalleryImage = { id: string; storagePath: string; altBn: string };

export function ProductGallery({ images, fallbackAlt, initialIndex = 0 }: { images: GalleryImage[]; fallbackAlt: string; initialIndex?: number }) {
  const [active, setActive] = useState(Math.min(initialIndex, Math.max(images.length - 1, 0)));
  const current = images[active];
  return <div className="product-gallery">
    <ProductImage path={current?.storagePath ?? null} alt={current?.altBn ?? fallbackAlt} sizes="(max-width: 900px) 100vw, 520px" priority />
    {images.length > 1 && <div className="gallery-thumbs" role="list" aria-label="আরও ছবি">
      {images.map((image, index) => <button type="button" role="listitem" key={image.id} aria-label={`ছবি ${(index + 1).toLocaleString("bn-BD")}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)}>
        <ProductImage path={image.storagePath} alt="" sizes="80px" />
      </button>)}
    </div>}
  </div>;
}

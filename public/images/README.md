# Storefront concept imagery

Generated with the built-in image generation tool for the Shasroy storefront. These are illustrative sample products, not photographs of actual stock. Replace them with store photography when the real catalog is connected.

## gift-hero.png

Prompt: Create a wide 3:2 photorealistic gift shop hero. Ivory linen surface and backdrop. Right half holds three gift boxes wrapped in forest green and golden ochre paper, cream satin bows, sprig of green leaves, small beige teddy bear. Left 45% entirely empty ivory negative space for website heading. Soft daylight, realistic materials, restrained commercial photography. No writing, no logo, no watermark.

## sample-products.png

Prompt: Make one catalog contact sheet exactly four columns and two rows, eight equal square cells, overall aspect ratio 2:1. All cells plain warm white backgrounds. No borders, text, or labels. Each object centered with margin and realistic studio shadow. Top row: beige teddy bear with green bow; forest green notebook with golden pen; white ceramic vase with dried flowers; mint desk organizer. Bottom row: ivory leaf-pattern mug; golden floral earrings; miniature wooden house; pastel pencil set in a kraft box. Realistic product photography. Objects stay within their own cells. No watermark.

The contact sheet is positioned with CSS to show each sample separately without duplicating the asset.

## Category hero images (carousel)

Each hero carousel slide uses a 3:2 photo. Drop these exact files into `public/images/` (PNG, ideally 1536×1024). Until a file exists, that slide falls back to the cream background. Keep the same look as `gift-hero.png`: ivory linen surface, forest green + golden ochre + cream palette, soft daylight, restrained commercial product photography, and the **left ~45% left empty as ivory negative space for the heading**. No text, no logo, no watermark.

| File | Category | Subject prompt (right side of frame) |
| --- | --- | --- |
| `kids-hero.png` | ছোটদের উপহার (`kids`) | Soft toys, a small teddy, wooden blocks and colour pencils, cheerful but muted. |
| `stationery-hero.png` | খাতা-কলম ও স্টেশনারি (`stationery`) | Notebooks, pens, a desk organizer and neatly arranged stationery. |
| `women-hero.png` | নারীদের উপহার (`women`) | Delicate jewellery, a scarf and a few tasteful accessories. |
| `kitchen-hero.png` | ঘরের প্রয়োজন (`home`) | Ceramic bowls, a storage container, utensils and tidy kitchen essentials. |
| `decor-hero.png` | শোপিস ও ঘর সাজানো (`decor`) | A ribbed vase with dried flowers, a wooden mini house, a candle and a rattan tray. |

### Current category images

The category heroes (one per category slug; the carousel hides slides whose category is not active) were generated with Figma's image generation (model `gpt-image-2.5-sunburst`, 1536×1024) in the Figma file "Shasroy hero images". Each prompt followed the `gift-hero.png` recipe above (ivory linen, forest green + golden ochre + cream, left 45% empty, no text) with the subject from the table. Like the gift hero, they are illustrative, not photographs of actual stock.

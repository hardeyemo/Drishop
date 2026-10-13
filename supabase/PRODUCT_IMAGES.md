# Shopora product images

The catalogue stores public Supabase Storage URLs in `public.product_images.url`. Migration
`0002_rls.sql` creates the public `product-images` bucket and restricts writes to admins.
The Next.js image allowlist already accepts only public Storage URLs from the configured
Supabase project.

## Upload the 48 seeded product images

1. Apply `0001_schema.sql` and `0002_rls.sql`, then run `seed.sql` in the intended Supabase
   project.
2. Run `node supabase/download-product-images.mjs --new` to download only the 30 newly added
   curated Unsplash photos as local WebP assets. Omit `--new` only if you intend to refresh
   all 48 local assets.
   Source pages and permission notes are listed in
   [PRODUCT_IMAGE_SOURCES.md](PRODUCT_IMAGE_SOURCES.md).
3. You can replace any demo photo with an authorized product photo. Save it in
   `supabase/product-image-assets/` using the exact matching slug and extension (for example,
   `nova-x5-smartphone.webp`). The uploader accepts `.webp`, `.jpg`, `.jpeg`, and `.png`.
4. Ensure `.env.local` contains the exact Project URL as `NEXT_PUBLIC_SUPABASE_URL` and the
   server-only service-role key as `SUPABASE_SERVICE_ROLE_KEY`. Never use a service-role key
   in a `NEXT_PUBLIC_` variable, commit it, or share it in logs/screenshots.
5. From the project root, run:

   ```powershell
   node supabase/upload-product-images.mjs --new
   ```

With `--new`, the uploader validates all 30 new files before making remote changes, confirms
the bucket exists and is public, uploads to stable `catalog/<product-slug>.<extension>` paths,
and inserts or refreshes the primary image rows only for the 30 new products. It leaves the
existing 18 product image objects and rows untouched. Re-running `--new` is safe. Omit
`--new` only if you intend to refresh all 48 image objects and rows. If an upload is
interrupted, correct the reported issue and rerun it.

The seeded product slugs are:

```text
nova-x5-smartphone
nova-tab-10-tablet
aria-slim-14-laptop
aria-wireless-mouse
pulse-over-ear-headphones
beam-43-4k-smart-tv
pulse-portable-speaker
stride-classic-sneakers
tailor-ankara-shirt
voyage-leather-backpack
hearth-nonstick-pan-set
brew-electric-kettle
linen-bedding-set
glow-shea-body-butter
glow-vitamin-c-serum
harvest-jollof-rice-5kg
goldpalm-vegetable-oil-2l
little-steps-baby-wipes-4-pack
nova-air-6-smartphone
nova-edge-256-smartphone
nova-tab-s-11-tablet
nova-blue-5g-smartphone
aria-core-15-laptop
aria-flex-13-laptop
aria-studio-16-laptop
pulse-studio-wireless-headphones
pulse-mini-bluetooth-speaker
pulse-classic-bluetooth-headphones
nova-buds-wireless-earphones
tailor-white-cotton-shirt
tailor-patterned-two-piece-set
tailor-casual-streetwear-set
stride-urban-running-sneakers
stride-canvas-low-top-trainers
stride-everyday-white-sneakers
voyage-black-sling-bag
voyage-pink-crossbody-bag
voyage-travel-essentials-backpack
brew-compact-electric-kettle
blendpro-15l-countertop-blender
hearth-20l-microwave-oven
glow-hydrating-face-serum-30ml
glow-botanical-body-lotion-250ml
harvest-premium-rice-10kg
goldpalm-groundnut-oil-1l
harvest-rice-beans-pantry-bundle
little-steps-baby-diapers-size-3
little-steps-newborn-care-starter-pack
```

The image component falls back to its existing monogram tile when an image URL is absent or
fails to load.

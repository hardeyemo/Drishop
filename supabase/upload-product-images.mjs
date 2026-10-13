#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { access, readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @next/env is CommonJS in this project; require it explicitly from this ESM script.
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);

const bucket = "product-images";
const assetDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "product-image-assets");
const existingProducts = [
  "nova-x5-smartphone",
  "nova-tab-10-tablet",
  "aria-slim-14-laptop",
  "aria-wireless-mouse",
  "pulse-over-ear-headphones",
  "beam-43-4k-smart-tv",
  "pulse-portable-speaker",
  "stride-classic-sneakers",
  "tailor-ankara-shirt",
  "voyage-leather-backpack",
  "hearth-nonstick-pan-set",
  "brew-electric-kettle",
  "linen-bedding-set",
  "glow-shea-body-butter",
  "glow-vitamin-c-serum",
  "harvest-jollof-rice-5kg",
  "goldpalm-vegetable-oil-2l",
  "little-steps-baby-wipes-4-pack",
];
const newProducts = [
  "nova-air-6-smartphone",
  "nova-edge-256-smartphone",
  "nova-tab-s-11-tablet",
  "nova-blue-5g-smartphone",
  "aria-core-15-laptop",
  "aria-flex-13-laptop",
  "aria-studio-16-laptop",
  "pulse-studio-wireless-headphones",
  "pulse-mini-bluetooth-speaker",
  "pulse-classic-bluetooth-headphones",
  "nova-buds-wireless-earphones",
  "tailor-white-cotton-shirt",
  "tailor-patterned-two-piece-set",
  "tailor-casual-streetwear-set",
  "stride-urban-running-sneakers",
  "stride-canvas-low-top-trainers",
  "stride-everyday-white-sneakers",
  "voyage-black-sling-bag",
  "voyage-pink-crossbody-bag",
  "voyage-travel-essentials-backpack",
  "brew-compact-electric-kettle",
  "blendpro-15l-countertop-blender",
  "hearth-20l-microwave-oven",
  "glow-hydrating-face-serum-30ml",
  "glow-botanical-body-lotion-250ml",
  "harvest-premium-rice-10kg",
  "goldpalm-groundnut-oil-1l",
  "harvest-rice-beans-pantry-bundle",
  "little-steps-baby-diapers-size-3",
  "little-steps-newborn-care-starter-pack",
];
const uploadNewOnly = process.argv.slice(2).includes("--new");
if (process.argv.slice(2).some((arg) => arg !== "--new") || process.argv.slice(2).length > 1) {
  throw new Error("Usage: node supabase/upload-product-images.mjs [--new]");
}
const products = uploadNewOnly ? newProducts : [...existingProducts, ...newProducts];
const contentTypes = new Map([
  [".webp", "image/webp"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing or blank in .env.local.");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing or blank in .env.local. Add the server-only service role key from your Supabase project's API settings.");
const projectUrl = new URL(supabaseUrl);
if (projectUrl.protocol !== "https:" || !projectUrl.hostname.endsWith(".supabase.co") || projectUrl.pathname !== "/") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must be the HTTPS Supabase Project URL with no extra path.");
}

// Validate all assets before making any remote changes. Upload and metadata writes are
// idempotent, so rerunning after an interrupted upload safely completes the remaining work.
const assets = [];
for (const slug of products) {
  let found;
  for (const extension of contentTypes.keys()) {
    const file = path.join(assetDir, `${slug}${extension}`);
    try {
      await access(file);
      found = { slug, file, extension, contentType: contentTypes.get(extension) };
      break;
    } catch {}
  }
  if (!found) throw new Error(`Missing image for ${slug}; expected ${slug}.webp, .jpg, .jpeg, or .png in supabase/product-image-assets/.`);
  if ((await stat(found.file)).size > 8 * 1024 * 1024) {
    throw new Error(`${path.basename(found.file)} exceeds the 8 MB upload limit.`);
  }
  assets.push(found);
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: bucketInfo, error: bucketError } = await db.storage.getBucket(bucket);
if (bucketError) throw new Error(`Storage bucket '${bucket}' is unavailable; apply migration 0002_rls.sql first.`);
if (!bucketInfo.public) throw new Error(`Storage bucket '${bucket}' is not public; review its setup before uploading storefront images.`);

for (const asset of assets) {
  const objectPath = `catalog/${asset.slug}${asset.extension}`;
  const { error: uploadError } = await db.storage.from(bucket).upload(objectPath, await readFile(asset.file), {
    contentType: asset.contentType,
    upsert: true,
    cacheControl: "3600",
  });
  if (uploadError) throw new Error(`Could not upload ${path.basename(asset.file)}: ${uploadError.message}`);

  // Derive the public URL from the configured client. Never hard-code a project ref or URL.
  const { data: publicUrlData } = db.storage.from(bucket).getPublicUrl(objectPath);
  const imageUrl = publicUrlData.publicUrl;
  const { data: product, error: productError } = await db
    .from("products")
    .select("id")
    .eq("slug", asset.slug)
    .maybeSingle();
  if (productError) throw new Error(`Could not find ${asset.slug}: ${productError.message}`);
  if (!product) throw new Error(`Product '${asset.slug}' is missing; run supabase/seed.sql first.`);

  const { data: imageRows, error: imageError } = await db
    .from("product_images")
    .select("id")
    .eq("product_id", product.id)
    .eq("sort_order", 0);
  if (imageError) throw new Error(`Could not inspect image rows for ${asset.slug}: ${imageError.message}`);
  if (imageRows.length > 1) throw new Error(`Product '${asset.slug}' has multiple sort_order 0 images; resolve duplicates before rerunning.`);

  const write = imageRows.length === 1
    ? db.from("product_images").update({ url: imageUrl, alt: `${asset.slug.replaceAll("-", " ")} product photo` }).eq("id", imageRows[0].id)
    : db.from("product_images").insert({
        product_id: product.id,
        url: imageUrl,
        alt: `${asset.slug.replaceAll("-", " ")} product photo`,
        sort_order: 0,
      });
  const { error: writeError } = await write;
  if (writeError) throw new Error(`Could not save image metadata for ${asset.slug}: ${writeError.message}`);
  process.stdout.write(`Uploaded image for ${asset.slug}\n`);
}

process.stdout.write(`Finished: ${assets.length} product images are stored and linked.\n`);

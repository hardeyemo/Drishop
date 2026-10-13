#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const existingAssets = [
  ["nova-x5-smartphone", "photo-1505468726633-0069fc52f4b9"],
  ["nova-tab-10-tablet", "photo-1652422485224-102f6784c149"],
  ["aria-slim-14-laptop", "photo-1705508216613-be1715a31212"],
  ["aria-wireless-mouse", "photo-1772531606450-0dd023c265d7"],
  ["pulse-over-ear-headphones", "photo-1713801129175-8e60c67e0412"],
  ["beam-43-4k-smart-tv", "photo-1615986200762-a1ed9610d3b1"],
  ["pulse-portable-speaker", "photo-1675523796635-d6e4d8a127b1"],
  ["stride-classic-sneakers", "photo-1778521157912-620fd0d3c6e1"],
  ["tailor-ankara-shirt", "photo-1556136412-3813d7367e4b"],
  ["voyage-leather-backpack", "photo-1642375352724-8b523c67b8be"],
  ["hearth-nonstick-pan-set", "photo-1541508223081-3f8cd5cc0f4c"],
  ["brew-electric-kettle", "photo-1603251871185-8f18ed9bc9f2"],
  ["linen-bedding-set", "photo-1738344480198-4c0fa46a224b"],
  ["glow-shea-body-butter", "photo-1732861612298-969e145fc4b7"],
  ["glow-vitamin-c-serum", "photo-1723951174326-2a97221d3b7f"],
  ["harvest-jollof-rice-5kg", "photo-1722893960889-5f2d88ce6524"],
  ["goldpalm-vegetable-oil-2l", "photo-1562500273-8ab8072d58e0"],
  ["little-steps-baby-wipes-4-pack", "photo-1706524077391-12206f155e94"],
];
const newAssets = [
  ["nova-air-6-smartphone", "photo-1603145733146-ae562a55031e"],
  ["nova-edge-256-smartphone", "photo-1790900617959-383a4abe5213"],
  ["nova-tab-s-11-tablet", "photo-1729058048010-86f7d7c30001"],
  ["nova-blue-5g-smartphone", "photo-1772182104431-5a00158fd8e2"],
  ["aria-core-15-laptop", "photo-1657524433787-a30cefc92661"],
  ["aria-flex-13-laptop", "photo-1576033897961-a9ee9479d78e"],
  ["aria-studio-16-laptop", "photo-1622131815526-eaae1e615381"],
  ["pulse-studio-wireless-headphones", "photo-1642243747081-eedd813fe7c9"],
  ["pulse-mini-bluetooth-speaker", "photo-1481207801830-97f0f9a1337e"],
  ["pulse-classic-bluetooth-headphones", "photo-1600086801208-ef265a4a9aa6"],
  ["nova-buds-wireless-earphones", "photo-1760462787740-808e31f9c803"],
  ["tailor-white-cotton-shirt", "photo-1558745087-08653f12b2ca"],
  ["tailor-patterned-two-piece-set", "photo-1768478701573-de624e2fc631"],
  ["tailor-casual-streetwear-set", "photo-1758506088200-8efc51eaa34c"],
  ["stride-urban-running-sneakers", "photo-1748354815017-94c4be51dea9"],
  ["stride-canvas-low-top-trainers", "photo-1714143852202-61b6175a8a8f"],
  ["stride-everyday-white-sneakers", "photo-1780566758461-8a2e9287abb2"],
  ["voyage-black-sling-bag", "photo-1523464900179-ed2e879f4e6c"],
  ["voyage-pink-crossbody-bag", "photo-1789110854601-6692e03f6622"],
  ["voyage-travel-essentials-backpack", "photo-1761599934469-999a86c52830"],
  ["brew-compact-electric-kettle", "photo-1615196345808-e93bdc71b1d2"],
  ["blendpro-15l-countertop-blender", "photo-1727107463948-012b8867cbf6"],
  ["hearth-20l-microwave-oven", "photo-1585659722983-3a675dabf23d"],
  ["glow-hydrating-face-serum-30ml", "photo-1766241884020-a86f15ad24b8"],
  ["glow-botanical-body-lotion-250ml", "photo-1688380337044-18c03ba32199"],
  ["harvest-premium-rice-10kg", "photo-1722893960889-5f2d88ce6524"],
  ["goldpalm-groundnut-oil-1l", "photo-1757801333068-d52a3e448cde"],
  ["harvest-rice-beans-pantry-bundle", "photo-1633151057773-f3ef85aa6d6d"],
  ["little-steps-baby-diapers-size-3", "photo-1734599406023-80b2212b713b"],
  ["little-steps-newborn-care-starter-pack", "photo-1734599397715-f030c6d206a0"],
];
const downloadNewOnly = process.argv.slice(2).includes("--new");
if (process.argv.slice(2).some((arg) => arg !== "--new") || process.argv.slice(2).length > 1) {
  throw new Error("Usage: node supabase/download-product-images.mjs [--new]");
}
const assets = downloadNewOnly ? newAssets : [...existingAssets, ...newAssets];

const outputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "product-image-assets");
await mkdir(outputDir, { recursive: true });

for (const [slug, photoId] of assets) {
  const source = new URL(`https://images.unsplash.com/${photoId}`);
  source.search = new URLSearchParams({ auto: "format", bg: "ffffff", fit: "contain", fm: "webp", h: "1125", q: "82", w: "900" }).toString();
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Download failed for ${slug}: HTTP ${response.status}`);
  const type = response.headers.get("content-type")?.split(";")[0];
  if (type !== "image/webp") throw new Error(`Expected WebP for ${slug}; source returned ${type ?? "unknown content type"}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`Downloaded data for ${slug} is not a valid WebP image.`);
  }
  if (bytes.length > 8 * 1024 * 1024) throw new Error(`Optimized image for ${slug} exceeds 8 MB.`);
  await writeFile(path.join(outputDir, `${slug}.webp`), bytes);
  process.stdout.write(`Saved ${slug}.webp (${Math.round(bytes.length / 1024)} KB)\n`);
}

process.stdout.write(`Downloaded and optimized ${assets.length} product photos to ${outputDir}.\n`);

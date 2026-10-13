-- Development/demo catalogue data for Shopora.
-- Apply after migrations 0001_schema.sql and 0002_rls.sql.
-- Safe to rerun: inserts use unique slugs/SKUs and never update or delete existing rows.
-- All prices are NGN * 100 (kobo). No customer, order, payment, or auth data is touched.
begin;

insert into public.categories (name, slug, description, sort_order, is_active) values
  ('Phones & Tablets', 'phones-tablets', 'Smartphones, tablets, chargers and mobile accessories.', 1, true),
  ('Computers & Accessories', 'computing', 'Laptops, peripherals, storage and work essentials.', 2, true),
  ('TV, Audio & Smart Home', 'electronics', 'Televisions, headphones, speakers and connected devices.', 3, true),
  ('Fashion', 'fashion', 'Clothing, footwear, bags and accessories for everyday Nigerian life.', 4, true),
  ('Home & Kitchen', 'home-kitchen', 'Useful appliances, cookware, bedding and home essentials.', 5, true),
  ('Beauty & Personal Care', 'beauty', 'Skincare, haircare and personal care essentials.', 6, true),
  ('Groceries & Food Cupboard', 'groceries', 'Pantry staples, snacks and everyday household supplies.', 7, true),
  ('Baby, Kids & Toys', 'baby-kids', 'Baby care, children’s essentials, toys and learning products.', 8, true)
on conflict (slug) do nothing;

insert into public.products
  (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
select c.id, v.name, v.slug, v.brand, v.description, true, v.is_featured, v.units_sold
from (values
  ('phones-tablets', 'Nova X5 Smartphone', 'nova-x5-smartphone', 'Nova', '6.6-inch AMOLED display, 50MP camera and all-day battery.', true, 420),
  ('phones-tablets', 'Nova Tab 10 Tablet', 'nova-tab-10-tablet', 'Nova', '10.4-inch tablet with 4GB RAM and 64GB storage for work and study.', false, 150),
  ('computing', 'Aria Slim 14 Laptop', 'aria-slim-14-laptop', 'Aria', 'Lightweight 14-inch laptop with 16GB RAM and a 512GB SSD.', true, 210),
  ('computing', 'Aria Wireless Mouse', 'aria-wireless-mouse', 'Aria', 'Quiet-click wireless mouse with adjustable DPI.', false, 640),
  ('electronics', 'Pulse Noise-Cancelling Headphones', 'pulse-over-ear-headphones', 'Pulse', 'Wireless over-ear headphones with noise cancelling and long battery life.', true, 380),
  ('electronics', 'Beam 43-inch 4K Smart TV', 'beam-43-4k-smart-tv', 'Beam', '43-inch 4K smart television with streaming apps and three HDMI ports.', false, 95),
  ('electronics', 'Pulse Portable Bluetooth Speaker', 'pulse-portable-speaker', 'Pulse', 'Water-resistant portable speaker with up to 14 hours of playback.', false, 510),
  ('fashion', 'Stride Everyday Sneakers', 'stride-classic-sneakers', 'Stride', 'Comfortable everyday sneakers with cushioned insoles.', true, 730),
  ('fashion', 'Tailor Ankara Shirt', 'tailor-ankara-shirt', 'Tailor', 'Breathable short-sleeve cotton Ankara shirt in a tailored fit.', false, 260),
  ('fashion', 'Voyage Laptop Backpack', 'voyage-leather-backpack', 'Voyage', 'Padded laptop compartment, water-resistant lining and reinforced straps.', false, 175),
  ('home-kitchen', 'Hearth Non-stick Pan Set', 'hearth-nonstick-pan-set', 'Hearth', 'Three-piece non-stick pan set for gas, electric and induction hobs.', true, 300),
  ('home-kitchen', 'Brew Electric Kettle 1.8L', 'brew-electric-kettle', 'Brew', 'Stainless steel kettle with automatic shut-off and boil-dry protection.', false, 455),
  ('home-kitchen', 'Hearth Cotton Bedding Set', 'linen-bedding-set', 'Hearth', 'Soft cotton-blend duvet cover, fitted sheet and two pillowcases.', false, 120),
  ('beauty', 'Glow Shea Body Butter', 'glow-shea-body-butter', 'Glow', 'Moisturising shea body butter with a lightweight, non-greasy feel.', false, 890),
  ('beauty', 'Glow Vitamin C Serum', 'glow-vitamin-c-serum', 'Glow', 'Lightweight daily vitamin C serum for a simple skincare routine.', true, 610),
  ('groceries', 'Harvest Jollof Rice 5kg', 'harvest-jollof-rice-5kg', 'Harvest', 'Parboiled long-grain rice suitable for family meals and jollof rice.', true, 540),
  ('groceries', 'GoldPalm Vegetable Oil 2L', 'goldpalm-vegetable-oil-2l', 'GoldPalm', 'Refined vegetable oil in a practical two-litre bottle.', false, 390),
  ('baby-kids', 'Little Steps Baby Wipes 4-Pack', 'little-steps-baby-wipes-4-pack', 'Little Steps', 'Four soft, fragrance-free packs for everyday baby care.', false, 280)
) as v(category_slug, name, slug, brand, description, is_featured, units_sold)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Variant triggers in 0001_schema.sql calculate each product's displayed price and stock.
-- Comparisons are optional and, when present, are greater than the live price.
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select p.id, v.sku, v.variant_name, v.options::jsonb, v.price_kobo, v.compare_at_kobo, v.stock, true
from (values
  ('nova-x5-smartphone', 'NOVA-X5-128', '128GB', '{"storage":"128GB"}', 28900000, 31500000, 25),
  ('nova-x5-smartphone', 'NOVA-X5-256', '256GB', '{"storage":"256GB"}', 33500000, null, 12),
  ('nova-tab-10-tablet', 'NOVA-TAB10', 'Default', '{}', 16500000, null, 18),
  ('aria-slim-14-laptop', 'ARIA-SLIM14', 'Default', '{}', 68500000, 75000000, 9),
  ('aria-wireless-mouse', 'ARIA-MOUSE', 'Default', '{}', 850000, null, 120),
  ('pulse-over-ear-headphones', 'PULSE-OE', 'Default', '{}', 4200000, 5500000, 40),
  ('beam-43-4k-smart-tv', 'BEAM-43', 'Default', '{}', 32000000, null, 6),
  ('pulse-portable-speaker', 'PULSE-SPK', 'Default', '{}', 2850000, null, 30),
  ('stride-classic-sneakers', 'STRIDE-40', 'Size 40', '{"size":"40"}', 3800000, null, 14),
  ('stride-classic-sneakers', 'STRIDE-42', 'Size 42', '{"size":"42"}', 3800000, null, 20),
  ('stride-classic-sneakers', 'STRIDE-44', 'Size 44', '{"size":"44"}', 3800000, null, 8),
  ('tailor-ankara-shirt', 'TAILOR-ANK-M', 'Medium', '{"size":"M"}', 1850000, null, 18),
  ('tailor-ankara-shirt', 'TAILOR-ANK-L', 'Large', '{"size":"L"}', 1850000, null, 17),
  ('voyage-leather-backpack', 'VOYAGE-BP', 'Default', '{}', 4500000, 6000000, 22),
  ('hearth-nonstick-pan-set', 'HEARTH-PAN3', 'Default', '{}', 3600000, null, 28),
  ('brew-electric-kettle', 'BREW-18', 'Default', '{}', 1450000, null, 60),
  ('linen-bedding-set', 'HEARTH-LINEN', 'Queen', '{"size":"Queen"}', 3200000, 4000000, 15),
  ('glow-shea-body-butter', 'GLOW-SHEA', 'Default', '{}', 650000, null, 200),
  ('glow-vitamin-c-serum', 'GLOW-VITC', 'Default', '{}', 1250000, 1500000, 85),
  ('harvest-jollof-rice-5kg', 'HARVEST-RICE-5KG', '5kg', '{"weight":"5kg"}', 725000, null, 75),
  ('goldpalm-vegetable-oil-2l', 'GOLDPALM-OIL-2L', '2L', '{"volume":"2L"}', 1180000, null, 54),
  ('little-steps-baby-wipes-4-pack', 'LSTEPS-WIPES-4', '4-pack', '{"pack":"4"}', 960000, 1100000, 48)
) as v(product_slug, sku, variant_name, options, price_kobo, compare_at_kobo, stock)
join public.products p on p.slug = v.product_slug
on conflict (sku) do nothing;

-- Additional 30 illustrative products. Variants are added only for products inserted by
-- this statement, so an existing product with a matching slug is never modified.
with new_products as (
  insert into public.products
    (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
  select c.id, v.name, v.slug, v.brand, v.description, true, v.is_featured, 0
  from (values
    ('phones-tablets', 'Nova Air 6 Smartphone', 'nova-air-6-smartphone', 'Nova', '6.5-inch AMOLED display, 8GB memory and 128GB storage for everyday work and entertainment.', true),
    ('phones-tablets', 'Nova Edge 256 Smartphone', 'nova-edge-256-smartphone', 'Nova', '6.7-inch display, 256GB storage, dual rear cameras and fast charging.', false),
    ('phones-tablets', 'Nova Tab S 11 Tablet', 'nova-tab-s-11-tablet', 'Nova', '11-inch tablet with a bright display, 128GB storage and included stylus.', false),
    ('phones-tablets', 'Nova Blue 5G Smartphone', 'nova-blue-5g-smartphone', 'Nova', '5G-ready smartphone with a 6.6-inch display, 128GB storage and dual SIM support.', false),
    ('computing', 'Aria Core 15 Laptop', 'aria-core-15-laptop', 'Aria', '15.6-inch Full HD laptop with 16GB memory and a 512GB solid-state drive.', true),
    ('computing', 'Aria Flex 13 Laptop', 'aria-flex-13-laptop', 'Aria', 'Portable 13.3-inch laptop with 8GB memory, 512GB storage and an all-day battery.', false),
    ('computing', 'Aria Studio 16 Laptop', 'aria-studio-16-laptop', 'Aria', '16-inch laptop with a high-resolution display, 16GB memory and 1TB storage.', false),
    ('electronics', 'Pulse Studio Wireless Headphones', 'pulse-studio-wireless-headphones', 'Pulse', 'Over-ear wireless headphones with cushioned ear cups and built-in microphone.', true),
    ('electronics', 'Pulse Mini Bluetooth Speaker', 'pulse-mini-bluetooth-speaker', 'Pulse', 'Compact Bluetooth speaker with portable design and clear everyday audio.', false),
    ('electronics', 'Pulse Classic Bluetooth Headphones', 'pulse-classic-bluetooth-headphones', 'Pulse', 'Foldable Bluetooth headphones with on-ear controls and rechargeable battery.', false),
    ('electronics', 'Nova Buds Wireless Earphones', 'nova-buds-wireless-earphones', 'Nova', 'True wireless earphones with a pocket charging case and touch controls.', false),
    ('fashion', 'Tailor White Cotton Shirt', 'tailor-white-cotton-shirt', 'Tailor', 'Long-sleeve cotton-blend shirt with a classic collar for work and occasions.', true),
    ('fashion', 'Tailor Patterned Two-Piece Set', 'tailor-patterned-two-piece-set', 'Tailor', 'Comfortable patterned two-piece outfit with an easy fit for warm weather.', false),
    ('fashion', 'Tailor Casual Streetwear Set', 'tailor-casual-streetwear-set', 'Tailor', 'Relaxed casual top and trouser set made for everyday outings.', false),
    ('fashion', 'Stride Urban Running Sneakers', 'stride-urban-running-sneakers', 'Stride', 'Lightweight lace-up sneakers with cushioned soles for walking and daily wear.', true),
    ('fashion', 'Stride Canvas Low-Top Trainers', 'stride-canvas-low-top-trainers', 'Stride', 'Classic canvas low-top trainers with a flexible rubber sole.', false),
    ('fashion', 'Stride Everyday White Sneakers', 'stride-everyday-white-sneakers', 'Stride', 'Versatile low-top sneakers with padded lining and a clean everyday profile.', false),
    ('fashion', 'Voyage Black Sling Bag', 'voyage-black-sling-bag', 'Voyage', 'Compact crossbody sling bag with adjustable strap and zipped storage.', false),
    ('fashion', 'Voyage Pink Crossbody Bag', 'voyage-pink-crossbody-bag', 'Voyage', 'Lightweight crossbody bag with adjustable strap for daily essentials.', false),
    ('fashion', 'Voyage Travel Essentials Backpack', 'voyage-travel-essentials-backpack', 'Voyage', 'Roomy travel backpack with multiple compartments and padded shoulder straps.', false),
    ('home-kitchen', 'Brew Compact Electric Kettle', 'brew-compact-electric-kettle', 'Brew', 'Compact electric kettle with automatic shut-off and a removable filter.', true),
    ('home-kitchen', 'BlendPro 1.5L Countertop Blender', 'blendpro-15l-countertop-blender', 'BlendPro', '1.5-litre countertop blender for smoothies, soups and everyday food preparation.', false),
    ('home-kitchen', 'Hearth 20L Microwave Oven', 'hearth-20l-microwave-oven', 'Hearth', '20-litre microwave oven with simple controls and multiple power settings.', false),
    ('beauty', 'Glow Hydrating Face Serum 30ml', 'glow-hydrating-face-serum-30ml', 'Glow', 'Lightweight dropper serum for a simple daily skincare routine.', true),
    ('beauty', 'Glow Botanical Body Lotion 250ml', 'glow-botanical-body-lotion-250ml', 'Glow', 'Daily body lotion with a light texture for after-bath moisturising.', false),
    ('groceries', 'Harvest Premium Rice 10kg', 'harvest-premium-rice-10kg', 'Harvest', '10kg bag of parboiled long-grain rice for family meals and jollof.', true),
    ('groceries', 'GoldPalm Groundnut Oil 1L', 'goldpalm-groundnut-oil-1l', 'GoldPalm', 'One-litre bottle of groundnut cooking oil for everyday meals.', false),
    ('groceries', 'Harvest Rice and Beans Pantry Bundle', 'harvest-rice-beans-pantry-bundle', 'Harvest', 'Pantry bundle with rice and beans for convenient family cooking.', false),
    ('baby-kids', 'Little Steps Baby Diapers Size 3', 'little-steps-baby-diapers-size-3', 'Little Steps', 'Soft disposable diapers in size 3 for everyday baby care.', true),
    ('baby-kids', 'Little Steps Newborn Care Starter Pack', 'little-steps-newborn-care-starter-pack', 'Little Steps', 'Newborn care bundle with gentle wipes and everyday changing essentials.', false)
  ) as v(category_slug, name, slug, brand, description, is_featured)
  join public.categories c on c.slug = v.category_slug
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select np.id, v.sku, 'Default', '{}'::jsonb, v.price_kobo, null, v.stock, true
from new_products np
join (values
  ('nova-air-6-smartphone', 'NOVA-AIR6-128', 25900000, 18),
  ('nova-edge-256-smartphone', 'NOVA-EDGE256', 32500000, 12),
  ('nova-tab-s-11-tablet', 'NOVA-TABS11', 22800000, 15),
  ('nova-blue-5g-smartphone', 'NOVA-BLUE5G', 36000000, 8),
  ('aria-core-15-laptop', 'ARIA-CORE15', 48500000, 9),
  ('aria-flex-13-laptop', 'ARIA-FLEX13', 62500000, 6),
  ('aria-studio-16-laptop', 'ARIA-STUDIO16', 92500000, 4),
  ('pulse-studio-wireless-headphones', 'PULSE-STUDIO-WH', 5600000, 35),
  ('pulse-mini-bluetooth-speaker', 'PULSE-MINI-BT', 3450000, 42),
  ('pulse-classic-bluetooth-headphones', 'PULSE-CLASSIC-BT', 4900000, 28),
  ('nova-buds-wireless-earphones', 'NOVA-BUDS-TWS', 1250000, 60),
  ('tailor-white-cotton-shirt', 'TAILOR-WHITE-S', 2800000, 24),
  ('tailor-patterned-two-piece-set', 'TAILOR-PATTERN-SET', 4500000, 16),
  ('tailor-casual-streetwear-set', 'TAILOR-STREET-SET', 3200000, 19),
  ('stride-urban-running-sneakers', 'STRIDE-URBAN-42', 5500000, 16),
  ('stride-canvas-low-top-trainers', 'STRIDE-CANVAS-41', 3200000, 22),
  ('stride-everyday-white-sneakers', 'STRIDE-WHITE-40', 4800000, 14),
  ('voyage-black-sling-bag', 'VOYAGE-SLING-BLK', 3800000, 20),
  ('voyage-pink-crossbody-bag', 'VOYAGE-CROSSBODY-PNK', 7200000, 10),
  ('voyage-travel-essentials-backpack', 'VOYAGE-TRAVEL-BP', 5900000, 17),
  ('brew-compact-electric-kettle', 'BREW-COMPACT-KETTLE', 2200000, 32),
  ('blendpro-15l-countertop-blender', 'BLENDPRO-15L', 3800000, 24),
  ('hearth-20l-microwave-oven', 'HEARTH-MICRO-20L', 11500000, 7),
  ('glow-hydrating-face-serum-30ml', 'GLOW-HYDRATE-30', 1650000, 72),
  ('glow-botanical-body-lotion-250ml', 'GLOW-BOTANICAL-250', 1100000, 95),
  ('harvest-premium-rice-10kg', 'HARVEST-RICE-10KG', 1850000, 48),
  ('goldpalm-groundnut-oil-1l', 'GOLDPALM-GROUNDNUT-1L', 720000, 65),
  ('harvest-rice-beans-pantry-bundle', 'HARVEST-RICE-BEANS-BDL', 1250000, 30),
  ('little-steps-baby-diapers-size-3', 'LSTEPS-DIAPER-S3', 4450000, 40),
  ('little-steps-newborn-care-starter-pack', 'LSTEPS-NEWBORN-STARTER', 3150000, 26)
) as v(product_slug, sku, price_kobo, stock) on v.product_slug = np.slug
on conflict (sku) do nothing;

-- Image files are local WebP assets mapped in download-product-images.mjs and uploaded
-- by upload-product-images.mjs. The uploader creates/updates each product's primary
-- product_images row using the public Storage URL; seed.sql never stores hotlinked URLs.

commit;
